module.exports = {
    TABLEAU:{
        HOST:"<TABLEAU_HOST_NAME>", //Do not forget port if not 80 or 443
        SITE_ID:"",
        API_ID:"<TOKEN_NAME>",
        API_TOKEN:"<TOKEN>",
        PROTOCOL:"https" //http or https
    },
    KEYCLOAK:{
        HOST:"<KC_HOST_NAME>", //Do not forget port if not 80 or 443
        CLIENT_ID:"<ID>",
        GRANT_TYPE:"password", //leave as it is
        CLIENT_SECRET:"<SECRET>",
        SCOPE:"openid",
        USER_NAME:"<USER_NAME>",
        PASS:"<PASSWORD>",
        PROTOCOL:"http" //http or https
    }
}
