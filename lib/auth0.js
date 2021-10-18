import pkg from 'unirest';
const { post, get, put } = pkg;
import { AUTH0, KEYCLOAK } from "../store.js";
const HOST=KEYCLOAK.HOST;
const KCURL=`${KEYCLOAK.PROTOCOL}://${HOST}`;

async function getAllUsers(token,tenant){
    return new Promise((resolve, reject) => {
        get(`https://${tenant}.auth0.com/api/v2/users`,)
        .header("Content-Type", "application/json")
        .header("Accept", "application/json")
        .header("Authorization", "bearer "+token)
        .then(async (response) => {
          if(response.body.error){
              console.log("ERROR RETRIEVING USERS",response.body.error)
              reject(response.body.error);
            }   
            else{
                var users=response.body
                await getGroupsForUsers(token,users,tenant);
                resolve(users);
            }
        })
    })
}

async function getGroupsForUsers(token,users,tenant){
  var allProm=[];
      users.map((user)=>{
          allProm.push (
              get(`https://${tenant}.auth0.com/api/v2/users/${user.user_id}/roles`,)
              .header("Content-Type", "application/json")
              .header("Accept", "application/json")
              .header("Authorization", "bearer "+token)
              .then((response) => {
                  if(response.error){
                      console.log("Error retrieving Groups for " + user.user_id,response.error);
                  }   
                  else{
                      user.groups=response.body;
                      user.id=user.user_id;
                      user.firstName=user.name;
                      user.lastName=user.name;
                      user.username=user.name;
                      user.groups=response.body;
                  }
              })
          )
      })
    return Promise.all(allProm);
}

function getToken(tenant,clientid,grantype,clientsecret,scope){
    return new Promise((resolve, reject) => {
        var	data= {
            "client_id":clientid,
            "grant_type":grantype,
            "client_secret":clientsecret,
            "scope":scope,
            "audience":`https://${tenant}.auth0.com/api/v2/`
        };
        post(`https://${tenant}.auth0.com/oauth/token`,)
        .header("Content-Type", "application/json")
        .send(data)
        .then((response) => {
          if(response.body && response.body.error){
            console.log("ERROR RETRIEVING TOKEN",response.body.error)
            return reject(response.body.error);
          }
          return resolve(response.body);  
        })
    })
}

async function testAuth(){
    var ret=await getToken(AUTH0.CLIENT_ID,
      AUTH0.GRANT_TYPE,AUTH0.CLIENT_SECRET,
      AUTH0.SCOPE,AUTH0.AUDIENCE);
}

async function getUsers(tenant){
    var ret=await getToken(tenant,AUTH0.CLIENT_ID,
      AUTH0.GRANT_TYPE,AUTH0.CLIENT_SECRET,
      AUTH0.SCOPE)
      .catch(error=> {console.log("ERR_AUTH0_AUTHENTICATION:",error)});
    ret=await getAllUsers(ret.access_token,tenant);
    return ret;
}

export const getIDPUsersList = getUsers;