# NODEJS KEYCLOAK => TABLEAU SYNC UTILITY
 
Install nodejs from https://nodejs.org/en/download/

Clone/unzip the repo and run in the root folder: npm install

if you need help to setup KeyCloak admin API: https://developers.redhat.com/blog/2020/01/29/api-login-and-jwt-token-generation-using-keycloak/

---------------FIRST FILL "store.js" INFORMATION TO CONNECT TABLEAU AND KEYCLOAK---------------

----------------------------------------COMPARE USAGE------------------------------------------

Run the following command to only compare Users (no modification in any repositories) :

node index.js compare --NOCERT --reaml=myrealm

--NOLOG                    Disable log message

--NOCERT                   Do not check ssl certificate validity

--realm                    The KeyCloak realm name to compare


------------------------------------------SYNC USAGE-------------------------------------------

Run the following command to synchronize Users from KeyCloak to Tableau :

node index.js sync --NOCERT --realm=testsaml --defaultSiteRole=Viewer --defaultAuthSetting=ServerDefault

--FORCE                    Disable confirmation, be sure of what you're doing :-)

--NOLOG                    Disable log message

--NOCERT                   Do not check ssl certificate validity

--realm                    The KeyCloak realm name to compare

--defaultSiteRole          Default Site Role assigned to new users created in Tableau
                           Values can be:
                                   Viewer
                                   Creator
                                   Explorer
                                   ExplorerCanPublish
                                   SiteAdministratorExplorer
                                   SiteAdministratorCreator
                                   Unlicensed

--defaultAuthSetting       Default Authentication Setting assigned to new users created in Tableau
                           Values can be:
                                   ServerDefault
                                   SAML
                                   OpenID (Tableau Online only)

--idp_from_groups          Consider only users belonging to the group(s) in the IDP (keycloak here)
                           Value is enclosed in double quote " and multiple groups are comma separated
                                   ex: "group1,group2"

--tableau_to_groups         When users are added to Tableau, you can here specify the groups you want them to be attached
                           Value is enclosed in double quote " and multiple groups are comma separated
                                   ex: "group1,group2"
                           if the group doesn't exist in Tableau it won't be created (yet :-))

Example:
node index.js sync --realm=testsaml --defaultSiteRole=Creator  --defaultAuthSetting=ServerDefault --idp_from_groups="tableau_viewer,tableau_creators" --tableau_to_group="exec,iot"