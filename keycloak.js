var unirest = require('unirest');
const store=require("./store");
const HOST=store.KEYCLOAK.HOST;
const KCURL=`${store.KEYCLOAK.PROTOCOL}://${HOST}`;

async function getAllUsers(token, client_id){
    return new Promise((resolve, reject) => {
        unirest.get(`${KCURL}/auth/admin/realms/${client_id}/users?briefRepresentation=true&max=10000`,)
        .header("Content-Type", "application/json")
        .header("Accept", "application/json")
        .header("Authorization", "bearer "+token)
        .then((response) => {
            if(response.error){
                reject(response.error);
            }   
            else{
                resolve(response.body);
            }
        })
    })
}

function getToken(clientid,grantype,clientsecret,scope,username,pass){
    return new Promise((resolve, reject) => {
        var	data= {
            "client_id":"api",
            "grant_type":"password",
            "client_secret":"e0682d9e-49ed-4c74-95ed-a709b3719ca9",
            "scope":"openid",
            "username":"admin",
            "password":"secret",
        };
        unirest.post(`${KCURL}/auth/realms/master/protocol/openid-connect/token`,)
        .header("Content-Type", "application/x-www-form-urlencoded")
        //.header("Accept", "application/json")
        .send(data)
        .then((response) => {
            if(response.error)
                return reject(response.error);
            else
                return resolve(response.body);  
        })
    })
}

async function testAuth(){
    var ret=await getToken(store.KEYCLOAK.CLIENT_ID,
        store.KEYCLOAK.GRANT_TYPE,store.KEYCLOAK.CLIENT_SECRET,
        store.KEYCLOAK.SCOPE,store.KEYCLOAK.USER_NAME,
        store.KEYCLOAK.PASS);
}

async function testUsers(realm){
    var ret=await getToken(store.KEYCLOAK.CLIENT_ID,
        store.KEYCLOAK.GRANT_TYPE,store.KEYCLOAK.CLIENT_SECRET,
        store.KEYCLOAK.SCOPE,store.KEYCLOAK.USER_NAME,
        store.KEYCLOAK.PASS);
    ret=await getAllUsers(ret.access_token,realm); 
    return ret;
}

module.exports = {
    getUsersList:testUsers
}
//testAuth();
//testUsers();
