# KEYCLOAK=>TABLEAU SYNC UTILITY

---------------FIRST FILL "store.js" INFORMATION TO CONNECT TABLEAU AND KEYCLOAK---------------

----------------------------------------COMPARE USAGE------------------------------------------

Run the following command to only compare Users (no modification in any repositories) :

node index.js compare --NOCERT --reaml=myrealm

--NOLOG                    Disable log message

--NOCERT                   Do not check ssl certificate validity

--realm                    The KeyCloak realm name to compare


------------------------------------------SYNC USAGE-------------------------------------------

Run the following command to synchronize Users from KeyCloak to Tableau :

node index.js sync --NOCERT --reaml=testsaml --defaultSiteRole=Viewer --defaultAuthSetting=ServerDefault

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