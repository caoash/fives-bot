const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed } = require('discord.js');

const { EMBED_COLOR } = require('../utils/config.json');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('ping')
		.setDescription('Checks if the bot is up.'),
	async execute(interaction) {
        const delay = Math.abs(Date.now() - interaction.createdTimestamp);
        const pingEmbed = new MessageEmbed()
            .setColor(EMBED_COLOR)
            .setTitle('Eep!')
            .setDescription(
                'Response Time: ' + delay + 'ms'
            );
        await interaction.reply({embeds : [ pingEmbed ]});
	},
};