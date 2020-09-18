var tab=require("./tableau");
var kc=require("./keycloak");

//FOR TEST PURPOSE, DO NOT VALIDATE CERT
process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;

async function compareRepo(){
    var tbu=await tab.getUsersList();
    console.log(tbu);
    var kcu=await kc.getUsersList("testsaml");
    console.log(kcu);
}

compareRepo();