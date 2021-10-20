import pkg from 'unirest';
//const { del, post, get, put } = pkg;
import { TABLEAU } from "../store.js";
const HOST=TABLEAU.HOST;
const version="3.8";
const TABURL=`${TABLEAU.PROTOCOL}://${HOST}/api/${version}`;
var cacheToken;
var cacheSiteID;

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
        pkg.post(`${TABURL}/auth/signin`,)
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

async function _getTableauGroupByName(name){
    var inf=await handleAUth();
    return new Promise((resolve, reject) => {
        pkg.get(`${TABURL}/sites/${inf.siteId}/groups?filter=name:eq:${name}`,)
        .header("Content-Type", "application/json")
        .header("Accept", "application/json")
        .header("X-Tableau-Auth", inf.token)
        .then((response) => {
            if(response.error){
                reject(response.error);
            }   
            else{
                resolve(response.body.groups.group);
            }
        })
    })
}
async function _getAllTableauGroups(){
    var inf=await handleAUth();
    return new Promise((resolve, reject) => {
        pkg.get(`${TABURL}/sites/${inf.siteid}/groups`,)
        .header("Content-Type", "application/json")
        .header("Accept", "application/json")
        .header("X-Tableau-Auth", inf.token)
        .then((response) => {
            if(response.error){
                reject(response.error);
            }   
            else{
                resolve(response.body.groups);
            }
        })
    })
}

async function getUserGroups(token,siteid,userid){
    return new Promise((resolve, reject) => {
        pkg.get(`${TABURL}/sites/${siteid}/users/${userid}/groups`,)
        .header("Content-Type", "application/json")
        .header("Accept", "application/json")
        .header("X-Tableau-Auth", token)
        .then((response) => {
            if(response.error){
                reject(response.error);
            }   
            else{
                resolve(response.body.groups);
            }
        })
    })
}

async function getUsersPage(token,siteid,pagesize=100,pagenum=1){
    return new Promise((resolve, reject) => {
        pkg.get(`${TABURL}/sites/${siteid}/users?pageSize=${pagesize}&pageNumber=${pagenum}&fields=_all_`,)
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

async function _removeUserToGroup(groupid,userid){
    var inf=await handleAUth();
    return new Promise((resolve, reject) => {
        var	data= {
            "user": {
                "id": userid,
            }
        };
        pkg.delete(`${TABURL}/sites/${inf.siteId}/groups/${groupid}/users/${userid}`,)
        .header("Content-Type", "application/json")
        .header("Accept", "application/json")
        .header("X-Tableau-Auth", inf.token)
        .send(data)
        .then((response) => {
            if(response.error){
                console.log("Error on REST GROUP DELETION",response.body.error)
                reject(response.error);
            }   
            else{
                resolve(response.body);
            }
        })
    })
}

async function _addUserToGroup(groupid,userid){
    var inf=await handleAUth();
    return new Promise((resolve, reject) => {
        var	data= {
            "user": {
                "id": userid,
            }
        };
        pkg.post(`${TABURL}/sites/${inf.siteId}/groups/${groupid}/users`,)
        .header("Content-Type", "application/json")
        .header("Accept", "application/json")
        .header("X-Tableau-Auth", inf.token)
        .send(data)
        .then((response) => {
            if(response.error){
                console.log("Error on REST CREATION",response.body.error)
                reject(response.error);
            }   
            else{
                resolve(response.body);
            }
        })
    })
}

async function _createGroup(groupname){
    var inf=await handleAUth();
    return new Promise((resolve, reject) => {
        var	data= {
            "group": {
                "name": groupname
            }
        };
        pkg.post(`${TABURL}/sites/${inf.siteId}/groups`,)
        .header("Content-Type", "application/json")
        .header("Accept", "application/json")
        .header("X-Tableau-Auth", inf.token)
        .send(data)
        .then((response) => {
            if(response.error && response.body){
                console.log("Error on REST GROUP CREATION",response.body.error)
                reject({error:response.error});
            }   
            else{
                resolve({resp:response.body});
            }
        })
    })
}

async function createUser(token,siteid,user){
    return new Promise((resolve, reject) => {
        var	data= {
            "user": {
                "name": user.name,
                "siteRole": user.siteRole,
                "authSetting":user.authSetting
            }
        };
        pkg.post(`${TABURL}/sites/${siteid}/users`,)
        .header("Content-Type", "application/json")
        .header("Accept", "application/json")
        .header("X-Tableau-Auth", token)
        .send(data)
        .then((response) => {
            if(response.error){
                console.log("Error on REST CREATION",response.body.error)
                reject({error:response.error,user:null});
            }   
            else{
                user.id=response.body.user.id;
                resolve({resp:response.body,user:user});
            }
        })
    })
}

async function unLicenseUser(token,siteid,user){
    return new Promise((resolve, reject) => {
        var	data= {
            "user": {
                "siteRole": "Unlicensed",
            }
        };
        pkg.put(`${TABURL}/sites/${siteid}/users/${user.id}`,)
        .header("Content-Type", "application/json")
        .header("Accept", "application/json")
        .header("X-Tableau-Auth", token)
        .send(data)
        .then((response) => {
            if(response.error){
                console.log("Error on REST UPDATE",response.body.error)
                reject(response.error);
            }   
            else{
                resolve(response.body);
            }
        })
    })
}

async function _updateTableauUser(user,lic,auth){
    var inf=await handleAUth();
    return new Promise((resolve, reject) => {
        var	data= {
            "user": {
                "siteRole": lic,
                "authSetting":auth
            }
        };
        pkg.put(`${TABURL}/sites/${inf.siteId}/users/${user.id}`,)
        .header("Content-Type", "application/json")
        .header("Accept", "application/json")
        .header("X-Tableau-Auth", inf.token)
        .send(data)
        .then((response) => {
            if(response.error){
                console.log("Error on REST UPDATE",response.body.error)
                reject(response.error);
            }   
            else{
                resolve(response.body);
            }
        })
    })
}

async function _addUser(token,siteid,user){
    var res=await createUser(token,siteid,user);
    if(res.error) {
        console.log("Error on Creation",res)
        throw res.error
    }
    var newuser={
        id:res.user.id,
        name:res.user.name,
        siteRole:res.user.siteRole,
        fullName:user.fullName,
        authSetting:res.user.authSetting,
        email:user.email,
    }
    return newuser;
}

async function _getUsersList(){
    var inf=await handleAUth();
    var allUsers=[];
    await getAllUsers(allUsers,inf.token,inf.siteId,100,1);
    for (let index = 0; index < allUsers.length; index++) {
        let auser = allUsers[index];
        let grps=await getUserGroups(inf.token,inf.siteId,auser.id)
        allUsers[index].groups=grps.group;
    }
    return allUsers;
}

async function handleAUth(){
    if(!cacheToken){
        var ret=await getToken(TABLEAU.API_ID,TABLEAU.API_TOKEN,TABLEAU.SITE_ID).catch(error=> {console.log("ERR_TABLEAU_AUTHENTICATION:",error)})
        cacheToken=ret.credentials.token;
        cacheSiteID=ret.credentials.site.id;
    }
    return {token:cacheToken,siteId:cacheSiteID}
}

async function _testAddUser(user){
    var inf=await handleAUth();
    return await _addUser(inf.token,inf.siteId,user);
}

async function _unLicenseUser(user){
    var inf=await handleAUth();
    return await unLicenseUser(inf.token,inf.siteId,user);
}

export const getUsersList = _getUsersList;
export const addUser = _testAddUser;
export const addUserToGroup = _addUserToGroup;
export const unLicenseTableauUser = _unLicenseUser;
export const getAllTableauGroups=_getAllTableauGroups;
export const getTableauGroupByName=_getTableauGroupByName;
export const removeUserToGroup=_removeUserToGroup;
export const createTableauGroup=_createGroup;
export const updateTableauUser=_updateTableauUser