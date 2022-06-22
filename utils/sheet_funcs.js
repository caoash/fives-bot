const { GoogleSpreadsheet } = require('google-spreadsheet');
const { CLIENT_EMAIL, PRIVATE_KEY, SHEET_ID, MAX_PLAYERS } = require('./config.json');

const doc = new GoogleSpreadsheet(SHEET_ID);

let mainSheet = null, eloSheet = null, mapSheet = null, logSheet = null; 

/*
    initializes the google sheet
*/

const initSheet = async () => {
    await doc.useServiceAccountAuth({
        client_email: CLIENT_EMAIL,
        private_key: PRIVATE_KEY,
    });

    await doc.loadInfo();   

    // load in the different sheets
    mainSheet = doc.sheetsByIndex[0]; // sheet containing players by role + participants
    eloSheet = doc.sheetsByIndex[1]; // sheet containing elo rating of players
    mapSheet = doc.sheetsByIndex[2]; // sheet mapping discord ID to player name
    logSheet = doc.sheetsByIndex[3]; // sheet logging win/lose of players

    // load all useful cells
    await mainSheet.loadCells('F2:F' + MAX_PLAYERS.toString()); // player list
    await mapSheet.loadCells('B1:C' + MAX_PLAYERS.toString()); // name : discord id
    await eloSheet.loadCells('I2:P' + MAX_PLAYERS.toString()); // player stats
}

/*
    returns all registered players
    @return {List}          player list
*/

const findAllPlayers = () => {
    let playerArr = [];
    for (let i = 2; i <= MAX_PLAYERS; ++i) {
        let playerData = mainSheet.getCellByA1('F' + i.toString()).value;
        if (playerData !== null) {
            playerArr.push(playerData);
        }
    }
    return playerArr;
}

/*
    maps player to discord id
    @param {String} name    name of player
    @return {String}        discord id of player
*/

const mapPlayerToID = (name) => {
    let resID = null;
    for (let i = 2; i <= MAX_PLAYERS; ++i) {
        let playerName = mapSheet.getCellByA1('B' + i.toString()).value;
        if (playerName === name) {
            let playerID = mapSheet.getCellByA1('C' + i.toString()).value;
            if (resID !== null) {
                throw new Error("More than one ID for this user was found. Make sure no duplicate names exist.");
            } else {
                resID = playerID;
            }
        }
    }
    return resID;
}

/*
    maps discord id to player
    @param {String} id      discord id of player
    @return {String}        name of player
*/

const mapIDToPlayer = (id) => {
    let resName = null;
    for (let i = 2; i <= MAX_PLAYERS; ++i) {
        let playerID = mapSheet.getCellByA1('C' + i.toString()).value;
        if (playerID === id) {
            let playerName = mapSheet.getCellByA1('B' + i.toString()).value;
            if (resName !== null) {
                throw new Error("More than one user with this ID was found. Discord ID's should be unique. Make sure nothing was manually changed.");
            } else {
                resName = playerName;
            }
        }
    }
    return resName;
}

/*
    gets elo of player
    @param {String} id      discord id of player
    @return {Integer}       elo of player
*/

const getEloOfPlayerById = (id) => {
    for (let i = 2; i <= MAX_PLAYERS; ++i) {
        let playerName = eloSheet.getCellByA1('I' + i.toString());
        if (mapPlayerToID(playerName) === id) {
            let playerElo = eloSheet.getCellByA1('M' + i.toString());
            return playerElo;
        }
    }
    return null;
}

/*
    gets elo of player
    @param {String} name    name of player
    @return {Integer}       elo of player
*/

const getEloOfPlayerByName = (name) => {
    for (let i = 2; i <= MAX_PLAYERS; ++i) {
        let playerName = eloSheet.getCellByA1('I' + i.toString());
        if (playerName === id) {
            let playerElo = eloSheet.getCellByA1('M' + i.toString());
            return playerElo;
        }
    }
    return null;
}

const debugCode = async () => {
    let res = findAllPlayers();
    console.log(res);
}

initSheet().then(debugCode);
