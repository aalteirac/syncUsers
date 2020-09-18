var tab=require("./tableau");
var kc=require("./keycloak");
 
// FOR TEST PURPOSE, DO NOT VALIDATE CERT
process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;

async function compareRepo(){
    var tbu=await tab.getUsersList();
    var kcu=await kc.getUsersList("testsaml");
    var toCreate=[];
    var toDelete=[];
    kcu.map((kcuser)=>{
        var found=false;
        tbu.map((tabuser)=>{
            if(tabuser.name.toLowerCase()==kcuser.username.toLowerCase()){
                found=true;
            }
        })
        if(found===false)
            toCreate.push(kcuser);
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
    console.log("Exist in KC but not in Tableau",toCreate)
    console.log("Exist in Tableau but not in KC",toDelete)
}

compareRepo();