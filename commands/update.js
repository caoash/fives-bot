const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed } = require('discord.js');
const { EMOTE_LIST, TEAM_SIZE, APPROVED_LIST } = require('../utils/config');

const {
    updateWinner, clearSheet, gameOngoing
} = require('../utils/sheet_funcs');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('update')
		.setDescription('Update the game after it\'s over.')
        .addStringOption(option => 
            option
                .setName('winner')
                .setDescription('The winning team.')
                .setRequired(true)
                .addChoices(
                    { name: 'Team One', value: 'ONE' },
                    { name: 'Team Two', value: 'TWO' },
                )
        ),
	async execute(interaction) {
        if (!APPROVED_LIST.includes(interaction.user.id)) {
            interaction.reply("You are not approved to run this command. DM Mikey if you think this is a mistake.");
            return;
        }
        if (!gameOngoing()) {
            interaction.reply("There is no ongoing game.");
            return;
        }
        let winner = interaction.options.getString('winningTeam');
        await updateWinner(winner);
        await clearSheet();
        interaction.reply("Updated sheet.");
	},
};