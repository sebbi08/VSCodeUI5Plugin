# SAPUI5 Extension
This plugin contains perks for UI5 developers.

----------
## Completion Items
### XML
XML Completion Items for UI5 Controls.
![XMLCompletionItems](/images/XMLCompletionItems.gif)

### JS

#### sap.ui.define
Strings for import in sap.ui.define are provided.
![UIDefine](/images/UIDefine.gif)

#### Control ID Completion Items
IDs from the corresponding view of the controller are provided for getView().byId method
![GetView](/images/GetView.gif)

#### Dynamic completion items
Completion items which are generated when coding. Trigger character - dot.
![DynamicCompletionItems](/images/DynamicCompletionItems.gif)

----------
## Method Definitions
Definitions for custom methods are provided.
![Definition](/images/Definition.gif)


----------
## Commands

> Idea to put hotkeys for commands might be useful

### Move sap.ui.define to parameters
![UIDefine](/images/UIDefine.gif)

### Export to i18n
Set your position to the string you want to export to i18n.properties file and execute command. Works both in XML and JS files.
> `this.getBundle()` method which returns ResourceBundle should be defined in Controller/BaseController

![ExportToI18n](/images/ExportToI18n.gif)

### Switch View/Controller
Goes to view from controller and to controller from view
![SwitchViewController](/images/SwitchViewController.gif)

### Clear Cache
Clears cache with SAPUI5 lib metadata

----------
## Settings
There are two settings available:
* Your source folder name where manifest.json should be located at
* Library version (For now - tested only for 1.60.11)
![Settings](/images/Settings.png)

----------
# How it works
## SAPUI5 Metadata
* Standard SAPUI5 Library Metadata is fetched from ui5.sap.com and saved locally
* Tested using 1.60.11 only
> If you are using different versions, you might meet an unexpected behavior if the structure of the standard lib metadata is different

## Custom class metadata
Custom class metadata is dynamically generated using .js and view.xml files of the project.&nbsp;
There are several types of variable definitions:
* Local object variables&nbsp;
`this.variable`&nbsp;
Algorithm looks for all definitions in the functions of the object which is returned in&nbsp;
`return Control.extend("name", {})` part
* Function parameters&nbsp;
`function(oEvent) {}`&nbsp;
Only way to find out the data type of the function parameter is JSDoc. Use `@param {sap.ui.base.Event}` if you want completion items to work for function params.
* Local variables&nbsp;
`function() {
	var oList = new List();
}`

### Custom file parsing limitations
* All variables defined in if/else, try/catch, for/while loops are ignored, because that is not reliable source of data definitions

### Assumptions
* File starts with sap.ui.define
* You have manifest.json in source folder
* App ID (Component name) and i18n paths are defined in manifest.json
* File is without syntax errors
* No ES6 features are used (Will be added in the future)