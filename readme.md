# NODEJS IDP => TABLEAU SYNC UTILITY

Install nodejs from https://nodejs.org/en/download/

Clone/unzip the repo and run in the root folder: npm install

if you need help to setup KeyCloak admin API: https://developers.redhat.com/blog/2020/01/29/api-login-and-jwt-token-generation-using-keycloak/

---------------FIRST FILL "store.js" INFORMATION TO CONNECT TABLEAU AND IDP---------------

--------------------------------------------COMPAREUSER USAGE------------------------------------------

Run the following command to only compare Users (no modification in any repositories) :

    node index.js compareuser --NOCERT --reaml=myrealm


\-\-NOCERT (Optional, default is "false")
 - Do not check ssl certificate validity

\-\-IDP (Optional, default is "AUTH0")
  - Choose the source IDP
	
	--Values can be:
			
			KC      => for Keycloak
			AUTH0   => for Auth0 


\-\-realm (Mandatory)
- The IDP realm (or tenant) name to compare

\-\-idp_from_groups (Mandatory)          
- The group(s) to synchronize user allocation from the IDP to Tableau
        -- Value is enclosed in double quotes " and multiple groups are comma separated, ex: "group1,group2"

--------------------------------------------COMPAREGROUP USAGE------------------------------------------

Run the following command to only compare group user allocations (no modification in any repositories) :

    node index.js comparegroup --NOCERT --reaml=myrealm --idp_from_groups="tableau_creator,tableau_viewer


\-\-NOCERT (Optional, default is "false")
 - Do not check ssl certificate validity

\-\-IDP (Optional, default is "AUTH0")
  - Choose the source IDP
	
	--Values can be:
			
			KC      => for Keycloak
			AUTH0   => for Auth0  

\-\-realm (Mandatory)
- The IDP realm (or tenant) name to compare

\-\-idp_from_groups (Mandatory)          
- The group(s) to synchronize user allocation from the IDP to Tableau
        -- Value is enclosed in double quotes " and multiple groups are comma separated, ex: "group1,group2"

------------------------------------------GROUPSYNC USAGE------------------------------------------

Run the following command to synchronize Group(s) user allocation from IDP to Tableau :

    node index.js groupsync --realm=testsaml --idp_from_groups="tableau_creator,tableau_viewer"

\-\-FORCE (Optional, default is "false")
- Disable confirmation, be sure of what you're doing :-)

\-\-NOLOG (Optional, default is "false")
- Disable log message

\-\-NOCERT (Optional, default is "false")
 - Do not check ssl certificate validity

\-\-IGNORE_DELETION (Optional, default is "false")
- Users in IDP but not in Tableau won't be unlicensed, just ignored... 

\-\-IDP (Optional, default is "AUTH0")
  - Choose the source IDP
	
	--Values can be:
			
			KC      => for Keycloak
			AUTH0   => for Auth0 

\-\-realm (Mandatory)
- The IDP realm (or tenant) name to compare

\-\-idp_from_groups (Mandatory)         
- The group(s) to synchronize user allocation from the IDP to Tableau
        -- Value is enclosed in double quotes " and multiple groups are comma separated, ex: "group1,group2"

\-\-defaultSiteRole (Optional, default is "Unlicensed")
  - Default Site Role assigned to new users created in Tableau
  
    -- Values can be:

				Viewer

				Creator

				Explorer

				ExplorerCanPublish

				SiteAdministratorExplorer

				SiteAdministratorCreator

				Unlicensed => default value

  

\-\-defaultAuthSetting (Optional, default is "ServerDefault")
 - Default Authentication Setting assigned to new users created in Tableau
	
	--Values can be:
			
			ServerDefault => default value
			SAML
			OpenID        => (Tableau Online only)
