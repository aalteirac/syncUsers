import { addUser,getUsersList,unLicenseTableauUser,addUserToGroup,getTableauGroupByName, removeUserToGroup, createTableauGroup,updateTableauUser } from "./lib/tableau.js";
// import { getIDPUsersList } from "./lib/keycloak.js";
//import { getIDPUsersList } from "./lib/auth0.js";
import { help_splash } from "./lib/help.js";
import { createInterface } from "readline";
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import auth0 from "./lib/auth0.js";
import kcg from "./lib/keycloak.js";
var getIDPUsersList=auth0;
var log=true;

const confirm=createInterface({
    input:process.stdin,
    output:process.stdout
})

async function compareRepo(realm,strole,authset,idp_from_groups){
    var kcu=await getIDPUsersList(realm);
    if(typeof(idp_from_groups)!="undefined"){
        logit(`INFO: Only users in IDP belonging to group(s) ${idp_from_groups} will be considered during the syncronization process.`);
        idp_from_groups=idp_from_groups.split(',');
        var kcu=kcu.filter((us)=>{
            let found=false;
            us.groups.map((grp)=>{
                idp_from_groups.map((idpgrp)=>{
                    if(grp.name===idpgrp){
                        found= true;
                    }
                })
            })
            return found;
        })
    }
    var tbu=await getUsersList();
    var toCreate=[];
    var toDelete=[];
    kcu.map((kcuser)=>{
        var found=false;
        tbu.map((tabuser)=>{
            if(tabuser.name.toLowerCase()==kcuser.username.toLowerCase()){
                found=true;
            }
        })
        if(found===false){
            toCreate.push({name:kcuser.username,
                fullName:kcuser.firstName +' '+ kcuser.lastName,
                siteRole:strole,
                password:"",
                authSetting:authset,
                groups:kcuser.groups,
                email:kcuser.email
            });
        }
    })
    tbu.map((tabuser)=>{
        var found=false;
        kcu.map((kcuser)=>{
            if(tabuser.name.toLowerCase()==kcuser.username.toLowerCase()){
                found=true;
            }
        })
        if(found===false)
            toDelete.push(tabuser);
    })
    return {toDel:toDelete,toAdd:toCreate}
}

async function getUsersBothRepo(realm){
    var kcu=await getIDPUsersList(realm);
    var tbu=await getUsersList();
    return {kcu:kcu,tbu:tbu}
}

function getIdpUsersForGroup(allusers,groupname){
    var groupusers=allusers.filter((us)=>{
        let found=false;
        us.groups.map((grp)=>{
            if(grp.name===groupname){
                found= true;
            }
        })
        return found;
    })
    return groupusers;
}

function getTableauUsersForGroup(tabusers,groupname){
    var groupusers=tabusers.filter((us)=>{
        let found=false;
        us.groups.map((grp)=>{
            if(grp.name===groupname){
                found= true;
            }
        })
        return found;
    })
    return groupusers;
}

async function prettyprintGroupCompare(resultCompare){
    var something=false;
    for (let index = 0; index < resultCompare.groups.length; index++) {
        let agroup = resultCompare.groups[index];
        let tabUserToAdd = resultCompare.tabtoadd[index];
        let tabUserToRemove = resultCompare.tabtoremove[index];
        for (let i = 0; i < tabUserToAdd.length; i++) {
            const el = tabUserToAdd[i];
            logit(`INFO: ${el.name} will be added to ${agroup}`);
            something=true;
        }
        for (let z = 0; z < tabUserToRemove.length; z++) {
            const el = tabUserToRemove[z];
            logit(`INFO: ${el.name} will be removed from ${agroup}`);
            something=true;         
        }
    }
    return something
}

async function _groupsync(realm,force,idp_from_groups,createGroups,defaultSiteRole,defaultAuthSetting,ignoredelete,createUsers){
    if(createUsers)
        var uu=await sync(realm,defaultSiteRole,defaultAuthSetting,force,ignoredelete,idp_from_groups);
    else{
        logit(`INFO: Automatic user creation is disabled, if you want to activate use: "--CREATE_USERS"`)
    }
    //HERE USERS ARE PERHAPS NOT YET CREATED IN TOL....
    var resultingChanges=await groupsyncCompare(realm,idp_from_groups);  
    for (let i = 0; i < resultingChanges.tabgrouptoadd.length; i++) {
        const gradd = resultingChanges.tabgrouptoadd[i];
        if(createGroups)
            logit(`INFO: "${gradd}" doesn't exist in Tableau, according to your choice, it will be automatically created!`)
        else    
            logit(`WARN: "${gradd}" doesn't exist in Tableau, allocation to this group won't be performed!\n      Create "${gradd}" manually in Tableau or use "--CREATE_GROUPS" for the tool to create it for you.`);
    }
    if(force){
        var hasChanges=await prettyprintGroupCompare(resultingChanges)
        if(hasChanges==true)
            await groupsync(resultingChanges,createGroups);
        else{
            logit("INFO: No change to perform for groups, all good then !");
            }
        process.exit(0); 
    }
    else{
        var hasChanges=await prettyprintGroupCompare(resultingChanges)
        if(hasChanges==true)
            confirm.question(`Are you sure to synchronize group allocation for "${idp_from_groups}" ?`, async (e)=>{
                if(e.toLowerCase()=="y"){
                    await groupsync(resultingChanges,createGroups);
                    confirm.close();
                }
                else{    
                    confirm.close();
                }
                process.exit(0);     
            })
        else{
            logit("INFO: No change to perform for groups, all good then !");
            process.exit(0);     
        }
             
    }    
}

async function groupsync(resultCompare,createGroups){
    return new Promise(async (resolve,reject)=>{
        var allDone=[];
        if(createGroups==true){
            for (let index = 0; index < resultCompare.tabgrouptoadd.length; index++) {
                const gradd = resultCompare.tabgrouptoadd[index];
                await createTableauGroup(gradd);
                logit(`INFO: "${gradd}" has been created!`); 
            }
        }
        for (let index = 0; index < resultCompare.groups.length; index++) {
            let agroup = resultCompare.groups[index];
            let tabUserToAdd = resultCompare.tabtoadd[index];
            let tabUserToRemove = resultCompare.tabtoremove[index];
            await allocateThem(tabUserToAdd,tabUserToRemove,agroup,createGroups) ;
        }
         resolve();
    })
}

async function groupsyncCompare(realm,idp_from_groups){
    return new Promise(async (resolve,reject)=>{
        logit('INFO: 2 - Comparing Groups allocation...');
        idp_from_groups=idp_from_groups.split(',');
        var ret=await getUsersBothRepo(realm);
        var tbu=ret.tbu;
        var kcu=ret.kcu;
        var resultingChanges={groups:[],tabtoadd:[],tabtoremove:[],tabgrouptoadd:[]}
        for (let index = 0; index < idp_from_groups.length; index++) {
            var tabUserToRemove=[];
            var tabUserToAdd=[];
            let agroup = idp_from_groups[index];
            var gr=await getTableauGroupByName(agroup);
            let idpgroupusers=getIdpUsersForGroup(kcu,agroup);
            let tabgroupusers=getTableauUsersForGroup(tbu,agroup);
            //group to add in tableau 
            if(typeof(gr)=='undefined'){
                resultingChanges.tabgrouptoadd.push(agroup)
            }
            //to add:
            idpgroupusers.map((idpuser)=>{
                var found=false;
                tbu.map((tabu)=>{
                    if(tabu.name==idpuser.username){
                        //check if already in the group ?
                        var isAlready=false;
                        tabu.groups.map((g)=>{
                            if(g.name==agroup){
                                isAlready=true;
                            }
                        })
                        if(isAlready==false){
                            tabUserToAdd.push(tabu);
                        }
                    }
                })
                if(found==false){
                    //create the user and attach to group...
                }
            });
            //to del:
            tabgroupusers.map((tuser)=>{
                var found=false;
                idpgroupusers.map((idpuser)=>{
                    if(tuser.name==idpuser.username){
                        found=true;
                    }
                })
                if (found==false){
                    tabUserToRemove.push(tuser);
                }
            })
            resultingChanges.groups.push(agroup);
            resultingChanges.tabtoadd.push(tabUserToAdd);
            resultingChanges.tabtoremove.push(tabUserToRemove);
        }
        resolve(resultingChanges);
    })
}

async function waitTillGroupExists(grpname){
    var tabgroup=await getTableauGroupByName(grpname);
    if(typeof(tabgroup)!='undefined'){
        return tabgroup;
    }
    else{
        logit(`INFO: Waiting for ${grpname} to be available...`);
        return await waitTillGroupExists(grpname);
    }
}
async function allocateThem(tabUserToAdd,tabUserToRemove,agroup,createGroups){
    return new Promise(async (resolve,reject)=>{
        for (let index = 0; index < tabUserToAdd.length; index++) {
            const el = tabUserToAdd[index];
            var tabgroup=await getTableauGroupByName(agroup);
            if(createGroups && typeof(tabgroup)=='undefined'){
                tabgroup= await waitTillGroupExists(agroup); 
                logit(`INFO: ${agroup} is now available!`)   
            }   
            if(tabgroup && tabgroup.length>0){
                tabgroup=tabgroup[0]
                await addUserToGroup(tabgroup.id,el.id);
                logit(`INFO: ${el.name} successfully added to "${tabgroup.name}"`);
            } else{
                logit(`WARN: ${el.name} has not been added to "${agroup}" group because "${agroup}" doesn't exist in Tableau!`);
            }   
        }
        for (let index = 0; index < tabUserToRemove.length; index++) {
            const el = tabUserToRemove[index];
            var tabgroup=await getTableauGroupByName(agroup);
            if(tabgroup && tabgroup.length>0){
                tabgroup=tabgroup[0]
                await removeUserToGroup(tabgroup.id,el.id);
                logit(`INFO: ${el.name} successfully removed from "${tabgroup.name}"`);
            }    
        }
        resolve();
    })
}

async function sync(realm,defaultSiteRole="Unlicensed",defaultAuthSetting="ServerDefault",force,ignoredelete,idp_from_groups,tableau_to_group){
    return new Promise(async (resolve,reject)=>{
        logit('INFO: 1 - Comparing users...');
        var ret=await compareRepo(realm,defaultSiteRole,defaultAuthSetting,idp_from_groups);
        if(ret.toAdd.length>0)logit("The following users are not yet in Tableau:",ret.toAdd);
        if(typeof(ignoredelete)=='undefined')logit("The following users need to be Unlicensed in Tableau:",ret.toDel);
        var qq=ret.toAdd.length>0?`Are you sure you want to create ${ret.toAdd.length} user${ret.toAdd.length>1?"s":""}`:""
        if(qq!="" && typeof(ignoredelete)=='undefined')
            qq=ret.toDel.length>0?qq+` and unlicense ${ret.toDel.length} user${ret.toDel.length>1?"s":""}`:qq
        else if(typeof(ignoredelete)=='undefined')
            qq=ret.toDel.length>0?`Are you sure you want to unlicense ${ret.toDel.length} user${ret.toDel.length>1?"s":""}`:qq
        if(qq!="")   
            qq=qq+" in Tableau (Y/N)?" 
        if(ret.toDel.length>0 && typeof(ignoredelete)=='undefined')
            qq=qq+"\nNote: You will still have the opportunity to determine which individuals to unlicense on the next step:";    
        if(qq==""){
            logit("INFO: No change to perform for users, all good then !\n");
            resolve();
            return;
        }    
        if(typeof(force)=='undefined'){
            confirm.question(qq, async (e)=>{
                if(e.toLowerCase()=="y"){
                    await doit(ret,tableau_to_group,ignoredelete)
                    resolve();
                }
                else  {  
                    resolve();
                }
            });
        }
        else{
            await doit(ret,tableau_to_group,ignoredelete);
            resolve();
        }
    })
    
}

async function doit(ret,tableau_to_group,ignoredelete){
    return new Promise(async (resolve,reject)=>{
        for (let id = 0; id < ret.toAdd.length; id++) {
            const el = ret.toAdd[id];
            try {
                //TEST IF TOL AND USER NAME IS NOT EMAIL
                await addUser(el);
                logit(`INFO: ${el.name} successfully imported`);
            } catch (error) {
                logit(`ERROR: ${el.name} perhaps imported but something goes wrong... pls check,`,error.error,error)
            }
            
        }
        if(typeof(ignoredelete)=='undefined')
        for (let index = 0; index < ret.toDel.length; index++) {
            const element = ret.toDel[index];
            await unlicenseUser(element);
        }
        //TRY TO FIX WHEN ALLOCATING NEW USERS AND NOT YET FULLY CREATED IN TABLEAU
        setTimeout(() => {
            resolve();
        }, 2000);
    })
}

async function unlicenseUser(user){
    return new Promise((resolve, reject) => {
        try {
            confirm.question(`Are you sure you want to unlicense  ${user.fullName} ?  `, async (e2)=>{
                if(e2.toLowerCase()=="y"){
                    var ret=await unLicenseTableauUser(user);
                    logit(`INFO: ${user.name} successfully unlicensed`);
                    resolve();
                }
                resolve();
            });
        } catch (error) {
            logit(`ERROR: ${el.name} not unlicensed,`,error);
            reject();
        }
    })
}

async function goCompare(realm,defaultSiteRole="Unlicensed",defaultAuthSetting="ServerDefault",idp_from_groups){
    console.log('INFO: Comparing users repositories now...');
    try {
        var ret=await compareRepo(realm,defaultSiteRole,defaultAuthSetting,idp_from_groups);
        console.log('-----------------------------------------------------------------------------------------------');
        console.log("Exist in IDP but not in Tableau",ret.toAdd)
        console.log('-----------------------------------------------------------------------------------------------');
        console.log("Exist in Tableau but not in IDP",ret.toDel)
        console.log('-----------------------------------------------------------------------------------------------');
    } catch (error) {
        logit(`ERROR:`,error)
    }
    
};

async function logit(mess,scnd=""){
    if(log==true)
        console.log(mess,scnd);
}

async function _updateLic(FORCE,tableau_groups,defaultSiteRole,defaultAuthSetting="ServerDefault"){
    logit(`INFO: Getting users from ${tableau_groups}...`);
    var tbu=await getUsersList();
    var allToUp=[];
    tableau_groups=tableau_groups.split(',');
    for (let index = 0; index < tableau_groups.length; index++) {
        let agroup = tableau_groups[index];
        var toup=getTableauUsersForGroup(tbu,agroup);
        allToUp=allToUp.concat(toup);
    }
    logit(`INFO: ${allToUp.length} users will be updated`);
    if(typeof(FORCE)=='undefined'){
        confirm.question(`Are you sure to update ${allToUp.length} users in "${tableau_groups}" ?`, async (e)=>{
            if(e.toLowerCase()=="y"){
                for (let i = 0; i < allToUp.length; i++) {
                    const up = allToUp[i];
                    await updateTableauUser(up,defaultSiteRole,defaultAuthSetting);
                    logit(`INFO: ${up.name} has been succesfully updated!`);
                }
            }
            confirm.close();
        })
    }
    else{
        for (let i = 0; i < allToUp.length; i++) {
            const up = allToUp[i];
            var ret =await updateTableauUser(up,defaultSiteRole,defaultAuthSetting);
            logit(`INFO: ${up.name} has been succesfully updated!`);
        }
        process.exit(0);
    }
}
function checkIDPSyntax(idp){
    if(typeof(idp)=='undefined')
        console.log("WARN: IDP is not specified, default is AUTH0, for Keycloack add --IDP=KC")
    else{
        if(idp.toLowerCase()!="auth0" && idp.toLowerCase()!="kc" ){
            console.log("ERROR: " +idp+" IDP not recognised...")
        }
        else{
            if(idp.toLowerCase()=="kc")
                getIDPUsersList=kcg;
            console.log("INFO: " +idp.toUpperCase() +" IDP has been choosen...")
        }
    }    

}
yargs(hideBin(process.argv)).command('compareuser', 'Compare IDP and Tableau Users', (yargs) => {}, async (argv) => {
        checkIDPSyntax(argv.IDP)
        if(!argv.realm || !argv.idp_from_groups)
            console.log("Missing arguments: idp_from_groups or realm")
        else{
            if(argv.NOCERT)
                process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;
            await goCompare(argv.realm,argv.defaultSiteRole,argv.defaultAuthSetting,argv.idp_from_groups);
        }
        process.exit(0);
    }).command('comparegroup', 'Compare IDP group allocation with Tableau group allocation', (yargs) => {}, async (argv) => {
        checkIDPSyntax(argv.IDP)
        if(!argv.realm || !argv.idp_from_groups)
            console.log("Missing arguments: idp_from_groups or realm")
        else{
            if(argv.NOCERT)
                process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;
            var resultingChanges=await groupsyncCompare(argv.realm,argv.idp_from_groups); 
            var hasChanges=await prettyprintGroupCompare(resultingChanges)
            if(hasChanges==false)
                logit("INFO: No change to perform, all good then !");
        }
        process.exit(0);
    }).command('groupsync', 'Synchronize IDP Group users allocation with Tableau Group users allocation', (yargs) => {}, async (argv) => {
        checkIDPSyntax(argv.IDP)
        if(!argv.realm || !argv.idp_from_groups)
            console.log("Missing arguments: idp_from_groups or realm")
        else{
            if(argv.NOCERT)
                process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;
            if(argv.NOLOG)
                log=false;     
            await _groupsync(argv.realm,argv.FORCE,argv.idp_from_groups,argv.CREATE_GROUPS,argv.defaultSiteRole,argv.defaultAuthSetting,argv.IGNORE_DELETION,argv.CREATE_USERS);
            //process.exit(0);
        }  
    }).command('updatelic', 'Update User Licenses in designated group(s)', (yargs) => {}, async (argv) => {
        if(!argv.tableau_groups ||  !argv.siteRole)
            console.log("Missing arguments: tableau_groups, realm, siteRole or authSetting")
        else{
            if(argv.NOCERT)
                process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;
            if(argv.NOLOG)
                log=false;     
            await _updateLic(argv.FORCE,argv.tableau_groups,argv.siteRole,argv.authSetting);
        }  
    }).command('*', 'IDP->Tableau Sync Users Utility', (yargs) => {}, (argv) => {
        console.log(help_splash);
        process.exit(0);
    }).argv;
