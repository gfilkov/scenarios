Migrating MoW Scenarios from Azure-based https://mowtestweb.azurewebsites.net (App Service) to Azure Trigger-Function APIs.

https://mowapi-hvb7htbzgfeubfh0.canadacentral-01.azurewebsites.net

New API:
https://mowapi-hvb7htbzgfeubfh0.canadacentral-01.azurewebsites.net/api/TextToCoords?text=PROBA%20PERA

Legacy: (default: LED)
https://mowapi-hvb7htbzgfeubfh0.canadacentral-01.azurewebsites.net/api/Raster?text=PROBA%20PERA

Legacy: (default: TTF)
https://mowapi-hvb7htbzgfeubfh0.canadacentral-01.azurewebsites.net/api/Raster?text=PROBA%20PERA&type=TTF

GIT Pages
(Ensure your main page is named index.html)

https://gfilkov.github.io/Scenarios/

= = = = =

C:\Work\GIT\MowApi
- complete Azure function. Committed ti GIT. Published:
https://mowapi-hvb7htbzgfeubfh0.canadacentral-01.azurewebsites.net/api/help

http://localhost/THREE/mow-func-api.html
- HTML test client

= = = = =

Test client and 1st ported scenarios (Birds - done) are published at:
https://gfilkov.github.io/Scenarios/

# NEXT: port and publish honey-bee; it has latest banner/trinkets creation pattern (for THREE.JS)
When porting  other THREE scenarios, follow ported honey-bee example.

= = = = =
# renamed 
https://gfilkov.github.io/Scenarios/
https://gfilkov.github.io/scenarios/

# NB: github is apache, case sensitive in all names.

- - - -
Swat mixamo-additional animation-glb project
https://www.mixamo.com/#/?type=Motion%2CMotionPack

Mixamo no longer allows multiple animations on its models.
Solution:
- download swat-walking.fbx		// use FBX 4.7 format
- download swat-idle-skeleton.fbx	// no skin
- use https://kestrelworks.itch.io/oneglb-try to combine (allows just 2 animations for free):
swat_walking_fbx47_combined.glb

NB: oneglb places animation[] right in the root of result (gltf.animations) instead of gltf.scene

= = = = = = = =

* Created Cloudflare R2 bucket '3d-models' for large objects
* Moved all GLbs there
* Added to Play.html:

    <!--Cloudflare R2 bucket '3d-models' for large objects-->
    <script>var R2endpoint = "https://pub-753e957cef1d4a2ca7a373bc249cee82.r2.dev/"</script>

- - - - -

### My https://mowapi-hvb7htbzgfeubfh0.canadacentral-01.azurewebsites.net/ blacklisted by Norton.
# Added Exclusion in Norton utilities (for my PC)
# Submitted petition to Norton.

- - - -
# NEXT:
- remove GLBs from Github
- Identify and fix multiple small glitches in Scenarios (to be detailed).

* Scenarios - define their own default Magic Word it no TEXT provided

* Scenario Settings (Drawer): add description field.
* Drawer: Type radio values (from json)

** honey-bees bug
alert('stage 9 safety catch!')
- always extra flies in the table.
- single bee slow on large rasters. Invisible bees animation takes time?
 - FIXED

** March: fails to march on '12345678' !? Only '1234567' or less work.
** one||two - single overlayed line!?

** Server error 500 on line1/n/nline2

* Wintry-road: multi-page failure (on 2nd page) // fixed

## Marienbad: multi-page not implementd

** TextToCoords LED 
one / two
- overlayed!?
one|two - OK

one	// server error!?

two

** Implement feature: Message color