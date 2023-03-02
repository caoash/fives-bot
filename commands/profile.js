const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed } = require('discord.js');

const { EMBED_COLOR } = require('../utils/config.json');

const {
    getStatsOfPlayerById
} = require('../utils/sheet_funcs');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('profile')
		.setDescription('Get your profile.')
        .addUserOption(option =>
            option
                .setName('user')
                .setDescription('User you want to get the profile of. Defaults to self.')
        ),
	async execute(interaction) {

        let chosenUser = interaction.options.getUser('user');
        if (chosenUser === null) {
            chosenUser = interaction.user;
        }

        let statsList = getStatsOfPlayerById(chosenUser.id); // [wins, losses, elo, winrate]

        for (let i = 0; i < 4; ++i) {
            if (statsList[i] === null) {
                await interaction.reply("User does not have a profile. Use `/register` to create one.");
                return;
            }
        }

        const statsEmbed = new MessageEmbed()
            .setColor(EMBED_COLOR)
            .setTitle('Profile for ' + chosenUser.username)
            .setDescription("")
            .setThumbnail(chosenUser.avatarURL())
            .addFields(
                { name: 'Wins', value: statsList[0].toString(), inline: true },
                { name: 'Losses', value: statsList[1].toString(), inline: true },
                { name: 'Winrate %', value: statsList[3].toString(), inline: true },
                { name: 'ELO', value: statsList[2].toString(), inline: false },
            )

        await interaction.reply({embeds : [ statsEmbed ]});
	},
};