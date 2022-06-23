const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed } = require('discord.js');
const { EMOTE_LIST, TEAM_SIZE, EMBED_COLOR } = require('../utils/config');

const {
    getTeams, gameOngoing, mapPlayerToID
} = require('../utils/sheet_funcs');


module.exports = {
	data: new SlashCommandBuilder()
		.setName('teams')
		.setDescription('Lists current teams.'),
	async execute(interaction) {
        const teamsEmbed = new MessageEmbed()
            .setColor(EMBED_COLOR)
            .setTitle('Fives Teams')

        if (!gameOngoing()) {
            interaction.reply("There is not an ongoing game.");
            return;
        }

        let curTeams = getTeams();
        // console.log(curTeams);

        for (let i = 0; i < TEAM_SIZE; i++) {
            let firstID = mapPlayerToID(curTeams[i][0]);
            let secID = mapPlayerToID(curTeams[i][1]);
            teamsEmbed.addFields(
                { name: curTeams[i][0] + " " + EMOTE_LIST[i], value: "<@" + firstID + ">", inline: true },
                { name: curTeams[i][1] + " " + EMOTE_LIST[i], value:  "<@" + secID + ">", inline: true },
            )
            if (i != TEAM_SIZE - 1) teamsEmbed.addField("\u200b", "\u200b", false);
        }

        interaction.reply({ embeds : [ teamsEmbed ] });
	},
};