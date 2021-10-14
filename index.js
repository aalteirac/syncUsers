import { addUser,getUsersList,unLicenseTableauUser,addUserToGroup,getTableauGroupByName, removeUserToGroup } from "./lib/tableau.js";
import { getKCUsersList } from "./lib/keycloak.js";
import { help_splash } from "./lib/help.js";
import { createInterface } from "readline";
import yargs from 'yargs'
import { hideBin } from 'yargs/helpers'
var log=true;

const confirm=createInterface({
    input:process.stdin,
    output:process.stdout
})

async function compareRepo(realm,strole,authset,idp_from_groups){
    var kcu=await getKCUsersList(realm);
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
    var kcu=await getKCUsersList(realm);
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
async function groupsync(realm,defaultSiteRole="Viewer",defaultAuthSetting="ServerDefault",force,ignoredelete,idp_from_groups){
    logit('Comparing Groups allocation now...');
    idp_from_groups=idp_from_groups.split(',');
    var ret=await getUsersBothRepo(realm);
    var tbu=ret.tbu;
    var kcu=ret.kcu;
    for (let index = 0; index < idp_from_groups.length; index++) {
        //does the group exist in tableau ?
        var tabUserToRemove=[];
        var tabUserToAdd=[];
        let agroup = idp_from_groups[index];
        let idpgroupusers=getIdpUsersForGroup(kcu,agroup);
        let tabgroupusers=getTableauUsersForGroup(tbu,agroup);
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
                            //console.log(tabu.name+" already in group")
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
        //now the do the job
        for (let index = 0; index < tabUserToAdd.length; index++) {
            const el = tabUserToAdd[index];
            var tabgroup=await getTableauGroupByName(agroup);
            if(tabgroup && tabgroup.length>0){
                tabgroup=tabgroup[0]
                await addUserToGroup(tabgroup.id,el.id);
                logit(`INFO: ${el.name} successfully added to ${tabgroup.name}`);
            }    
        }
        for (let index = 0; index < tabUserToRemove.length; index++) {
            const el = tabUserToRemove[index];
            var tabgroup=await getTableauGroupByName(agroup);
            if(tabgroup && tabgroup.length>0){
                tabgroup=tabgroup[0]
                await removeUserToGroup(tabgroup.id,el.id);
                logit(`INFO: ${el.name} successfully removed from ${tabgroup.name}`);
            }    
        }
    }
    process.exit(0);
}

async function sync(realm,defaultSiteRole="Viewer",defaultAuthSetting="ServerDefault",force,ignoredelete,idp_from_groups,tableau_to_group){
    logit('Comparing repositories now...');
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
        logit("No change to perform, all good then !");
        process.exit(0);
    }    
    if(typeof(force)=='undefined'){
        confirm.question(qq, (e)=>{
            if(e.toLowerCase()=="y")
                doit(ret,tableau_to_group,ignoredelete)
            else    
                confirm.close();
        });
    }
    else{
        doit(ret,tableau_to_group,ignoredelete);
        confirm.close();
    }
    
}
async function doit(ret,tableau_to_group,ignoredelete){
    if(typeof(tableau_to_group)!="undefined"){
        tableau_to_group=tableau_to_group.split(",");
        var realTSgrp=[];
        for (let idx = 0; idx < tableau_to_group.length; idx++) {
            const grp = tableau_to_group[idx];
            realTSgrp.push(await getTableauGroupByName(grp));
        }
    }
    for (let id = 0; id < ret.toAdd.length; id++) {
        const el = ret.toAdd[id];
        try {
            await addUser(el);
            logit(`INFO: ${el.name} successfully imported`);
            if(typeof(tableau_to_group)!="undefined"){
                for (let index = 0; index < realTSgrp.length; index++) {
                    let gr = realTSgrp[index];
                    if(gr && gr.length>0){
                        gr=gr[0]
                        await addUserToGroup(gr.id,el.id);
                        logit(`INFO: ${el.name} successfully added to ${gr.name}`);
                    }
                    else{
                        logit(`WARN: ${el.name} cannot be added, group "${tableau_to_group[index]}" doesn't exist...`);
                    }
                }
            }
        } catch (error) {
            logit(`ERROR: ${el.name} perhaps imported but something goes wrong... pls check,`,error.error,error)
        }
        
    }
    if(typeof(ignoredelete)=='undefined')
    for (let index = 0; index < ret.toDel.length; index++) {
        const element = ret.toDel[index];
        await unlicenseUser(element);
    }
    confirm.close();
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
async function goCompare(realm){
    console.log('Comparing repositories now...');
    try {
        var ret=await compareRepo(realm,"N/A","N/A");
        console.log('-----------------------------------------------------------------------------------------------');
        console.log("Exist in KC but not in Tableau",ret.toAdd)
        console.log('-----------------------------------------------------------------------------------------------');
        console.log("Exist in Tableau but not in KC",ret.toDel)
        console.log('-----------------------------------------------------------------------------------------------');
        console.log("To be Updated based on KC Definition",ret.toUpdt)
    } catch (error) {
        logit(`ERROR:`,error)
    }
    
};

function logit(mess,scnd=""){
    if(log==true)
        console.log(mess,scnd);
}

yargs(hideBin(process.argv)).command('compare', 'Compare KeyCloak and Tableau Users', (yargs) => {}, async (argv) => {
        if(!argv.realm)
            console.log("Missing arguments...")
        else{
            if(argv.NOCERT)
                process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;
            if(argv.NOLOG)
                log=false;  
            await goCompare(argv.realm,"N/A","N/A");
        }
        process.exit(0);
    }).command('sync', 'Synchronize KeyCloak and Tableau Users', (yargs) => {}, async (argv) => {
        if(!argv.defaultSiteRole || !argv.defaultAuthSetting || !argv.realm)
            console.log("Missing arguments...")
        else{
            if(argv.NOCERT)
                process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;
            if(argv.NOLOG)
                log=false;    
            await sync(argv.realm,argv.defaultSiteRole,argv.defaultAuthSetting,argv.FORCE,argv.IGNORE_DELETION,argv.idp_from_groups,argv.tableau_to_groups);
        }  
    }).command('groupsync', 'Synchronize KeyCloak Group users allocation with Tableau Group users allocation', (yargs) => {}, async (argv) => {
        if(!argv.realm || !argv.idp_from_groups)
            console.log("Missing arguments...")
        else{
            if(argv.NOCERT)
                process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;
            if(argv.NOLOG)
                log=false;    
            await groupsync(argv.realm,argv.defaultSiteRole,argv.defaultAuthSetting,argv.FORCE,argv.IGNORE_DELETION,argv.idp_from_groups);
        }  
    }).command('*', 'KeyCloak->Tableau Sync Users Utility', (yargs) => {}, (argv) => {
        console.log(help_splash);
        process.exit(0);
    }).argv;