const { GoogleSpreadsheet } = require('google-spreadsheet');
const { CLIENT_EMAIL, PRIVATE_KEY, SHEET_ID, MAX_PLAYERS, MAX_GAMES, ALPHABET } = require('./config.json');

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

    // load all useful cells (+1 because it starts at 2)
    await mainSheet.loadCells('F2:F' + (MAX_PLAYERS + 1).toString()); // player list

    await mapSheet.loadCells('B1:C' + MAX_PLAYERS.toString()); // name : discord id

    await eloSheet.loadCells('I2:P' + (MAX_PLAYERS + 1).toString()); // player stats
    await eloSheet.loadCells('R2:R3'); // mean and stdev

    await logSheet.loadCells('A1:Z' + MAX_GAMES.toString()); // player logs (NOTE: MAX_PLAYERS is 26 (A-Z))
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

const getStatsOfPlayerById = (id) => {
    let statsArr = [9, 10, 12, 13]; // [wins, losses, elo, winrate]
    let resArr = [null, null, null, null];

    for (let i = 2; i <= MAX_PLAYERS; ++i) {
        let playerName = eloSheet.getCellByA1('I' + i.toString()).value;
        if (mapPlayerToID(playerName).toString() === id.toString()) {
            for (let j = 0; j < 4; ++j) {
                let stat = eloSheet.getCell(i - 1, statsArr[j]).value;
                if (resArr[j] !== null) {
                    throw new Error("Found duplicate user.")
                }
                resArr[j] = stat;
            }
            break;
        }
    }
    
    return resArr;
}

/*
    gets elo of player
    @param {String} name    name of player
    @return {Integer}       elo of player
*/

const getStatsOfPlayerByName = (name) => {
    let statsArr = [9, 10, 12, 13]; // [wins, losses, elo, winrate]
    let resArr = [null, null, null, null];

    for (let i = 2; i <= MAX_PLAYERS; ++i) {
        let playerName = eloSheet.getCellByA1('I' + i.toString()).value;
        if (playerName === name) {
            for (let j = 0; j < 4; ++j) {
                let stat = eloSheet.getCell(i, statsArr[j]).value;
                if (resArr[j] !== null) {
                    throw new Error("Found duplicate user.")
                }
                resArr[j] = stat;
            }
        }
    }
    
    return resArr;
}

/*
    adds a new player to all relevant parts of the sheet
    @param {String} name    name of player
    @param {String} id      Discord ID of player
*/

const addNewPlayer = async (name, id) => {
    /*
        Add player and ID to mapping
    */

    let foundUpdate = false;
    for (let i = 2; i <= MAX_PLAYERS; ++i) {
        let playerName = mapSheet.getCellByA1('B' + i.toString());
        if (playerName.value !== null) {
            let playerID = mapSheet.getCellByA1('C' + i.toString());
            if (playerID.value === null) {
                throw new Error("Player found, but ID not found on line " + i + " of mapper.");
            }
        } else {
            let playerID = mapSheet.getCellByA1('C' + i.toString());
            if (playerID.value !== null) {
                throw new Error("ID found, but player not found on line " + i + " of mapper.");
            } else {
                playerName.value = name;
                playerName.horizontalAlignment = "CENTER";
                playerID.value = id;
                playerID.horizontalAlignment = "CENTER";
                foundUpdate = true;
                break;
            }
        }
    }
    if (!foundUpdate) throw new Error("No available spaces found in mapSheet. Try increasing MAX_PLAYERS.");
    await mapSheet.saveUpdatedCells();

    /*
        Add player to list of players in main list

        @TODO allow players to register by role
    */

    foundUpdate = false;

    for (let i = 2; i <= MAX_PLAYERS; ++i) {
        let playerName = mainSheet.getCellByA1('F' + i.toString());
        if (playerName.value === null) {
            playerName.value = name;
            foundUpdate = true;
            break;
        }
    }
    if (!foundUpdate) throw new Error("No available spaces found in mainSheet. Try increasing MAX_PLAYERS.");
    await mainSheet.saveUpdatedCells();

    /*
        Add player to logger and fill their match history with N/A
        
        @TODO allow users to upload match history 
    */

    let foundCol = -1;

    for (let i = 0; i < MAX_PLAYERS; ++i) { // CONSTRAINT: MAX_PLAYERS SHOULD BE 26 (A-Z)
        let playerCell = logSheet.getCell(0, i);
        if (playerCell.value === null) {
            foundCol = i;
            break;
        }
    }

    if (foundCol === -1) {
        throw new Error("No open cells found. This is likely because all columns were filled.");
    } else if (foundCol === 0) {
        throw new Error("We found the first column as the empty one. This shouldn't happen, because players already exist. To determine how many games have happened, we use manually entered players. Make sure the first column has a player with games filled in.");
    } else {
        let nameCell = logSheet.getCell(0, foundCol);
        if (nameCell.value !== null) {
            throw new Error("A player already exists in found column.");
        }

        nameCell.value = name;
        nameCell.horizontalAlignment = "CENTER";

        for (let i = 1; i < MAX_GAMES; ++i) {
            let gameCell = logSheet.getCell(i, foundCol);
            let prevCell = logSheet.getCell(i, foundCol - 1);
            if (gameCell.value !== null) {
                throw new Error("For some reason, the cell had no name but had a game listed. Likely a manual edit of the sheet needed.");
            } else if (prevCell.value === null) {
                break;
            } else {
                gameCell.value = "N/A";
                gameCell.horizontalAlignment = "CENTER";
            }
        }

        await logSheet.saveUpdatedCells();
    }

    /*
        Add player to ELO system
    */
    let foundRow = -1;
    for (let i = 1; i <= MAX_PLAYERS; ++i) {
        console.log('I' + (i + 1).toString());
        let playerCell = eloSheet.getCellByA1('I' + (i + 1).toString()); // increase from 0-index to 1-index (A1 notation)
        if (playerCell.value === null) {
            foundRow = i;
            break;
        }
    }

    if (foundRow === -1) {
        throw new Error("No open rows found in eloSheet. Try increasing MAX_PLAYERS.");
    }

    let playerCellAtFoundRow = eloSheet.getCellByA1('I' + (foundRow + 1).toString());
    if (playerCellAtFoundRow.value !== null) {
        throw new Error("For some reason, there was a player name found in the empty row.")
    }

    playerCellAtFoundRow.value = name;

    { // manually set the formulas for each relevant cell in the row

        let winCell = eloSheet.getCell(foundRow, 9);
        let loseCell = eloSheet.getCell(foundRow, 10);
        let diffCell = eloSheet.getCell(foundRow, 11);
        let eloCell = eloSheet.getCell(foundRow, 12);
        let winRateCell = eloSheet.getCell(foundRow, 13);
        let zScoreCell = eloSheet.getCell(foundRow, 14);
        let percentileCell = eloSheet.getCell(foundRow, 15);

        let rowAlphabet = ALPHABET.charAt(foundRow - 1);
        let foundRowA1 = foundRow + 1;

        winCell.formula = "=COUNTIF(Logger!" + rowAlphabet + "2:" + rowAlphabet + MAX_PLAYERS.toString() + ", \"WIN\")";
        loseCell.formula = "=COUNTIF(Logger!" + rowAlphabet + "2:" + rowAlphabet + MAX_PLAYERS.toString() + ", \"LOSE\")";
        diffCell.formula = "=J" + foundRowA1 + "- K" + foundRowA1;
        eloCell.formula = "=100+(2*L" + foundRowA1 + ")";
        winRateCell.formula = "=CONCAT(100 * (J" + foundRowA1 + "/ max(1, (J" + foundRowA1 + " + K" + foundRowA1 + "))), \"%\")";
        zScoreCell.formula = "=(M" + foundRowA1 + "-$R$3)/$R$2";
        percentileCell.formula = "=NORM.S.DIST(O" + foundRowA1 + ")";

    }

    await eloSheet.saveUpdatedCells();

    return;
}

module.exports = {
    initSheet, findAllPlayers, mapPlayerToID, mapIDToPlayer, getStatsOfPlayerById, getStatsOfPlayerByName, addNewPlayer
};


// const debugCode = async () => {
//     await addNewPlayer("A", "BB");
// }

// initSheet().then(debugCode);



