const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed } = require('discord.js');
const { EMOTE_LIST, EMBED_COLOR } = require('../utils/config');

const {
    getPlayerList
} = require('../utils/sheet_funcs');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('players')
		.setDescription('List currently participating players and their roles.'),
	async execute(interaction) {
        let playerList = getPlayerList();
        const playersEmbed = new MessageEmbed()
            .setColor(EMBED_COLOR)
            .setTitle('Fives Queuers')
            .setDescription(
                'To sign up, type `/signup.` To remove yourself, type `/exit`.'
            );
        let playerCount = 0;
        playerList.forEach((value, key) => {
            ++playerCount;
            let roleString = playerCount + ". " + key;
            if (value[0] === null) {
                throw new Error("Primary role is NULL.");
            }
            roleString += (" " + EMOTE_LIST[value[0]]);
            if (value[1] !== null) roleString += (" " + EMOTE_LIST[value[1]]);
            if (playerCount > 10) roleString += ' (SUB) ';
            playersEmbed.addField(roleString, "\u200b", false);
        })
        playersEmbed.setFooter({text : '(' + playerCount + '/10)'});
        interaction.reply({ embeds : [ playersEmbed ] });
	},
};