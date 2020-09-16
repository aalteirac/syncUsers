var unirest = require('unirest');

async function getAllUsers(){

}

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