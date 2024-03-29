const { SlashCommandBuilder } = require('@discordjs/builders');

const {
    mapIDToPlayer, addNewPlayer
} = require('../utils/sheet_funcs');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('register')
		.setDescription('Register a new user.')
        .addStringOption(option => 
            option
                .setName('name')
                .setDescription('The new user\'s name.')
                .setRequired(true)
        ),
	async execute(interaction) {
        let existingUser = mapIDToPlayer(interaction.user.id);
        if (existingUser !== null) {
            await interaction.reply("You're already registered to: " + existingUser + ".");
        } else {
            let registerName = interaction.options.getString('name');
            await interaction.deferReply();
            await addNewPlayer(registerName, interaction.user.id);
            await interaction.editReply("Successfully registered " + interaction.user.username + " as " + registerName + '.');
        }
	},
};