const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed } = require('discord.js');
const { APPROVED_LIST } = require('../utils/config');

const {
    updateWinner, clearSheet, gameOngoing, clearPlayers
} = require('../utils/sheet_funcs');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('reset')
		.setDescription('Clear cache of players and participants.'),
	async execute(interaction) {
        if (!APPROVED_LIST.includes(interaction.user.id)) {
            await interaction.reply("You are not approved to run this command. DM Mikey if you think this is a mistake.");
            return;
        }

        await interaction.deferReply();
        await clearPlayers();
        await clearSheet();
        await interaction.editReply("Cleared cache of players and participants.");
	},
};