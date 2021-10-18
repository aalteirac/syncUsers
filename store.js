export const TABLEAU={
        HOST:"<TABLEAU_HOST_NAME>", //Do not forget prot if not 80 or 443
        SITE_ID:"",
        API_ID:"<TOKEN_NAME>",
        API_TOKEN:"<TOKEN>",
        PROTOCOL:"https" //http or https
    };
export const KEYCLOAK={
        HOST:"<KC_HOST_NAME>",
        CLIENT_ID:"<ID>",
        GRANT_TYPE:"password", //leave as it is
        CLIENT_SECRET:"<SECRET>",
        SCOPE:"openid",//leave as it is
        USER_NAME:"<USER_NAME>",
        PASS:"<PASSWORD>",
        PROTOCOL:"http"// http or https
    };
export const AUTH0 = {
    CLIENT_ID: "<clientID>",
    GRANT_TYPE: "client_credentials",//leave as it is
    CLIENT_SECRET: "<clientSecret>",
    SCOPE: "",//leave as it is
    };
    
