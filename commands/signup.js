const { SlashCommandBuilder } = require('@discordjs/builders');

const {
    signupPlayer, mapIDToPlayer, checkRegistration
} = require('../utils/sheet_funcs');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('signup')
		.setDescription('Sign up for fives.')
        .addStringOption(option => 
            option
                .setName('primary_role')
                .setDescription('The first role you\'re signing up for.')
                .setRequired(true)
                .addChoices(
                    { name: 'Top', value: 'TOP' },
                    { name: 'Jungle', value: 'JUNGLE' },
                    { name: 'Mid', value: 'MID' },
                    { name: 'ADC', value: 'ADC' },
                    { name: 'Support', value: 'SUPPORT' },
                )
        )
        .addStringOption(option => 
            option
                .setName('secondary_role')
                .setDescription('The second role you\'re signing up for.')
                .setRequired(false)
                .addChoices(
                    { name: 'Top', value: 'TOP' },
                    { name: 'Jungle', value: 'JUNGLE' },
                    { name: 'Mid', value: 'MID' },
                    { name: 'ADC', value: 'ADC' },
                    { name: 'Support', value: 'SUPPORT' },
                )
        ),
	async execute(interaction) {
        let firstRole = interaction.options.getString('primary_role');
        let secondRole = interaction.options.getString('secondary_role');
        if (firstRole === secondRole) {
            interaction.reply("You cannot have the same first and secondary role.");
        } else {
            let user = mapIDToPlayer(interaction.user.id);
            if (user === null) {
                interaction.reply("You have not registered as a user yet. Use /register to do so.");
            } else {
                let registered = checkRegistration(user);
                if (registered) {
                    interaction.reply("You've already signed up for fives. If you want to change your roles, do /exit and then sign up again.");
                } else {
                    await signupPlayer(user, firstRole, secondRole);
                    interaction.reply("Successfully signed up " + user + " for fives. Use /exit to remove yourself.");
                }
            }
        }
	},
};