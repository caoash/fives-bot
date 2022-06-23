const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('ping')
		.setDescription('Checks if the bot is up.'),
	async execute(interaction) {
        const delay = Math.abs(Date.now() - interaction.createdTimestamp);
        const pingEmbed = new MessageEmbed()
            .setColor('#0x6fffff')
            .setTitle('Eep!')
            .setDescription(
                'Response Time: ' + delay + 'ms'
            );
        await interaction.reply({embeds : [ pingEmbed ]});
	},
};