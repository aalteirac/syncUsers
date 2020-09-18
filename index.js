var tab=require("./lib/tableau");
var kc=require("./lib/keycloak");
var help=require("./help");
const readline=require("readline");
const yargs = require('yargs');
var log=true;

const confirm=readline.createInterface({
    input:process.stdin,
    output:process.stdout
})

async function compareRepo(realm,strole,authset){
    var tbu=await tab.getUsersList();
    var kcu=await kc.getUsersList(realm);
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

async function sync(realm,defaultSiteRole="Viewer",defaultAuthSetting="ServerDefault"){
    console.log('Comparing repositories now...');
    var ret=await compareRepo(realm,defaultSiteRole,defaultAuthSetting);
    console.log("The following users are not yet in Tableau:",ret.toAdd)
    confirm.question(`Are you sure you want to create ${ret.toAdd.length} user${ret.toAdd.length>1?"s":""} in Tableau (Y/N)?  `, (e)=>{
        if(e.toLowerCase()=="y")
            ret.toAdd.map(async (el)=>{
                try {
                    var ret=await tab.addUser(el);
                    logit(`INFO: ${el.name} successfully imported`);
                } catch (error) {
                    logit(`ERROR: ${el.name} not imported,`,error.error)
                }
        });
        confirm.close();
    });
}

async function goCompare(realm){
    console.log('Comparing repositories now...');
    try {
        var ret=await compareRepo(realm,"N/A","N/A");
        console.log('-----------------------------------------------------------------------------------------------');
        console.log("Exist in KC but not in Tableau",ret.toAdd)
        console.log('-----------------------------------------------------------------------------------------------');
        console.log("Exist in Tableau but not in KC",ret.toDel)
    } catch (error) {
        logit(`ERROR:`,error)
    }
    
};

function logit(mess,scnd=""){
    if(log==true)
        console.log(mess,scnd);
}

yargs.command('compare', 'Compare KeyCloak and Tableau Users', (yargs) => {}, async (argv) => {
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
            await sync(argv.realm,argv.defaultSiteRole,argv.defaultAuthSetting,true);
        }  
    }).command('*', 'KeyCloak->Tableau Sync Users Utility', (yargs) => {}, (argv) => {
        console.log(help.help_splash);
        process.exit(0);
    }).argv;