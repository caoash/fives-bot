const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed } = require('discord.js');
const { EMOTE_LIST, TEAM_SIZE, EMBED_COLOR } = require('../utils/config');

const {
    getPlayerList, updateTeams, mapPlayerToID 
} = require('../utils/sheet_funcs');

const {
    makeTeams, 
} = require('../utils/lib_funcs');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('start')
		.setDescription('Make teams and start fives.')
        .addStringOption(option => 
            option
                .setName('setting')
                .setDescription('The setting used to make teams.')
                .setRequired(true)
                .addChoices(
                    { name: 'Random', value: 'RANDOM' },
                )
        ),
	async execute(interaction) {
        let curSetting = interaction.options.getString('setting');
        const teamsEmbed = new MessageEmbed()
            .setColor(EMBED_COLOR)
            .setTitle('Fives Teams')
            .setDescription(
                'Teams were made using the setting: ' + curSetting + "."
            );

        let curList = getPlayerList();
        if (curList.size < TEAM_SIZE) {
            interaction.reply("There are not " + TEAM_SIZE + " players signed up.");
            return;
        }

        let curTeams = makeTeams(curList, curSetting);
        if (curTeams === null) {
            interaction.reply("It's impossible to make teams. Please do `/exit` and re-signup with a more diverse roles.");
            return;
        }
        console.log(curTeams);

        for (let i = 0; i < TEAM_SIZE; i++) {
            let firstID = mapPlayerToID(curTeams[i][0]);
            teamsEmbed.addField(
                curTeams[i][0] + " " + EMOTE_LIST[i], "<@" + firstID + ">", true,
            )
        }

        teamsEmbed.addField("\u200b", "\u200b", false);
        
        for (let i = 0; i < TEAM_SIZE; i++) {
            let secID = mapPlayerToID(curTeams[i][1]);
            teamsEmbed.addField(
                curTeams[i][1] + " " + EMOTE_LIST[i], "<@" + secID + ">", true,
            )
        }

        await updateTeams(curTeams);
        interaction.reply({ embeds : [ teamsEmbed ] });
	},
};