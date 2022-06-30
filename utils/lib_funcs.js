/*
    makes teams based on settings
    @TODO random teams
    @TODO balanced teams
    @TODO custom teams

    @param {Map} players        map of the players to their roles 
    @param {String} setting     which setting to create teams by [RANDOM, BALANCED, CUSTOM]
*/

const { TEAM_SIZE } = require('./config.json');

const makeTeams = (players, setting, customPlayers = null) => {

    let playerRoles = [];
    for (let i = 0; i < TEAM_SIZE; i++) playerRoles.push([null, null]);
    
    let goodSols = [];

    if (players.size != 2 * TEAM_SIZE) {
        throw new Error("There are not ten players.");
    }

    if (setting !== 'CUSTOM') {
        for (let i = 0; i < 1 << (2 * TEAM_SIZE); ++i) {
            let cnt = 0;
            let roleCnt = [];
            for (let j = 0; j < TEAM_SIZE; j++) roleCnt.push(0);
            players.forEach((value, key) => {
                if ((i & (1 << cnt)) > 0) {
                    if (value[0] === null) {
                        throw new Error("A player does not have a primary role");
                    }
                    roleCnt[value[0]]++;
                } else {
                    if (value[1] === null) {
                        return;
                    }
                    roleCnt[value[1]]++;
                }
                ++cnt;
            });
            let good = true;
            for (let j = 0; j < TEAM_SIZE; j++) {
                // console.log(roleCnt[j] + " ");
                if (roleCnt[j] != 2) good = false; 
            }
            if (good) goodSols.push(i);
        }
        if (goodSols.length === 0) {
            return null;
        }    
    }
    
    /*
        The "goodness" of a solution in the random heuristic is defined by:
        - how many players get their main role
        - once roles are assigned, randomly swap players around
    */

    const findBestSolRandom = (goodSols) => {
        let rndInd = 0;
        let maxBit = 0;
        for (let i = 0; i < goodSols.length; ++i) {
            let bitCnt = 0;
            for (let j = 0; j < TEAM_SIZE; ++j) {
                if ((i & (1 << j)) > 0) ++bitCnt;
            }
            if (bitCnt > maxBit) {
                maxBit = bitCnt;
                rndInd = i;
            }
        }
        let chosenSol = goodSols[rndInd];
        let playerRoles = makeSol(chosenSol);

        // randomly swap around the roles for the players

        for (let i = 0; i < TEAM_SIZE; i++) {
            let swap = Math.floor(Math.random() * 2);
            if (swap > 0) {
                let temp = playerRoles[i][0];
                playerRoles[i][0] = playerRoles[i][1];
                playerRoles[i][1] = temp;
            }
        }
        return playerRoles;
    }

    /*
        The "goodness" of a solution in the balanced heuristic is defined by:
        - how many players get their main role
        - the difference in sum of ELO
    */

    /*
        Creates a solution given chosenSol, a bitmask of players on each team.
    */

    const makeSol = (chosenSol) => {
        let curRoles = [];
        console.log(players);
        for (let i = 0; i < TEAM_SIZE; i++) curRoles.push([null, null]);

        let cnt = 0;
        players.forEach((value, key) => {
            let role = value[1];
            if ((chosenSol & (1 << cnt)) > 0) {
                role = value[0];
            } 
            let primary = curRoles[role][0];
            if (primary === null) curRoles[role][0] = key;
            else curRoles[role][1] = key;
            ++cnt;
        });
        return curRoles;
    }

    switch(setting) {
        case 'RANDOM':
            return findBestSolRandom(goodSols);
        // case 'BALANCED':
    }
}

module.exports = {
    makeTeams
}