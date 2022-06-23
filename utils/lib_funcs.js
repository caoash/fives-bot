/*
    makes teams based on settings
    @TODO random teams
    @TODO balanced teams
    @TODO custom teams

    @param {Map} players        map of the players to their roles 
    @param {String} setting     which setting to create teams by [RANDOM, BALANCED, CUSTOM]
*/

const { TEAM_SIZE } = require('./config.json');

const makeTeams = (players, setting) => {

    const makeRandomTeams = (playerList) => {
        // give all players who only selected one role their role
        let playerRoles = [];
        for (let i = 0; i < TEAM_SIZE; i++) playerRoles.push([null, null]);
        
        let goodSols = [];

        console.log(playerList);

        if (playerList.size != 2 * TEAM_SIZE) {
            throw new Error("There are not ten players.");
        }

        for (let i = 0; i < 1 << (2 * TEAM_SIZE); ++i) {
            let cnt = 0;
            let roleCnt = [];
            for (let j = 0; j < TEAM_SIZE; j++) roleCnt.push(0);
            playerList.forEach((value, key) => {
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
        } else {
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
            let cnt = 0;
            playerList.forEach((value, key) => {
                let role = value[1];
                if ((chosenSol & (1 << cnt)) > 0) {
                    role = value[0];
                } 
                let primary = playerRoles[role][0];
                if (primary === null) playerRoles[role][0] = key;
                else playerRoles[role][1] = key;
                ++cnt;
            });
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
    }

    switch(setting) {
        case 'RANDOM':
            return makeRandomTeams(players);
        // case 'BALANCED':
        //     return make_balanced_teams(players);
        // case 'CUSTOM':
        //     return make_custom_team(players);
    }
}

module.exports = {
    makeTeams
}