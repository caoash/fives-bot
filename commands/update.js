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
                    { name: 'Cancelled', value: 'NULL' },
                )
        ),
	async execute(interaction) {
        if (!APPROVED_LIST.includes(interaction.user.id)) {
            await interaction.reply("You are not approved to run this command. DM Mikey if you think this is a mistake.");
            return;
        }
        if (!gameOngoing()) {
            await interaction.reply("There is no ongoing game.");
            return;
        }
        let winner = interaction.options.getString('winner');
        
        if (winner === 'NULL') {
            await clearSheet();
            await interaction.reply("Cancelled the game.");
            return;
        }
        
        await updateWinner(winner);
        await clearSheet();
        
        await interaction.reply("Updated sheet with winner team " + (winner === 'ONE' ? 'one.' : 'two.'));
	},
};