var tab=require("./tableau");
var kc=require("./keycloak");
const readline=require("readline");
const confirm=readline.createInterface({
    input:process.stdin,
    output:process.stdout
})

async function compareRepo(realm){
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
                siteRole:"Viewer",
                password:"",
                authSetting:"ServerDefault",
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
    //console.log("Exist in KC but not in Tableau",toCreate)
    //console.log("Exist in Tableau but not in KC",toDelete)
    return {toDel:toDelete,toAdd:toCreate}
}

async function main(realm){
    // FOR TEST PURPOSE, DO NOT VALIDATE CERT
    process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;
    var ret=await compareRepo(realm);
    console.log("The following users are not yet in Tableau:",ret.toAdd)
    confirm.question(`Are you sure you want to create ${ret.toAdd.length} users in Tableau (Y/N)?  `, (e)=>{
        if(e.toLowerCase()=="y")
            ret.toAdd.map(async (el)=>{
                await tab.addUser(el);
        });
        confirm.close();
    });
}

main("testsaml");

