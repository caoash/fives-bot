const { GoogleSpreadsheet } = require('google-spreadsheet');
const { CLIENT_EMAIL, PRIVATE_KEY, SHEET_ID, MAX_PLAYERS, MAX_GAMES, ALPHABET, ROLE_LIST, TEAM_SIZE } = require('./config.json');

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
    await mainSheet.loadCells('A2:I' + (MAX_PLAYERS + 1).toString()); // player list

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
    mapSheet.saveUpdatedCells();
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
        if (playerName === null) {
            break;
        }
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
        // console.log('I' + (i + 1).toString());
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

/*
    signs up an existing player for given roles
    @param {String} name    name of player
    @param {String} role1   main role of player
    @param {String} role2   (optional) secondary role of player
*/

const signupPlayer = async (name, role1, role2) => {
    const addRole = (name, role, isMain) => {
        if (!ROLE_LIST.includes(role)) { 
            throw new Error("A nonexisting role was selected.");
        }
        let ind = -1;
        for (let i = 0; i < 5; ++i) {
            if (ROLE_LIST[i] === role) {
                ind = i;
            }
        }
        let found = false;
        for (let i = 1; i <= MAX_PLAYERS; ++i) {
            let roleCell = mainSheet.getCell(i, ind);
            if (roleCell.value === null) {
                roleCell.value = name;
                if (isMain) roleCell.textFormat = { bold: true };
                else if (!isMain) roleCell.textFormat = { bold: false };
                found = true;
                break;
            }
        }
        if (!found) throw new Error("No open spots found to add player to role list. Try increasing MAX_PLAYERS.");
    }   

    if (role1 === null) {
        throw new Error("No roles were selected.");
    } 
    addRole(name, role1, true);
    if (role2 !== null) addRole(name, role2, false);

    await mainSheet.saveUpdatedCells();
}

/*
    removes an existing player from participating in fives
    @param {String} name    name of player
*/


const unsignupPlayer = async (name) => {
    let found = false;
    for (let i = 1; i <= MAX_PLAYERS; ++i) {
        for (let j = 0; j < 5; j++) {
            let curCell = mainSheet.getCell(i, j);
            if (curCell.value === name) {
                curCell.value = null;
                found = true;
            }
        }
    }
    if (found) await mainSheet.saveUpdatedCells();
    return found;
}

/*
    checks if a player is registered for fives
    @param {String} name    name of player
    @return {boolean}       whether the player is registered
*/

const checkRegistration = (name) => {
    let found = false;
    for (let i = 1; i <= MAX_PLAYERS; ++i) {
        for (let j = 0; j < 5; j++) {
            let curCell = mainSheet.getCell(i, j);
            if (curCell.value === name) {
                found = true;
            }
        }
    }
    return found;
}

/*
    gets a list of registered players and their roles
    @TODO assert that each player does not have two primary roles, secondary, >2 roles, etc.

    @return {Map}          map of objects {player, [ROLES]}
*/

const getPlayerList = () => {
    let resList = new Map();
    for (let i = 1; i <= MAX_PLAYERS; ++i) {
        for (let j = 0; j < 5; j++) {
            let curCell = mainSheet.getCell(i, j);

            let curName = curCell.value;
            let curFormat = curCell.textFormat;
            
            let isPrimary = (curFormat !== undefined);

            // have to do this because it still checks curFormat even if undefined (MAYBE?)
            if (isPrimary) isPrimary &= ('bold' in curFormat && curFormat['bold']);
            
            if (curName !== null) {
                if (!resList.has(curName)) {
                    if (isPrimary) resList.set(curName, [j, null]);
                    else resList.set(curName, [null, j]);
                } else {
                    let curArr = resList.get(curName).slice();
                    if (isPrimary) curArr[0] = j;
                    else curArr[1] = j;
                    resList.set(curName, curArr);
                }
            }
        }
    }
    return resList;
}

/*
    updates the teams on the spreadsheet

    @param {Array} teamList         list of both teams sorted by role
*/


const updateTeams = async (teamList) => {
    for (let i = 0; i < TEAM_SIZE; i++) {
        let firstTeamCell = mainSheet.getCellByA1('G' + (i + 2).toString());
        let secondTeamCell = mainSheet.getCellByA1('H' + (i + 2).toString());

        if (firstTeamCell === null || secondTeamCell === null) {
            throw new Error("Teams weren't empty before starting this operation. Did you forget to run `/update {winningTeam}` after the previous game ended?");
        }

        firstTeamCell.value = teamList[i][0];
        secondTeamCell.value = teamList[i][1];
    }
    await mainSheet.saveUpdatedCells();
}

/*
    gets a list of both teams

    @return {Array}                 list of both teams sorted by role
*/

const getTeams = () => {
    let teams = [];
    for (let i = 0; i < TEAM_SIZE; ++i) {
        let firstTeamCell = mainSheet.getCellByA1('G' + (i + 2).toString());
        let secondTeamCell = mainSheet.getCellByA1('H' + (i + 2).toString());
        if (firstTeamCell === null || secondTeamCell === null) {
            throw new Error("Empty cell found when getting teams. Likely means there is no ongoing game or TEAM_SIZE is set incorrectly.");
        }
        teams.push([firstTeamCell.value, secondTeamCell.value]);
    }
    return teams;
}

/*
    checks whether there is an ongoing game

    @return {boolean}                    if there is an ongoing game
*/


const gameOngoing = () => {
    let countPlayers = 0;
    for (let i = 0; i < TEAM_SIZE; ++i) {
        let firstTeamCell = mainSheet.getCellByA1('G' + (i + 2).toString());
        let secondTeamCell = mainSheet.getCellByA1('H' + (i + 2).toString());
        // console.log(firstTeamCell.value + " " + secondTeamCell.value);
        if (firstTeamCell.value !== null || secondTeamCell.value !== null) {
            ++countPlayers;
        }
    }
    // console.log(countPlayers);
    if (countPlayers === TEAM_SIZE) return true;
    else if (countPlayers === 0) return false;
    else throw new Error("There were between 1 and 9 players active. Likely needs a manual fix.");
}

/*
    updates the logs after the game

    @param {String} winningTeam         the team that won     
*/

const updateWinner = async (winningTeam) => {
    let winner = (winningTeam === 'ONE' ? 0 : 1);

    let winners = [];
    let losers = [];

    for (let i = 1; i < 2 + TEAM_SIZE; ++i) {
        let winCheck = mainSheet.getCell(i, 6 + winner);
        let loseCheck = mainSheet.getCell(i, 6 + (winner ^ 1));
        winners.push(winCheck.value);
        losers.push(loseCheck.value);
    }

    for (let i = 0; i < MAX_PLAYERS; ++i) {
        let nameCell = logSheet.getCell(0, i);
        if (nameCell.value === null) continue;
        for (let j = 1; j <= MAX_GAMES; ++j) {
            let gameCell = logSheet.getCell(j, i);
            if (gameCell.value === null) {
                if (winners.includes(nameCell.value)) gameCell.value = 'WIN';
                else if (losers.includes(nameCell.value)) gameCell.value = 'LOSE';
                else gameCell.value = 'N/A';
                gameCell.horizontalAlignment = "CENTER";
                break;
            }
        }
    }

    await logSheet.saveUpdatedCells();
}


/*
    clears the mainSheet after games 
*/

const clearSheet = async () => {
    for (let i = 1; i < 2 + TEAM_SIZE; ++i) {
        let winCheck = mainSheet.getCell(i, 6);
        let loseCheck = mainSheet.getCell(i, 7);
        let readyCheck = mainSheet.getCell(i, 8);
        winCheck.value = null;
        loseCheck.value = null;
        readyCheck.value = null;
    }

    await mainSheet.saveUpdatedCells();
}

/*
    clears the mainSheet of players
*/

const clearPlayers = async () => {
    await mainSheet.saveUpdatedCells();
    for (let i = 1; i <= MAX_PLAYERS; ++i) {
        for (let j = 0; j < 5; j++) {
            let curCell = mainSheet.getCell(i, j);
            curCell.value = null;
        }
    }
}


/*
    adds a user to the ready list 
    @param {Integer} id             id of user
*/

const addReadyUser = async (id) => {
    let found = false;
    let fi = -1;
    for (let i = 2; i <= MAX_PLAYERS; ++i) {
        let curCell = mainSheet.getCellByA1('I' + i.toString());
        if (curCell.value === null) {
            fi = i;
            curCell.horizontalAlignment = "CENTER";
            found = true;
            break;
        }
    }
    if (!found) throw new Error("Could not find a cell to place the ID. Try increasing MAX_PLAYERS.");
    let finalCell =  mainSheet.getCellByA1('I' + fi.toString());
    finalCell.value = id;
    await mainSheet.saveUpdatedCells();
    return false;
}

/*
    removes a user from the ready list
    @param {Integer} id             id of user
*/

const removeReadyUser = async (id) => {
    for (let i = 2; i <= MAX_PLAYERS; ++i) {
        let curCell = mainSheet.getCellByA1('I' + i.toString());
        if (curCell.value === id) {
            curCell.value = null;
            curCell.horizontalAlignment = "CENTER";
            break;
        }
    }
    await mainSheet.saveUpdatedCells();
}

/*
    returns the number of ready players 
    @return {Integer} players   number of readied players
*/

const getReady = () => {
    mainSheet.saveUpdatedCells();
    let res = 0; // number of readied users
    for (let i = 2; i <= MAX_PLAYERS; ++i) {
        let curCell = mainSheet.getCellByA1('I' + i.toString());
        if (curCell.value !== null) {
            ++res;
        }
    }
    return res;
}

/*
    returns whether a player is ready 
    @param  {String} id         player id
    @return {boolean}           if the player with id is ready
*/

const isReady = (id) => {
    mainSheet.saveUpdatedCells();
    for (let i = 2; i <= MAX_PLAYERS; ++i) {
        let curCell = mainSheet.getCellByA1('I' + i.toString());
        if (curCell.value === id) {
            return true;
        }
    }
    return false;
}

module.exports = {
    initSheet, findAllPlayers, mapPlayerToID, mapIDToPlayer, getStatsOfPlayerById, getStatsOfPlayerByName, 
    addNewPlayer, signupPlayer, unsignupPlayer, checkRegistration, getPlayerList, updateTeams, gameOngoing, 
    updateWinner, clearSheet, getTeams, clearPlayers, addReadyUser, getReady, removeReadyUser, isReady
};


const debugCode = async () => {
    getPlayerList();
}

initSheet().then(debugCode);



