export const help_splash =`
------------------FIRST FILL "store.js" INFORMATION TO CONNECT TABLEAU AND IDP-----------------

--------------------------------------------COMPAREUSER USAGE------------------------------------------

Run the following command to only compare Users (no modification in any repositories) :

    node index.js compareuser --NOCERT --reaml=myrealm


--NOCERT (Optional, default is "false")
  - Do not check ssl certificate validity

--IDP (Optional, default is "AUTH0")
  - Choose the source IDP
        -- Value can be:
				KC      => for Keycloak
                                AUTH0   => for Auth0


--realm (Mandatory)
  - The IDP realm (or tenant) name to compare

--idp_from_groups (Mandatory)          
  - The group(s) to synchronize user allocation from the IDP to Tableau
        -- Value is enclosed in double quotes " and multiple groups are comma separated, ex: "group1,group2"

--------------------------------------------COMPAREGROUP USAGE------------------------------------------

Run the following command to only compare group user allocations (no modification in any repositories) :

    node index.js comparegroup --NOCERT --reaml=myrealm --idp_from_groups="tableau_creator,tableau_viewer


--NOCERT (Optional, default is "false")
  - Do not check ssl certificate validity

--IDP (Optional, default is "AUTH0")
  - Choose the source IDP
        -- Value can be:
				KC      => for Keycloak
        AUTH0   => for Auth0

--realm (Mandatory)
  - The IDP realm (or tenant) name to compare

--idp_from_groups (Mandatory)          
  - The group(s) to synchronize user allocation from the IDP to Tableau
        -- Value is enclosed in double quotes " and multiple groups are comma separated, ex: "group1,group2"

------------------------------------------GROUPSYNC USAGE------------------------------------------

Run the following command to synchronize Group(s) user allocation from IDP to Tableau :

    node index.js groupsync --realm=testsaml --idp_from_groups="tableau_creator,tableau_viewer"

--FORCE (Optional, default is "false")
  - Disable confirmation, be sure of what you're doing :-)

--NOLOG (Optional, default is "false")
  - Disable log message

--NOCERT (Optional, default is "false")
  - Do not check ssl certificate validity

--IGNORE_DELETION (Optional, default is "false")
  - Users in IDP but not in Tableau won't be unlicensed, just ignored... 

--CREATE_GROUPS (Optional, default is "false")
  - if group doesn't exist in Tableau it will be automatically created 
  
--CREATE_USERS (Optional, default is "false")
  - if user doesn't exist in Tableau it will be automatically created 

--IDP (Optional, default is "AUTH0")
  - Choose the source IDP
        -- Value can be:
				KC      => for Keycloak
        AUTH0   => for Auth0

--realm (Mandatory)
  - The IDP realm (or tenant) name to compare

--idp_from_groups (Mandatory)         
  - The group(s) to synchronize user allocation from the IDP to Tableau
        -- Value is enclosed in double quotes " and multiple groups are comma separated, ex: "group1,group2"

--defaultSiteRole (Optional, default is "Unlicensed")
  - Default Site Role assigned to new users created in Tableau
  
    -- Values can be:

				Viewer

				Creator

				Explorer

				ExplorerCanPublish

				SiteAdministratorExplorer

				SiteAdministratorCreator

				Unlicensed => default value

  

--defaultAuthSetting (Optional, default is "ServerDefault")
 - Default Authentication Setting assigned to new users created in Tableau
	
	--Values can be:
			
			ServerDefault => default value
			SAML
			OpenID        => (Tableau Online only)

------------------------------------------UPDATELIC USAGE------------------------------------------

Run the following command to update user license (and optionally authentication setting) Tableau :

  node index.js updatelic --tableau_groups="tableau_creator,tableau_viewer" --siteRole=Unlicensed --authSetting="OpenID"

Note: if a user belongs to multiple groups designated in --tableau_groups, it will be updated multiple times, not optimal but not a problem. Will be fixed later on...  

--FORCE (Optional, default is "false")
  - Disable confirmation, be sure of what you're doing :-)

--NOLOG (Optional, default is "false")
  - Disable log message

--NOCERT (Optional, default is "false")
  - Do not check ssl certificate validity

--tableau_groups (Mandatory)         
  - The group(s) where users licenses will be updated
        -- Value is enclosed in double quotes " and multiple groups are comma separated, ex: "group1,group2"

--siteRole (Mandatory)
  - Site Role assigned to users in designated group(s) in Tableau
  
    -- Values can be:

				Viewer

				Creator

				Explorer

				ExplorerCanPublish

				SiteAdministratorExplorer

				SiteAdministratorCreator

				Unlicensed => default value

  

--authSetting (Optional, default is "ServerDefault")
 - Authentication Setting assigned to users in designated group(s) in Tableau
	
	--Values can be:
			
			ServerDefault => default value
			SAML
			OpenID        => (Tableau Online only)
`
;
