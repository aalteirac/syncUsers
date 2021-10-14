export const help_splash =`
---------------FIRST FILL "store.js" INFORMATION TO CONNECT TABLEAU AND KEYCLOAK---------------

----------------------------------------COMPARE USAGE------------------------------------------

Run the following command to only compare Users (no modification in any repositories) :

node index.js compare --NOCERT --reaml=myrealm

--NOLOG                    Disable log message

--NOCERT                   Do not check ssl certificate validity

--realm                    The KeyCloak realm name to compare


------------------------------------------SYNC USAGE-------------------------------------------

Run the following command to synchronize Users from KeyCloak to Tableau :

node index.js usersync --NOCERT --realm=testsaml --defaultSiteRole=Viewer --defaultAuthSetting=ServerDefault

--FORCE                    Disable confirmation, be sure of what you're doing :-)

--NOLOG                    Disable log message

--NOCERT                   Do not check ssl certificate validity

--IGNORE_DELETION          During the sync, existing users in Tableau and not existing in IDP will not be deleted (unlicenced) in Tableau

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
node index.js sync --realm=testsaml --defaultSiteRole=Creator  --defaultAuthSetting=ServerDefault --idp_from_groups="tableau_viewer,tableau_creators" --tableau_to_groups="exec,iot"

## Important note on groups

The sync command will only assign NEW users (exist in IDP but not in Tableau) from *idp_from_groups* to each group declared in *tableau_to_groups* to Tableau

Let's take an example: User "MrsX" exists in IDP but not in Tableau=> It's a new user to create in Tableau.

To consider "MrsX" in the sync you have to either: 
- not use *idp_from_groups*, meaning entire IDP realm will be taken
- use *idp_from_groups*, adding at least one group "MrsX" belongs in IDP

Then if you want "MrsX" to be assigned to group "project X" and "project Y" in Tableau you need to:

- add "project X" and "project Y" entries in the *tableau_to_groups*, comma separated: 
			--tableau_to_groups ="project X,project Y"
- if *tableau_to_groups* is not used, it will still add "MrsX" but only attached to default mandatory group "All Users"
`;
