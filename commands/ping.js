const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('ping')
		.setDescription('Checks if Bot is up.'),
	async execute(interaction) {
        const delay = Math.abs(Date.now() - interaction.createdTimestamp);
		await interaction.reply(delay + ' ms. Eep!');
	},
};