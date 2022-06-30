const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed } = require('discord.js');

const { EMBED_COLOR } = require('../utils/config.json');

const {
    initSheet
} = require('../utils/sheet_funcs');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('refresh')
		.setDescription('Refreshes the bot, updating profile and other information.'),
	async execute(interaction) {
        await interaction.deferReply();
        await initSheet();
        const delay = Math.abs(Date.now() - interaction.createdTimestamp);
        const refreshEmbed = new MessageEmbed()
            .setColor(EMBED_COLOR)
            .setTitle('Eep!')
            .setDescription(
                'Refreshed in: ' + delay + 'ms'
            );
        await interaction.editReply( {embeds : [ refreshEmbed ]} );
	},
};