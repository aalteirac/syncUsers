import pkg from 'unirest';
const { post, get, put } = pkg;
import { KEYCLOAK } from "../store.js";
const HOST=KEYCLOAK.HOST;
const KCURL=`${KEYCLOAK.PROTOCOL}://${HOST}`;

async function getAllUsers(token, client_id){
    return new Promise((resolve, reject) => {
        get(`${KCURL}/auth/admin/realms/${client_id}/users?briefRepresentation=true&max=10000`,)
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
            "client_id":clientid,
            "grant_type":grantype,
            "client_secret":clientsecret,
            "scope":scope,
            "username":username,
            "password":pass,
        };
        post(`${KCURL}/auth/realms/master/protocol/openid-connect/token`,)
        .header("Content-Type", "application/x-www-form-urlencoded")
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
    var ret=await getToken(KEYCLOAK.CLIENT_ID,
        KEYCLOAK.GRANT_TYPE,KEYCLOAK.CLIENT_SECRET,
        KEYCLOAK.SCOPE,KEYCLOAK.USER_NAME,
        KEYCLOAK.PASS);
}

async function testUsers(realm){
    var ret=await getToken(KEYCLOAK.CLIENT_ID,
        KEYCLOAK.GRANT_TYPE,KEYCLOAK.CLIENT_SECRET,
        KEYCLOAK.SCOPE,KEYCLOAK.USER_NAME,
        KEYCLOAK.PASS).catch(error=> {console.log("ERR_KEYCLOAK_AUTHENTICATION:",error)});
    ret=await getAllUsers(ret.access_token,realm);
    return ret;
}

export const getKCUsersList = testUsers;
