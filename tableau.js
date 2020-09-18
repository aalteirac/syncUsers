var unirest = require('unirest');
const store=require("./store");
const HOST=store.TABLEAU.HOST;
const version="3.8";
const TABURL=`${store.TABLEAU.PROTOCOL}://${HOST}/api/${version}`;

function getToken(api_id,api_token,site_id=""){
    return new Promise((resolve, reject) => {
        var	data= {
                "credentials": {
                    "personalAccessTokenName": api_id,
                    "personalAccessTokenSecret": api_token,
                    "site":{
                        "contentUrl": site_id
                    }
                }
        };
        unirest.post(`${TABURL}/auth/signin`,)
        .header("Content-Type", "application/json")
        .header("Accept", "application/json")
        .send(data)
        .then((response) => {
            if(response.error)
                return reject(response.error);
            else
                return resolve(response.body);
        })
    })
}

async function getUsersPage(token,siteid,pagesize=100,pagenum=1){
    return new Promise((resolve, reject) => {
        unirest.get(`${TABURL}/sites/${siteid}/users?pageSize=${pagesize}&pageNumber=${pagenum}`,)
        .header("Content-Type", "application/json")
        .header("Accept", "application/json")
        .header("X-Tableau-Auth", token)
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

async function getAllUsers(users,token,siteid,pagesize=100,pagenum=1){
    var userpage=await getUsersPage(token,siteid,pagesize,pagenum);
    Array.prototype.push.apply(users,userpage.users.user);
    if(users.length == parseInt(userpage.pagination.totalAvailable) ){
        return users;
    }
    else{
        return getAllUsers(users,token,siteid,pagesize,pagenum+1);
        }
}


async function createUser(token,siteid,user){
    return new Promise((resolve, reject) => {
        var	data= {
            "user": {
                "name": user.name,
                "siteRole": user.siterole,
                "authSetting":user.authsetting
            }
        };
        unirest.post(`${TABURL}/sites/${siteid}/users`,)
        .header("Content-Type", "application/json")
        .header("Accept", "application/json")
        .header("X-Tableau-Auth", token)
        .send(data)
        .then((response) => {
            if(response.error){
                reject({error:response.error,user:null});
            }   
            else{
                user.id=response.body.user.id;
                resolve({resp:response.body,user:user});
            }
        })
    })
}

async function updateUser(token,siteid,user){
    return new Promise((resolve, reject) => {
        var	data= {
            "user": {
                "fullName": user.fullname,
                "email":user.email,
                "password":user.password,
                "siteRole": user.siterole,
                "authSetting":user.authsetting
            }
    };
        unirest.put(`${TABURL}/sites/${siteid}/users/${user.id}`,)
        .header("Content-Type", "application/json")
        .header("Accept", "application/json")
        .header("X-Tableau-Auth", token)
        .send(data)
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

async function addUser(token,siteid,user){
    var res=await createUser(token,siteid,user);
    if(res.error) throw res.error;
    res= await updateUser(token,siteid,res.user);
    if(res.error) throw res.error;
    return res;
}

async function getUsersList(){
    var auth=await getToken(store.TABLEAU.API_ID,store.TABLEAU.API_TOKEN,store.TABLEAU.SITE_ID).catch(error=> {console.log("ERR:",error)});
    var allUsers=[];
    await getAllUsers(allUsers,auth.credentials.token,auth.credentials.site.id,100,1).catch(error=> {console.log("ERR:",error)});
    return allUsers;
}

async function testAddUser(user){
    var auth=await getToken(store.TABLEAU.API_ID,store.TABLEAU.API_TOKEN,store.TABLEAU.SITE_ID).catch(error=> {console.log("ERR:",error)});
    // var user={
    //     "id":"",
    //     "fullname":"Anthony API",
    //     "email":"mshridhar@tableau.com",
    //     //"password":password,
    //     "name":"mshridhar",
    //     "siterole":"ExplorerCanPublish",
    //     "authsetting":"SAML" //MANDATORY, cannot be null or need to be removed from json envelop...
    // }
    var res=await addUser(auth.credentials.token,auth.credentials.site.id,user).catch(error=> {console.log("ERR:",error)});
    //console.log(res);
}

module.exports = {
    getUsersList:getUsersList,
    addUser:testAddUser
}

//testAddUser();
//testListUsers();

