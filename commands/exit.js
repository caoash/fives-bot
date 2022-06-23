const { SlashCommandBuilder } = require('@discordjs/builders');

const {
    unsignupPlayer, mapIDToPlayer, gameOngoing
} = require('../utils/sheet_funcs');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('exit')
		.setDescription('Remove yourself from fives.'),
	async execute(interaction) {
        let user = mapIDToPlayer(interaction.user.id);
        if (gameOngoing()) {
            interaction.reply("You cannot exit. There is an ongoing game. If it has finished, do `/update {winningTeam}` to update the logs.");
            return;
        }
        if (user === null) {
            interaction.reply("You cannot remove yourself because you have not yet registered as a user. Use `/register` to do so.");
        } else {
            let found = unsignupPlayer(user);
            if (!found) interaction.reply("You have not signed up for fives.");
            else interaction.reply("Successfully removed you from fives.");
        }
	},
};