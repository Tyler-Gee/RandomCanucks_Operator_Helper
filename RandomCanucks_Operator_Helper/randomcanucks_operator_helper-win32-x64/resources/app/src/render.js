const { ipcRenderer } = require('electron')
const Viewer = require('viewerjs');


/********************************************************************************************************************************/
/* ON PAGE LOAD */
/********************************************************************************************************************************/
$(document).ready(function () {
    /* Structure of array of JSON that contains data about each map and the file names of camera spots for each bomb site  */
    /*  
        [{"map": "name", "site": [
                        {"name": "name", "Viability": number, "cameraSpots": ["camera1.png", "camera2.png", "camera3.png"]},
                        {"name": "name", "Viability": number, "cameraSpots": ["camera1.png", "camera2.png", "camera3.png"]},
                        {"name": "name", "Viability": number, "cameraSpots": ["camera1.png", "camera2.png", "camera3.png"]},
                        {"name": "name", "Viability": number, "cameraSpots": ["camera1.png", "camera2.png", "camera3.png"]}],
        "Floors": ["floor-1.png", "floor-2.png", "floor-3.png"]},...]
    */

    // Define comlete game data, map specific data and site specific data
    var gameDataOBJ,  mapOBJ, siteOBJ, userDataOBJ, specialDir, attackMode = false, mapNumber = 12, opSelect = 0;
    var opSelectMenuOpen = false;
    
    // Get game data from map-data.json
    // Fill game data with user added camera spot files
    gameDataOBJ = JSON.parse(ipcRenderer.sendSync('gameDataOBJ-request-query'));
    console.log("Game Data: ");
    console.log(gameDataOBJ);

    /* Get the name of the directory that the Valkyrie Camera Spot pictures are in */
    specialDir = ipcRenderer.sendSync('directory-request-query');

    // Get user data from userConfig file
    userDataOBJ = ipcRenderer.sendSync('user-data-request');
    console.log("\nUser Data: ");
    console.log(userDataOBJ);

    // if the user has set a background image, load that image as the background image
    if(userDataOBJ.background){
        document.body.style.backgroundImage = "url('" + userDataOBJ.background + "')";
    }
    
    /* check to see if the gameDataOBJ contains any errors */
    /* 12 ranked maps: i < 12 */
    /* Maps contains exactly 4 bomb sites: k < 3 */
    var emptySites = new Array();
    var emptySitesString;

    if(gameDataOBJ.length != mapNumber){
        ipcRenderer.sendSync('Error: gameDataOBJ.length != mapNumber');
    }

    for(let i = 0; i < mapNumber; i++) {
        if(gameDataOBJ[i].site.length != 4) {
            ipcRenderer.sendSync('Error: gameDataOBJ[i].site.length invalid');
        }
    }

    for(let i = 0; i < mapNumber; i++) {
        for(let k = 0; k < 4; k++) {
            if(gameDataOBJ[i].site[k].cameraSpots.length == 0) {
                emptySites.push(gameDataOBJ[i].map);
            } 
        }
    }

    // Check if there are any folders that do not contain Valkyrie Camera locations
    // Program may work with an incomplete data set but was not designed specifically to do so    
    if(emptySites.length != 0) {
        for(let i = 0; i < emptySites.length; i++) {
            if(i == 0){
                emptySitesString = emptySites[i] + ", ";
            }
            else if(i == emptySites.length - 1) {
                emptySitesString = emptySitesString + "and " + emptySites[i];
            }
            else {
                emptySitesString = emptySitesString + emptySites[i] + ", ";
            }
        }
        // Throw alert if any bomb site does not contain valkyrie camera location pictures
        $("header").prepend("<div class=\"alert alert-danger\" role=\"alert\">Error: Bomb sites on \"" + emptySitesString + "\" do not contain Valkyrie camera spots. Some functions of this program may not work</div >");
        dissolveAlert();         
    }
    // Alert if all check were successfull and every bomb site contains Valkyrie Camera spot pictures
    else {
        $("header").prepend("<div class=\"alert alert-success\" role=\"alert\">Succes: Map and user created data has been loaded</div >");
        dissolveAlert(); 
    }

    $('.attackDefendSwitchContainer').on("click", '#attackDefendSwitch', function () {
        if($(this).prop("checked") == true) {
            attackMode = true;
        }
        else {
            attackMode = false
        }
    });

    // Event listener for map select buttons
    $('.mapSelector').on("click" , ".mapSelectorButton", function () {
        if(attackMode == false) {
            $('.mapSelector').css({"display":"grid"});
            $('.mapSelector').css({"grid-template-columns":"repeat(4, 100px)"});
            $('.mapSelector').css({"grid-template-rows":"repeat(4, 100px)"});
            // Create a Map Object from game data based on what map was chosen
            mapOBJ = createMapOBJFromMapButtonID(this.id, gameDataOBJ)
            // wrapper function to clear home page and dynamically fill the home page with bomb site selection buttons and home navigation button
            createBombSiteSelectionPage(mapOBJ, userDataOBJ);
        }
        else if(attackMode == true) {
            $('.mapSelector').css({"display":"block"});
            $('.mapSelector').css({"grid-template-columns":" "});
            $('.mapSelector').css({"grid-template-rows":" "});
            $('.mapSelector').css({"grid-gap":" "});
            // Create a Map Object from game data based on what map was chosen
            mapOBJ = createMapOBJFromMapButtonID(this.id, gameDataOBJ)
            createFloorPlanViewer(siteOBJ, mapOBJ, specialDir, attackMode)
        }
    });

    // Event listener for when a bomb site was chosen
    $(".mapSelector").on("click", ".siteSelectButton", function () {
        $('.mapSelector').css({"display":"block"});
        $('.mapSelector').css({"grid-template-columns":" "});
        $('.mapSelector').css({"grid-template-rows":" "});
        $('.mapSelector').css({"grid-gap":" "});
        // Create a Site Object from mapOBJ based on what site was chosen
        siteOBJ = getSiteOBJFromSiteName(this.id, gameDataOBJ);
        // Wrapper function to clear bomb site selection button and dynamically fill home page with user add camera location pictures for that bomb site, home page navigation button and back to bomb site selection button
        createValkyrieCameraSpotViewer(siteOBJ, mapOBJ, specialDir, attackMode, opSelect);
        opSelectMenuOpen = closeNav(opSelectMenuOpen);
    });

    /*  Event Listener for when homeButton is clicked*/

    $('.attackDefendSwitchContainer').on("click", '#homeButton', function () {
        // clear all dynamically created css data for the two main parent div's on the home page
        $('.mapSelector').css({"display":"grid"});
        $('.mapSelector').css({"grid-template-columns":"repeat(4, 355px)"});
        $('.mapSelector').css({"grid-template-rows":"repeat(3, 200px)"});
        $(".headerContentContainer").css({"margin-top":"6rem"});
        $(".headerContentContainer").css({"margin-bottom":"6rem"});
        $(".mapSelector").css({"margin-top":"2.5rem"});
        /* Change attack/defend mode to false because the default state for the bootstrap switch is defend mode VISUALLY. Every time the home page is reloaded, the switch will appear to be in the default state of off. However the attackMode boolean value will not change unless the switch is toggled. Therefore the attackMode boolean must be set to false every time the home page is loaded*/
        attackMode = false;
        // Wrapper function to dynamically create home page: All 12 map choice buttons and attacker/defender toggle switch
        createHomePage(); 
        opSelectMenuOpen = closeNav(opSelectMenuOpen);
    });

    $('.attackDefendSwitchContainer').on("click", '#opSelectButton_Open', function () {
        if(opSelectMenuOpen == false){
            opSelectMenuOpen = openNav(opSelectMenuOpen);
        }
        else{
            opSelectMenuOpen = closeNav(opSelectMenuOpen);
        }
    });

        // Event listener for when back to site selection button is clicked
    $('.attackDefendSwitchContainer').on("click", '.backToSiteSelection', function () {   
        // Clear all dynamically created css data for the two main parent div's on the bomb site selection page
        $('.mapSelector').css({"display":"grid"});
        $('.mapSelector').css({"grid-template-columns":"repeat(4, 100px)"});
        $('.mapSelector').css({"grid-template-rows":"repeat(4, 100px)"});
        $(".headerContentContainer").css({"margin-top":"6rem"});
        $(".headerContentContainer").css({"margin-bottom":"6rem"});
        $(".mapSelector").css({"margin-top":"2.5rem"});
        // Wrapper function to clear Valkyrie Camera Location picture gallery and dynamically fill home page with bomb site selection buttons and home navigation button
        createBombSiteSelectionPage(mapOBJ, userDataOBJ);
    });

    $('.opSelectButton').click(function () {
        opSelect = toggleOpSelectButton(this.id, opSelect);
    });

    $('.closebtn').click(function () {
        opSelectMenuOpen = closeNav(opSelectMenuOpen);
    });
});



/********************************************************************************************************************************/
/* HOME PAGE CREATION */
/********************************************************************************************************************************/
/*  Wrapper function to dynamically create the home/landing page*/
function createHomePage() {
    creatMapSelectorArea();
    createAttackDefendToggleArea();
}

/* Callback Function 1: "DoThis", Empty mapSelector Area */
function destroyMapSelector(callback) {
    $('.mapSelector').empty();
    callback();
}
/* Callback Function 2: "AndThenThis", Dynamically create MapSelect_MapButton area*/
function createMapSelectorButtons () {
    $(".mapSelector").append("<div class=\"mapSelectButtonContainer\"><button id=\"mapSelect_BankButton\" class=\"mapSelectorButton\">Bank</button></div><div class=\"mapSelectButtonContainer\"><button id=\"mapSelect_BorderButton\" class=\"mapSelectorButton\">Border</button></div><div class=\"mapSelectButtonContainer\"><button id=\"mapSelect_ChaletButton\" class=\"mapSelectorButton\">Chalet</button></div><div class=\"mapSelectButtonContainer\"><button id=\"mapSelect_ClubhouseButton\" class=\"mapSelectorButton\">Clubhouse</button></div><div class=\"mapSelectButtonContainer\"><button id=\"mapSelect_CoastlineButton\" class=\"mapSelectorButton\">Coastline</button></div><div class=\"mapSelectButtonContainer\"><button id=\"mapSelect_ConsulateButton\" class=\"mapSelectorButton\">Consulate</button></div><div class=\"mapSelectButtonContainer\"><button id=\"mapSelect_Kafe_DostoyevskyButton\"class=\"mapSelectorButton\">Kafe Dostoyevsky</button></div><div class=\"mapSelectButtonContainer\"><button id=\"mapSelect_KanalButton\" class=\"mapSelectorButton\">Kanal</button></div><div class=\"mapSelectButtonContainer\"><button id=\"mapSelect_OregonButton\" class=\"mapSelectorButton\">Oregon</button></div><div class=\"mapSelectButtonContainer\"><button id=\"mapSelect_OutbackButton\" class=\"mapSelectorButton\">Outback</button></div><div class=\"mapSelectButtonContainer\"><button id=\"mapSelect_Theme_ParkButton\" class=\"mapSelectorButton\">Theme Park</button></div><div class=\"mapSelectButtonContainer\"><button id=\"mapSelect_VillaButton\" class=\"mapSelectorButton\">Villa</button></div>");
}
/* Wrapper Function: Synchronously empty mapSelector and then create mapSelect_MapButtons*/
function creatMapSelectorArea() {
    destroyMapSelector(createMapSelectorButtons);
}

/* Learnt From Source: https://www.freecodecamp.org/news/javascript-from-callbacks-to-async-await-1cc090ddad99/*/
/* Callback Function 1: "DoThis", Empty Header area */
function destroyHeader(callback) {
    $(".attackDefendSwitchContainer").empty();
    callback();
}
/* Callback Function 2: "AndThenThis", Dynamically create attackDeffendToggle switch*/
function createToggle() {
    $(".attackDefendSwitchContainer").append("<label class=\"switch\"><input id=\"attackDefendSwitch\" type=\"checkbox\"><span class=\"slider round\"></span></label>");
}
/* Wrapper function: Synchronously empty Header area and then create toggle switch*/
function createAttackDefendToggleArea() {
    destroyHeader(createToggle);
}

// Function to clear alerts after a specified time in milliseconds
function dissolveAlert() {
    window.setTimeout(function() {
        $(".alert").fadeTo(500, 0).slideUp(500, function(){
            $(this).remove(); 
        });
    }, 2000);
}


/********************************************************************************************************************************/
/* BOMB SITE ELECTION PAGE CREATION */
/********************************************************************************************************************************/
/*  Wrapper function to dynamically create the bomb site selection page*/
function createBombSiteSelectionPage(mapOBJ, userDataOBJ) {
    destroyHeader(function () {
        createHomeButton();
        createOpSelectButton();
    });
    destroyMapSelector(function(){
        createBombSiteButtons(mapOBJ, userDataOBJ);
    });
}

/* dynamically create HomeButton on the bomb site select screen */
function createHomeButton() {
    $(".attackDefendSwitchContainer").append("<div id=\"dynamicNavButtonContainer\"><button type=\"button\" ID=\"homeButton\" class=\"btn btn-primary\">Home</button></div>");
}

function createOpSelectButton () {
    $("#dynamicNavButtonContainer").append("<button type=\"button\" ID=\"opSelectButton_Open\" class=\"btn btn-primary\">Select Operator</button>");
}

/* Dynamically create 4 bomb site selection buttons based on the map that the user has chosen */
function createBombSiteButtons(mapOBJ, userDataOBJ) {
    var bombSiteNames_spaces, bombSiteNames;
    
    if(mapOBJ == "Map Object could not be pulled from game data"){
        $("header").prepend("<div class=\"alert alert-danger\" role=\"alert\">Error: Map Object could not be pulled from game data. Please exit program.</div >");
        window.stop();
        return;       
    }

    bombSiteNames = new Array();
    bombSiteNames_spaces = new Array();
    for(let i = 0; i < mapOBJ.site.length; i++){
        var viability = "";
        if(userDataOBJ.showSiteViability == true){
            if(mapOBJ.site[i].viability == 1) viability = "siteSelectButtonViability1";
            else if(mapOBJ.site[i].viability == 2) viability = "siteSelectButtonViability2";
            else if(mapOBJ.site[i].viability == 3) viability = "siteSelectButtonViability3";
        }

        bombSiteNames.push(mapOBJ.site[i].name);
        bombSiteNames_spaces.push(bombSiteNames[i].replace(/_/g, " "));
        $(".mapSelector").append("<button type=\"button\" id=\"" + bombSiteNames[i] + "_siteSelectButton" + "\" class=\"btn btn-outline-primary " + viability + " siteSelectButton\">" + bombSiteNames_spaces[i] +"</button>");
    }
}


/********************************************************************************************************************************/
/* IMAGE VIEWER PAGE CREATION */
/********************************************************************************************************************************/
/* Dynamically create back to site page selection button on the image viewer page */
function createBackToSiteSelectionButton(siteName) {
    $("#dynamicNavButtonContainer").append("<button type=\"button\" ID=\"" + siteName + "\" class=\"btn btn-primary backToSiteSelection\">Site Selection</button>");
}

/* Wrapper funtion to create Image Viewer page */
function createValkyrieCameraSpotViewer(siteOBJ, mapOBJ, specialDir, attackMode, opSelect) {    
    destroyHeader(function(){
        createHomeButton();
        createBackToSiteSelectionButton(siteOBJ.map);
    });
    destroyMapSelector(function(){
        createImageGallery(siteOBJ, mapOBJ, specialDir, attackMode, opSelect);
    });
}

/* Function: Based on siteOBJ, Dynamically create a grid representation of the user provided Valkyrie Location Pictures and store them in a Image Viewer node Module called Viewerjs*/
function createImageGallery(siteOBJ, mapOBJ, specialDir, attackMode, opSelect) {
    if(attackMode == false){
        if(siteOBJ == "Site Object could not be pulled from game data"){
            $("header").prepend("<div class=\"alert alert-danger\" role=\"alert\">Error: Map Object could not be pulled from game data. Please exit program.</div >");
            window.stop();
            return;       
        }
        if(opSelect == 0){
            if(siteOBJ.cameraSpots.length > 12){
                $(".headerContentContainer").css({"margin-top":"1rem"});
                $(".headerContentContainer").css({"margin-bottom":"1rem"});
                $(".mapSelector").css({"margin-top":"1rem"});
            }
            $(".mapSelector").append("<ul id=\"gallery\">");
            for(let i = 0; i < siteOBJ.cameraSpots.length; i++){
                $("#gallery").append("<li class= \"imageListItem\"><img src=\"" + specialDir + "\\RandomCanucksOperatorHelper\\Valkyrie\\Black_Eye_Camera_Locations\\" + mapOBJ.map + "\\" + siteOBJ.name + "\\" + siteOBJ.cameraSpots[i] + "\" class=\"valkyrieCameraSpotImg\"></a></li>");
            }
        }
        else if(opSelect == 1) {
            if(siteOBJ.jagerSpots.length > 12){
                $(".headerContentContainer").css({"margin-top":"1rem"});
                $(".headerContentContainer").css({"margin-bottom":"1rem"});
                $(".mapSelector").css({"margin-top":"1rem"});
            }
            $(".mapSelector").append("<ul id=\"gallery\">");
            for(let i = 0; i < siteOBJ.jagerSpots.length; i++){
                $("#gallery").append("<li class= \"imageListItem\"><img src=\"" + specialDir + "\\RandomCanucksOperatorHelper\\Jager\\" + mapOBJ.map + "\\" + siteOBJ.name + "\\" + siteOBJ.jagerSpots[i] + "\" class=\"valkyrieCameraSpotImg\"></a></li>");
            }
        }
        else if(opSelect == 2) {
            if(siteOBJ.muteSpots.length > 12){
                $(".headerContentContainer").css({"margin-top":"1rem"});
                $(".headerContentContainer").css({"margin-bottom":"1rem"});
                $(".mapSelector").css({"margin-top":"1rem"});
            }
            $(".mapSelector").append("<ul id=\"gallery\">");
            for(let i = 0; i < siteOBJ.muteSpots.length; i++){
                $("#gallery").append("<li class= \"imageListItem\"><img src=\"" + specialDir + "\\RandomCanucksOperatorHelper\\Mute\\" + mapOBJ.map + "\\" + siteOBJ.name + "\\" + siteOBJ.muteSpots[i] + "\" class=\"valkyrieCameraSpotImg\"></a></li>");
            }
        }
        else if(opSelect == 3) {
            if(siteOBJ.miraSpots.length > 12){
                $(".headerContentContainer").css({"margin-top":"1rem"});
                $(".headerContentContainer").css({"margin-bottom":"1rem"});
                $(".mapSelector").css({"margin-top":"1rem"});
            }
            $(".mapSelector").append("<ul id=\"gallery\">");
            for(let i = 0; i < siteOBJ.miraSpots.length; i++){
                $("#gallery").append("<li class= \"imageListItem\"><img src=\"" + specialDir + "\\RandomCanucksOperatorHelper\\Mira\\" + mapOBJ.map + "\\" + siteOBJ.name + "\\" + siteOBJ.miraSpots[i] + "\" class=\"valkyrieCameraSpotImg\"></a></li>");
            }
        }
        else if(opSelect == 4) {
            if(siteOBJ.maestroSpots.length > 12){
                $(".headerContentContainer").css({"margin-top":"1rem"});
                $(".headerContentContainer").css({"margin-bottom":"1rem"});
                $(".mapSelector").css({"margin-top":"1rem"});
            }
            $(".mapSelector").append("<ul id=\"gallery\">");
            for(let i = 0; i < siteOBJ.maestroSpots.length; i++){
                $("#gallery").append("<li class= \"imageListItem\"><img src=\"" + specialDir + "\\RandomCanucksOperatorHelper\\Maestro\\" + mapOBJ.map + "\\" + siteOBJ.name + "\\" + siteOBJ.maestroSpots[i] + "\" class=\"valkyrieCameraSpotImg\"></a></li>");
            }
        }
        else{
            if(siteOBJ.melusiSpots.length > 12){
                $(".headerContentContainer").css({"margin-top":"1rem"});
                $(".headerContentContainer").css({"margin-bottom":"1rem"});
                $(".mapSelector").css({"margin-top":"1rem"});
            }
            $(".mapSelector").append("<ul id=\"gallery\">");
            for(let i = 0; i < siteOBJ.melusiSpots.length; i++){
                $("#gallery").append("<li class= \"imageListItem\"><img src=\"" + specialDir + "\\RandomCanucksOperatorHelper\\Melusi\\" + mapOBJ.map + "\\" + siteOBJ.name + "\\" + siteOBJ.melusiSpots[i] + "\" class=\"valkyrieCameraSpotImg\"></a></li>");
            }    
        }
        for(let i = 0; i < mapOBJ.Floors.length; i++){
            $("#gallery").append("<li class= \"imageListItem\"><img src=\"..\\vendors\\img\\floor_plans\\" + mapOBJ.map + "\\" + mapOBJ.Floors[i] + ".jpg\" class=\"valkyrieCameraSpotImg\"></a></li>");
        }
        $(".mapSelector").append("</ul>");
    }
    else {
        $(".mapSelector").append("<ul id=\"gallery\">"); 
        for(let i = 0; i < mapOBJ.Floors.length; i++){
            $("#gallery").append("<li class= \"imageListItem\"><img src=\"..\\vendors\\img\\floor_plans\\" + mapOBJ.map + "\\" + mapOBJ.Floors[i] + ".jpg\" class=\"valkyrieCameraSpotImg\"></a></li>");
        }
        $(".mapSelector").append("</ul>");
    }

    const gallery = new Viewer(document.getElementById("gallery"), {
        title: false,
        rotatable: false,
        scalable: false,
        zoomOnTouch: false,
        slideOnTouch: false
    });
} 

function createFloorPlanViewer(siteOBJ, mapOBJ, specialDir, attackMode) {
    destroyHeader(function(){
        createHomeButton();
    });
    destroyMapSelector(function(){
        createImageGallery(siteOBJ, mapOBJ, specialDir, attackMode); 
    });
}

/********************************************************************************************************************************/
/* DATA COLLECTION */
/********************************************************************************************************************************/
/* Create a mapOBJ from Map Name using gameDataOBJ */
function createMapOBJFromMapButtonID(mapButtonID, gameDataOBJ) {
    var mapName, mapNameTemp, mapOBJ;

    /* Extract map name from mapSelectButtonID */
    mapNameTemp = mapButtonID.split("_");//[1].split("Button")[0];
    if(mapNameTemp.length == 2){
        mapName = mapNameTemp[1].split("Button")[0];
    }
    else if(mapNameTemp.length == 3){
        mapName = mapNameTemp[1] + "_" + mapNameTemp[2].split("Button")[0];
    }  

    /* Get mapOBJ from gameDataOBJ */
    for(let i = 0; i < gameDataOBJ.length; i++){
        if(gameDataOBJ[i].map == mapName){
            mapOBJ = gameDataOBJ[i];
            return mapOBJ;
        }
    }
    return "Map Object could not be pulled from game data";
}

/* Create siteOBj from Site Name useing gameDataOBJ*/
function getSiteOBJFromSiteName(siteButtonID, gameDataOBJ) {
    var siteName, siteOBJ;  

    /* Extract site name from siteButtonID */
    siteName = siteButtonID.split("_siteSelectButton")[0];
    
    /* loop through gameDataOBJ to find map with corresponding  */
    var i, k;
    for(i = 0; i < gameDataOBJ.length; i++){
        for(k = 0; k < gameDataOBJ[i].site.length; k++) {
            if(gameDataOBJ[i].site[k].name == siteName) {
                siteOBJ = gameDataOBJ[i].site[k];
            }
        }
    }

    if(!siteOBJ){
        $("header").prepend("<div class=\"alert alert-danger\" role=\"alert\">Error: Map Object could not be pulled from game data. Please exit program.</div >");
    }    
    return siteOBJ;
} 

/* Set the width of the side navigation to 250px and the left margin of the page content to 250px and add a black background color to body */
function openNav(opSelectMenuOpen) {
    document.getElementById("mySidenav").style.width = "320px";
    document.getElementById("main").style.marginLeft = "320px";
    $('.sidenav').css({"border-right": "1px solid #36A9E0"});
    return opSelectMenuOpen = true;
}
  
  /* Set the width of the side navigation to 0 and the left margin of the page content to 0, and the background color of body to white */
function closeNav(opSelectMenuOpen) {
    document.getElementById("mySidenav").style.width = "0";
    document.getElementById("main").style.marginLeft = "0";
    $('.sidenav').css({"border-right": "1px solid #111111"});
    return opSelectMenuOpen = false;
}

function toggleOpSelectButton(id, toggleID) {
    $('#' + id).css({"background-color": "rgba(210, 208, 217, 0.774)"});
    $('#' + id).css({"border": "1px solid rgba(240, 240, 240, 0.5)"});
    $('#' + id).addClass(".opSelectButton:hover");

    if(toggleID == 0){
        $('#opSelect_ValkyrieButton').css({"background-color": "#111111"});
        $('#opSelect_ValkyrieButton').css({"border": "1px solid #36A9E0"});
    }
    else if(toggleID == 1) {
        $('#opSelect_JagerButton').css({"background-color": "#111111"});
        $('#opSelect_JagerButton').css({"border": "1px solid #36A9E0"});
    }
    else if(toggleID == 2) {
        $('#opSelect_MuteButton').css({"background-color": "#111111"});
        $('#opSelect_MuteButton').css({"border": "1px solid #36A9E0"}); 
    }
    else if(toggleID == 3) {
        $('#opSelect_MiraButton').css({"background-color": "#111111"});
        $('#opSelect_MiraButton').css({"border": "1px solid #36A9E0"});
    }
    else if(toggleID == 4) {
        $('#opSelect_MaestroButton').css({"background-color": "#111111"});
        $('#opSelect_MaestroButton').css({"border": "1px solid #36A9E0"});
    }
    else {
        $('#opSelect_MelusiButton').css({"background-color": "#111111"});
        $('#opSelect_MelusiButton').css({"border": "1px solid #36A9E0"});
    }

    if(id == "opSelect_ValkyrieButton") {
        return toggleID = 0;
    }
    else if(id == "opSelect_JagerButton") {
        return toggleID = 1;
    }
    else if(id == "opSelect_MuteButton") {
        return toggleID = 2;
    }
    else if(id == "opSelect_MiraButton") {
        return toggleID = 3;
    }
    else if(id == "opSelect_MaestroButton") {
        return toggleID = 4;
    }
    else{
        return toggleID = 5;
    }
}