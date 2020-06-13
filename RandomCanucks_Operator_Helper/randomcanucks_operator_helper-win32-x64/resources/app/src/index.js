const { app, BrowserWindow, Menu, dialog, ipcMain } = require('electron');
const fs = require('fs');
const path = require('path');

const createWindow = () => {
  // Create the browser window.
    const mainWindow = new BrowserWindow({
        width: 1920,
        height: 1080,
        webPreferences: {
            nodeIntegration: true,
        }
    });


    // and load the index.html of the app.
    mainWindow.loadFile(path.join(__dirname, 'index.html'));

    // Open the DevTools.
    //mainWindow.webContents.openDevTools();

    // Custom menu tmeplate for application
    const template = [
        {
            label: "Menu",
            submenu: [
                {role: 'minimize'}, 
                {role: 'reload'}, 
                {role: 'togglefullscreen'}, 
                {role: 'toggleDevTools'}, 
                {role: 'quit'}
            ]
        }
    ];

    // Replace default menu with custom template
    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);

    // create user directory under "myDocuments"
    createDocumentsDirectory();

    // Once every main window job is done, these ICP connection with the render proccess will run allowing critical data to be shared. Data such as, map-data.json Object, Path to said direcory, and data from the user config file
    mainWindow.webContents.once('dom-ready', () => {
        ipcMain.on('gameDataOBJ-request-query', (event, arg) => {
            var gameDataOBJ = fillGameDataOBJ(createGameDataOBJ());
            event.returnValue = JSON.stringify(gameDataOBJ);
        });
        
        ipcMain.on('directory-request-query', (event, arg) => {
            var dirName = app.getPath('documents');
            event.returnValue = dirName;
        });

        ipcMain.on('user-data-request', (event, argt) => {
            var userDataOBJ = getUserDataOBJ();
            event.returnValue = userDataOBJ;
        });
    });
}; 

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow);

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// Error message: IPC channel from render process reports that the map-data.json file was tampered with
ipcMain.on('Error: gameDataOBJ.length != mapNumber', (event, arg) => {
    dialog.showErrorBox('Game Data Loading Error', 'Error: game data pulled from map-data.json failed to meet minimum length');
    app.quit();
});

// Error message: IPC channel from render process reports that the map-data.json file was tampered with
ipcMain.on('Error: gameDataOBJ[i].site.length invalid', (event, arg) => {
    dialog.showErrorBox('Game Data Loading Error', 'Error: game data for a specific map pulled from map-data.json failed to meet minimum length');
    app.quit();
});


// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.


// Create a program folder in "MyDocuments" called RandomCanucksOperatorHelper. This folder will be used by the user to store their user collected Valkyrie Camera Spot pictures. Inside the folder is a folder for each map that contains a folder for each bomb site, and a user config file
function createDocumentsDirectory() {
    // get path to my document
    var dir = app.getPath('documents') + "\\RandomCanucksOperatorHelper";
    var ops = ["Valkyrie", "Jager", "Mute", "Mira", "Maestro", "Melusi"];

    // define standard game data
    var gameDataOBJ = [
        {
            map: "Bank",
            site: [
                {name: "1F_Open_Area_and_1F_Staff_Room", viability : 3, cameraSpots: [], jagerSpots: [], muteSpots: [], miraSpots: [], maestroSpots: [], melusiSpots: []},
                {name: "1F_Tellers_Office_and_1F_Archives", viability : 2, cameraSpots: [], jagerSpots: [], muteSpots: [], miraSpots: [], maestroSpots: [], melusiSpots: []},
                {name: "2F_CEO_Office_and_2F_Executive_Lounge", viability : 2, cameraSpots: [], jagerSpots: [], muteSpots: [], miraSpots: [], maestroSpots: [], melusiSpots: []},
                {name: "Basement_CCTV_Room_and_Basement_Lockers", viability : 1, cameraSpots: [], jagerSpots: [], muteSpots: [], miraSpots: [], maestroSpots: [], melusiSpots: []}
            ],
            Floors: ["Basement", "Floor-1", "Floor-2", "Roof"]
        },
        {
            map: "Border",
            site: [
                {name: "1F_Bathroom_and_1F_Tellers", viability : 3, cameraSpots: [], jagerSpots: [], muteSpots: [], miraSpots: [], maestroSpots: [], melusiSpots: []},
                {name: "1F_Supply_Room_and_1F_Customs_Inspection", viability : 2, cameraSpots: [], jagerSpots: [], muteSpots: [], miraSpots: [], maestroSpots: [], melusiSpots: []},
                {name: "1F_Workshop_and_1F_Ventilation_Room", viability : 2, cameraSpots: [], jagerSpots: [], muteSpots: [], miraSpots: [], maestroSpots: [], melusiSpots: []},
                {name: "2F_Armory_Lockers_and_2F_Archives", viability : 1, cameraSpots: [], jagerSpots: [], muteSpots: [], miraSpots: [], maestroSpots: [], melusiSpots: []}
            ],
            Floors: ["Floor-1", "Floor-2", "Roof"]
        },
        {
            map: "Chalet",
            site: [
                {name: "1F_Bar_and_1F_Gaming_Room", viability : 2, cameraSpots: [], jagerSpots: [], muteSpots: [], miraSpots: [], maestroSpots: [], melusiSpots: []},
                {name: "1F_Kitchen_and_1F_Trophy_Room", viability : 2, cameraSpots: [], jagerSpots: [], muteSpots: [], miraSpots: [], maestroSpots: [], melusiSpots: []},
                {name: "2F_Master_Bedroom_and_2F_Office", viability : 3, cameraSpots: [], jagerSpots: [], muteSpots: [], miraSpots: [], maestroSpots: [], melusiSpots: []},
                {name: "Basement_Wine_Cellar_and_Basement_Snowmobile_Room", viability : 1, cameraSpots: [], jagerSpots: [], muteSpots: [], miraSpots: [], maestroSpots: [], melusiSpots: []}
            ],
            Floors: ["Basement", "Floor-1", "Floor-2", "Roof"]
        },
        {
            map: "Clubhouse",
            site: [
                {name: "1F_Bar_1F_Stock_Room", viability : 3, cameraSpots: [], jagerSpots: [], muteSpots: [], miraSpots: [], maestroSpots: [], melusiSpots: []},
                {name: "2F_CCTV_Room_2F_Cash_Room", viability : 1, cameraSpots: [], jagerSpots: [], muteSpots: [], miraSpots: [], maestroSpots: [], melusiSpots: []},
                {name: "2F_Gym_2F_Bedroom", viability : 2, cameraSpots: [], jagerSpots: [], muteSpots: [], miraSpots: [], maestroSpots: [], melusiSpots: []},
                {name: "Basement_Church_and_Basement_Arsenal_Room", viability : 2, cameraSpots: [], jagerSpots: [], muteSpots: [], miraSpots: [], maestroSpots: [], melusiSpots: []}
            ],
            Floors: ["Basement", "Floor-1", "Floor-2", "Roof"]
        },
        {
            map: "Coastline",
            site: [
                {name: "1F_Blue_Bar_1F_Sunrise_Bar", viability : 2, cameraSpots: [], jagerSpots: [], muteSpots: [], miraSpots: [], maestroSpots: [], melusiSpots: []},
                {name: "1F_Kitchen_1F_Service_Entrance", viability : 2, cameraSpots: [], jagerSpots: [], muteSpots: [], miraSpots: [], maestroSpots: [], melusiSpots: []},
                {name: "2F_Hookah_Lounge_2F_Billiards_Room", viability : 1, cameraSpots: [], jagerSpots: [], muteSpots: [], miraSpots: [], maestroSpots: [], melusiSpots: []},
                {name: "2F_Penthouse_2F_Theater", viability : 3, cameraSpots: [], jagerSpots: [], muteSpots: [], miraSpots: [], maestroSpots: [], melusiSpots: []}
            ],
            Floors: ["Floor-1", "Floor-2", "Roof"]
        },
        {
            map: "Consulate",
            site: [
                {name: "1F_Lobby_and_1F_Press_Room", viability : 2, cameraSpots: [], jagerSpots: [], muteSpots: [], miraSpots: [], maestroSpots: [], melusiSpots: []},
                {name: "1F_Tellers_and_Basement_Archives", viability : 3, cameraSpots: [], jagerSpots: [], muteSpots: [], miraSpots: [], maestroSpots: [], melusiSpots: []},
                {name: "2F_Consul_Office_and_2F_Meeting_Room", viability : 2, cameraSpots: [], jagerSpots: [], muteSpots: [], miraSpots: [], maestroSpots: [], melusiSpots: []},
                {name: "Basement_Garage_and_Basement_Cafeteria", viability : 1, cameraSpots: [], jagerSpots: [], muteSpots: [], miraSpots: [], maestroSpots: [], melusiSpots: []}
            ],
            Floors: ["Basement", "Floor-1", "Floor-2", "Roof"]
        },
        {
            map: "Kafe_Dostoyevsky",
            site: [
                {name: "1F_Kitchen_Service_and_1F_Kitchen_Cooking", viability : 2, cameraSpots: [], jagerSpots: [], muteSpots: [], miraSpots: [], maestroSpots: [], melusiSpots: []},
                {name: "2F_Reading_Room_and_2F_Fireplace_Hall", viability : 3, cameraSpots: [], jagerSpots: [], muteSpots: [], miraSpots: [], maestroSpots: [], melusiSpots: []},
                {name: "2F_Reading_Room_and_2F_Mining_Room", viability : 2, cameraSpots: [], jagerSpots: [], muteSpots: [], miraSpots: [], maestroSpots: [], melusiSpots: []},
                {name: "3F_Cocktail_Lounge_and_3F_Bar", viability : 1, cameraSpots: [], jagerSpots: [], muteSpots: [], miraSpots: [], maestroSpots: [], melusiSpots: []}
            ],
            Floors: ["Floor-1", "Floor-2", "Floor-3", "Roof"]
        },
        {
            map: "Kanal",
            site: [
                {name: "1F_Coast_Gaurd_Meeting_Room_1F_Lounge", viability : 2, cameraSpots: [], jagerSpots: [], muteSpots: [], miraSpots: [], maestroSpots: [], melusiSpots: []},
                {name: "1F_Security_Room_1F_Map_Room", viability : 2, cameraSpots: [], jagerSpots: [], muteSpots: [], miraSpots: [], maestroSpots: [], melusiSpots: []},
                {name: "2F_Server_Room_2F_Radar_Room", viability : 1, cameraSpots: [], jagerSpots: [], muteSpots: [], miraSpots: [], maestroSpots: [], melusiSpots: []},
                {name: "Basement_Kayaks_Basement_Supply_Room", viability : 2, cameraSpots: [], jagerSpots: [], muteSpots: [], miraSpots: [], maestroSpots: [], melusiSpots: []}
            ],
            Floors: ["Sub-Basement", "Basement", "Floor-1", "Floor-2", "Roof"]
        },
        {
            map: "Oregon",
            site: [
                {name: "1F_Kitchen_1F_Dining_Hall", viability : 2, cameraSpots: [], jagerSpots: [], muteSpots: [], miraSpots: [], maestroSpots: [], melusiSpots: []},
                {name: "1F_Meeting_Hall_1F_Kitchen", viability : 3, cameraSpots: [], jagerSpots: [], muteSpots: [], miraSpots: [], maestroSpots: [], melusiSpots: []},
                {name: "2F_Kids_Dorms_2F_Dorms_Main_Hall", viability : 2, cameraSpots: [], jagerSpots: [], muteSpots: [], miraSpots: [], maestroSpots: [], melusiSpots: []},
                {name: "Basement_Laundry_Room_Basement_Supply_Room", viability : 1, cameraSpots: [], jagerSpots: [], muteSpots: [], miraSpots: [], maestroSpots: [], melusiSpots: []}
            ],
            Floors: ["Basement", "Floor-1", "Floor-2", "Floor-3", "Roof"]
        },
        {
            map: "Outback",
            site: [
                {name: "1F_Compressor_Room_1F_Gear_Store", viability : 2, cameraSpots: [], jagerSpots: [], muteSpots: [], miraSpots: [], maestroSpots: [], melusiSpots: []},
                {name: "1F_Nature_Room_1F_Bushranger_Room", viability : 2, cameraSpots: [], jagerSpots: [], muteSpots: [], miraSpots: [], maestroSpots: [], melusiSpots: []},
                {name: "2F_Laundry_2F_Games_Room", viability : 2, cameraSpots: [], jagerSpots: [], muteSpots: [], miraSpots: [], maestroSpots: [], melusiSpots: []},
                {name: "2F_Party_Room_2F_Office", viability : 2, cameraSpots: [], jagerSpots: [], muteSpots: [], miraSpots: [], maestroSpots: [], melusiSpots: []}
            ],
            Floors: ["Floor-1", "Floor-2", "Roof"]
        },
        {
            map: "Theme_Park",
            site: [
                {"name": "1F_Armory_1F_Throne_Room", viability : 1, cameraSpots: [], jagerSpots: [], muteSpots: [], miraSpots: [], maestroSpots: [], melusiSpots: []},
                {"name": "1F_Lab_1F_Storage", viability : 3, cameraSpots: [], jagerSpots: [], muteSpots: [], miraSpots: [], maestroSpots: [], melusiSpots: []},
                {"name": "2F_Bunk_2F_Day_Care", viability : 2, cameraSpots: [], jagerSpots: [], muteSpots: [], miraSpots: [], maestroSpots: [], melusiSpots: []},
                {"name": "2F_Initiation_Room_2F_Office", viability : 2, cameraSpots: [], jagerSpots: [], muteSpots: [], miraSpots: [], maestroSpots: [], melusiSpots: []}
            ],
            Floors: ["Floor-1", "Floor-2", "Roof"]
        },
        {
            map: "Villa",
            site: [
                {"name": "1F_Dining_Room_1F_Kitchen", viability : 2, cameraSpots: [], jagerSpots: [], muteSpots: [], miraSpots: [], maestroSpots: [], melusiSpots: []},
                {"name": "1F_Living_Room_1F_Library", viability : 2, cameraSpots: [], jagerSpots: [], muteSpots: [], miraSpots: [], maestroSpots: [], melusiSpots: []},
                {"name": "2F_Aviator_Room_2F_Games_Room", viability : 1, cameraSpots: [], jagerSpots: [], muteSpots: [], miraSpots: [], maestroSpots: [], melusiSpots: []},
                {"name": "2F_Trophy_Room_2F_Statuary_Room", viability : 2, cameraSpots: [], jagerSpots: [], muteSpots: [], miraSpots: [], maestroSpots: [], melusiSpots: []}
            ],
            Floors: ["Basement", "Floor-1", "Floor-2", "Roof"]
        }
    ];

    // if user directory doesnt exist, then create one
    if (!fs.existsSync(dir)){
        fs.mkdirSync(dir);
        for(let i = 0; i < ops.length; i++){
            if(!fs.existsSync(dir + "\\" + ops[i])){
                fs.mkdirSync(dir + "\\" + ops[i]);
                if(ops[i] == "Valkyrie"){
                    if (!fs.existsSync(dir + "\\" + ops[i] + "\\" + "ALT_Cameras")){
                        fs.mkdirSync(dir + "\\" + ops[i] + "\\" + "ALT_Cameras");
                    }
                    if (!fs.existsSync(dir + "\\" + ops[i] + "\\" + "Black_Eye_Camera_Locations")){
                        fs.mkdirSync(dir + "\\" + ops[i] + "\\" + "Black_Eye_Camera_Locations");
                    }
                    for(let j = 0; j < gameDataOBJ.length; j++){
                        if (!fs.existsSync(dir + "\\" + ops[i] + "\\" + "ALT_Cameras" + "\\" + gameDataOBJ[j].map)){
                            fs.mkdirSync(dir + "\\" + ops[i] + "\\" + "ALT_Cameras" + "\\" + gameDataOBJ[j].map);
                        }
                        if (!fs.existsSync(dir + "\\" + ops[i] + "\\" + "Black_Eye_Camera_Locations" + "\\" + gameDataOBJ[j].map)){
                            fs.mkdirSync(dir + "\\" + ops[i] + "\\" + "Black_Eye_Camera_Locations" + "\\" + gameDataOBJ[j].map);
                            for(let k = 0; k < gameDataOBJ[j].site.length; k++){
                                if (!fs.existsSync(dir + "\\" + ops[i] + "\\" + "Black_Eye_Camera_Locations" + "\\" + gameDataOBJ[j].map + "\\" + gameDataOBJ[j].site[k].name)){
                                    fs.mkdirSync(dir + "\\" + ops[i] + "\\" + "Black_Eye_Camera_Locations" + "\\" + gameDataOBJ[j].map + "\\" + gameDataOBJ[j].site[k].name);
                                }
                            }
                        }
                    }    
                }
                else{
                    for(let j = 0; j < gameDataOBJ.length; j++){
                        if (!fs.existsSync(dir + "\\" + ops[i] + "\\" + gameDataOBJ[j].map)){
                            fs.mkdirSync(dir + "\\" + ops[i] + "\\" + gameDataOBJ[j].map);
                            for(let k = 0; k < gameDataOBJ[j].site.length; k++){
                                if (!fs.existsSync(dir + "\\" + ops[i] + "\\" + gameDataOBJ[j].map + "\\" + gameDataOBJ[i].site[k].name)){
                                    fs.mkdirSync(dir + "\\" + ops[i] + "\\" + gameDataOBJ[j].map + "\\" + gameDataOBJ[j].site[k].name);
                                }
                            }
                        }
                    }
                }     
            }       
        }           
        if(!fs.existsSync(dir + "\\" + "config.json")){
            var configData = JSON.stringify({"background" : "", "showSiteViability": true}, null, 4);
            fs.writeFileSync(dir + "\\" + "config.json", configData, (err) => {
                if(err) {
                    console.log(err);
                    throw err;
                }
            });
        }
        if(!fs.existsSync(dir + "\\" + "map-data.json")){
            fs.writeFileSync(dir + "\\" + "map-data.json", JSON.stringify(gameDataOBJ, null, 4));
        }     
    }
}

// Read map-data.json and grap JSON object from that file
function createGameDataOBJ() {
    var dir = app.getPath('documents') + "\\RandomCanucksOperatorHelper";
    var userDataOBJString = fs.readFileSync(dir + "\\" + 'map-data.json');
    data = JSON.parse(userDataOBJString)
    return data;
}

/* Source: https://gist.github.com/kethinov/6658166 - Commented 8 Dec 2016 By: biglovisa.
Walk through a given directory and grab names of all inner files with extensions*/
const walkSync = (dir, filelist) => {
    fs.readdirSync(dir).forEach(file => {
  
      filelist = fs.statSync(path.join(dir, file)).isDirectory()
        ? walkSync(path.join(dir, file), filelist)
        : filelist.concat(path.join(dir, file));
  
    });    
  return filelist;
}

/* Function: implement file walking in directories of "img_BlackEyeLocations" and fill cameraSpot array element of each bombsite element for each map element element in gameDataOBJ */
function fillGameDataOBJ(gameDataOBJ) {      
    var i, j, l;
    var ops = ["Valkyrie", "Jager", "Mute", "Mira", "Maestro", "Melusi"];
    var tempPics = new Array();
    for(l = 0; l < ops.length; l++) {
        for(i = 0; i < gameDataOBJ.length; i++){
            for(j = 0; j < gameDataOBJ[i].site.length; j++){
                if(ops[l] == "Valkyrie"){
                    if(gameDataOBJ[i].site[j].cameraSpots.length != 0){
                        break;
                    } 
                    gameDataOBJ[i].site[j].cameraSpots = [];
                    tempPics = walkSync(app.getPath('documents') + "\\RandomCanucksOperatorHelper\\" + ops[l] + "\\Black_Eye_Camera_Locations\\" + gameDataOBJ[i].map + "\\" + gameDataOBJ[i].site[j].name, tempPics);
                    if(tempPics.length == 0) {
                        break;
                    }
                    for(var k = 0; k < tempPics.length; k++) {
                        tempPics[k] = tempPics[k].split("\\").pop();
                        gameDataOBJ[i].site[j].cameraSpots.push(tempPics[k]);
                    }
                    tempPics = new Array();
                }
                if(ops[l] == "Jager"){
                    if(gameDataOBJ[i].site[j].jagerSpots.length != 0){
                        break;
                    } 
                    gameDataOBJ[i].site[j].jagerSpots = [];
                    tempPics = walkSync(app.getPath('documents') + "\\RandomCanucksOperatorHelper\\" + ops[l] + "\\" + gameDataOBJ[i].map + "\\" + gameDataOBJ[i].site[j].name, tempPics);
                    if(tempPics.length == 0) {
                        break;
                    }
                    
                    for(var k = 0; k < tempPics.length; k++) {
                        tempPics[k] = tempPics[k].split("\\").pop();
                        gameDataOBJ[i].site[j].jagerSpots.push(tempPics[k]);
                    }
                    tempPics = new Array();
                }
                if(ops[l] == "Mute"){
                    if(gameDataOBJ[i].site[j].muteSpots.length != 0){
                        break;
                    } 
                    gameDataOBJ[i].site[j].muteSpots = [];
                    tempPics = walkSync(app.getPath('documents') + "\\RandomCanucksOperatorHelper\\" + ops[l] + "\\" + gameDataOBJ[i].map + "\\" + gameDataOBJ[i].site[j].name, tempPics);
                    if(tempPics.length == 0) {
                        break;
                    }
                    for(var k = 0; k < tempPics.length; k++) {
                        tempPics[k] = tempPics[k].split("\\").pop();
                        gameDataOBJ[i].site[j].muteSpots.push(tempPics[k]);
                    }
                    tempPics = new Array();
                }
                if(ops[l] == "Mira"){
                    if(gameDataOBJ[i].site[j].miraSpots.length != 0){
                        break;
                    } 
                    gameDataOBJ[i].site[j].miraSpots = [];
                    tempPics = walkSync(app.getPath('documents') + "\\RandomCanucksOperatorHelper\\" + ops[l] + "\\" + gameDataOBJ[i].map + "\\" + gameDataOBJ[i].site[j].name, tempPics);
                    if(tempPics.length == 0) {
                        break;
                    }
                    for(var k = 0; k < tempPics.length; k++) {
                        tempPics[k] = tempPics[k].split("\\").pop();
                        gameDataOBJ[i].site[j].miraSpots.push(tempPics[k]);
                    }
                    tempPics = new Array();
                }
                if(ops[l] == "Maestro"){
                    if(gameDataOBJ[i].site[j].maestroSpots.length != 0){
                        break;
                    } 
                    gameDataOBJ[i].site[j].maestroSpots = [];
                    tempPics = walkSync(app.getPath('documents') + "\\RandomCanucksOperatorHelper\\" + ops[l] + "\\" + gameDataOBJ[i].map + "\\" + gameDataOBJ[i].site[j].name, tempPics);
                    if(tempPics.length == 0) {
                        break;
                    }
                    for(var k = 0; k < tempPics.length; k++) {
                        tempPics[k] = tempPics[k].split("\\").pop();
                        gameDataOBJ[i].site[j].maestroSpots.push(tempPics[k]);
                    }
                    tempPics = new Array();
                }
                if(ops[l] == "Melusi"){
                    if(gameDataOBJ[i].site[j].melusiSpots.length != 0){
                        break;
                    } 
                    gameDataOBJ[i].site[j].melusiSpots = [];
                    tempPics = walkSync(app.getPath('documents') + "\\RandomCanucksOperatorHelper\\" + ops[l] + "\\" + gameDataOBJ[i].map + "\\" + gameDataOBJ[i].site[j].name, tempPics);
                    if(tempPics.length == 0) {
                        break;
                    }
                    for(var k = 0; k < tempPics.length; k++) {
                        tempPics[k] = tempPics[k].split("\\").pop();
                        gameDataOBJ[i].site[j].melusiSpots.push(tempPics[k]);
                    }
                    tempPics = new Array();
                }
            }
        }
    }    
    return gameDataOBJ;    
}

// read user data from the user config file located in myDocuments
function getUserDataOBJ(){
    var dir = app.getPath('documents') + "\\RandomCanucksOperatorHelper";
    var userDataOBJ = fs.readFileSync(dir + "\\config.json");
    return JSON.parse(userDataOBJ);
}