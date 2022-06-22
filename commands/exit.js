const { SlashCommandBuilder } = require('@discordjs/builders');

const {
    unsignupPlayer, mapIDToPlayer
} = require('../utils/sheet_funcs');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('exit')
		.setDescription('Remove yourself from fives.'),
	async execute(interaction) {
        let user = mapIDToPlayer(interaction.user.id);
        if (user === null) {
            interaction.reply("You cannot remove yourself because you have not yet registered as a user. User /register to do so.");
        } else {
            let found = unsignupPlayer(user);
            if (!found) interaction.reply("You have not signed up for fives.");
            else interaction.reply("Successfully removed you from fives.");
        }
	},
};