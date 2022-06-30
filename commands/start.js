const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageActionRow, MessageButton, MessageEmbed } = require('discord.js');
const { EMOTE_LIST, TEAM_SIZE, EMBED_COLOR } = require('../utils/config');

const {
    getPlayerList, updateTeams, mapPlayerToID, addReadyUser, removeReadyUser, getReady, isReady
} = require('../utils/sheet_funcs');

const {
    makeTeams, 
} = require('../utils/lib_funcs');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('start')
		.setDescription('Make teams and start fives.')
        .addStringOption(option => 
            option
                .setName('setting')
                .setDescription('The setting used to make teams.')
                .setRequired(true)
                .addChoices(
                    { name: 'Random', value: 'RANDOM' },
                    // { name: 'Custom', value: 'CUSTOM' },
                )
        ),
        // .addStringOption(option => 
        //     option
        //         .setName('teams')
        //         .setDescription('A binary number in order of playerList representing teams.')
        //         .setRequired(false)
        // ),
	async execute(interaction) {
        let curSetting = interaction.options.getString('setting');
        // let teamSetting = interaction.options.getString('teams');
        // if (teamSetting !== null && curSetting !== 'CUSTOM') {
        //     await interaction.reply('You cannot specify teams if you didn\'t select the custom setting.');
        // }

        const teamsEmbed = new MessageEmbed()
            .setColor(EMBED_COLOR)
            .setTitle('Fives Teams')
            .setDescription(
                'Teams were made using the setting: ' + curSetting + "."
            )
            .setFooter({text: "READY: " + "(" + getReady() + "/" + (2 * TEAM_SIZE) + ")"})

        let curList = getPlayerList();

        // console.log(teamSetting);

        if (curList.size < TEAM_SIZE) {
            await interaction.reply("There are not " + TEAM_SIZE + " players signed up.");
            return;
        }

        // // binary string to integer
        // let binNumber = 0;
        // let cur = 1;
        // for (let i = 0; i < 2 * TEAM_SIZE; ++i) {
        //     if (teamSetting.charAt(2 * TEAM_SIZE - i - 1) == '1') binNumber += cur; 
        //     cur *= 2;
        // }

        let curTeams = makeTeams(curList, curSetting);

        if (curTeams === null) {
            await interaction.reply("It's impossible to make teams. Please do `/exit` and re-signup with a more diverse roles.");
            return;
        }

        await updateTeams(curTeams);

        let teamIds = [];
        
        for (let i = 0; i < TEAM_SIZE; i++) {
            let firstID = mapPlayerToID(curTeams[i][0]);
            let secID = mapPlayerToID(curTeams[i][1]);
            teamIds.push(firstID);
            teamIds.push(secID);
            teamsEmbed.addFields(
                { name: curTeams[i][0] + " " + EMOTE_LIST[i], value: (isReady(firstID) ? "READY" : "NOT READY"), inline: true },
                { name: curTeams[i][1] + " " + EMOTE_LIST[i], value: (isReady(secID) ? "READY" : "NOT READY"), inline: true },
            )
            if (i != TEAM_SIZE - 1) teamsEmbed.addField("\u200b", "\u200b", false);
        }

        const rButton = new MessageButton() // ready
            .setCustomId('ready')
            .setLabel('Ready')
            .setStyle('SUCCESS')

        const uButton = new MessageButton() // unready
            .setCustomId('unready')
            .setLabel('Cancel')
            .setStyle('DANGER')

        const readyButton = new MessageActionRow()
			.addComponents(
				rButton,
                uButton
			);

        /* 
            TODO: TRACK HOW MANY USERS HAVE READIED UP, AND WHEN 10, START:
            POST DRAFT LINKS + MOVE PEOPLE INTO VC
        */

        await interaction.reply({ components : [ readyButton ], embeds : [ teamsEmbed ] });

        const collector = interaction.channel.createMessageComponentCollector();
        // console.log(teamIds);
        collector.on('collect', async (interaction) => {
            if (!teamIds.includes(interaction.user.id)) return;
            // console.log("COLLECTED");
            const newTeamsEmbed = new MessageEmbed()
            .setColor(EMBED_COLOR)
            .setTitle('Fives Teams')
            .setDescription(
                'Teams were made using the setting: ' + curSetting + "."
            )
            .setFooter({text: "READY: " + "(" + getReady() + "/" + (2 * TEAM_SIZE) + ")"})
            const upd = async () => {
                for (let i = 0; i < TEAM_SIZE; i++) {
                    let firstID = mapPlayerToID(curTeams[i][0]);
                    let secID = mapPlayerToID(curTeams[i][1]);
                    // console.log(isReady(firstID) + " " + isReady(secID));
                    newTeamsEmbed.addFields(
                        { name: curTeams[i][0] + " " + EMOTE_LIST[i], value: (isReady(firstID) ? "READY" : "NOT READY"), inline: true },
                        { name: curTeams[i][1] + " " + EMOTE_LIST[i], value: (isReady(secID) ? "READY" : "NOT READY"), inline: true },
                    )
    
                    if (i != TEAM_SIZE - 1) newTeamsEmbed.addField("\u200b", "\u200b", false);
                }
                newTeamsEmbed.setFooter({text: "READY: " + "(" + getReady() + "/" + (2 * TEAM_SIZE) + ")"});
                await interaction.update({ components : [ readyButton ], embeds : [ newTeamsEmbed ] });
            };
            if (interaction.customId === 'ready') {
                if (isReady(interaction.user.id)) {
                    await interaction.reply({ content: "You've already readied up.", ephemeral: true });
                } else {
                    await addReadyUser(interaction.user.id);
                    await upd();
                }
            } else if (interaction.customId === 'unready') {
                if (!isReady(interaction.user.id)) {
                    await interaction.reply({ content: "You haven't readied up.", ephemeral: true });
                } else {
                    await removeReadyUser(interaction.user.id);
                    await upd();
                }
            }
        });
	},
};