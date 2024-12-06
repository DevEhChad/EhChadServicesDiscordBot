const { ApplicationCommandOptionType, Client, Interaction, PermissionFlagsBits } = require('discord.js');
const TwitchUserSchema = require('../../schemas/TwitchUser');

module.exports = {

    /** 
      * 
      * @param {Client} client
      * @param {Interaction} interaction
    */

    callback: async (client, interaction) => {
        // Query all Twitch users associated with the guild
        const twitchUsers = await TwitchUserSchema.find();

        await interaction.deferReply({ ephemeral: true });

        if (twitchUsers.length === 0) {
            await interaction.followUp({ content: "No Twitch users found.", ephermal: true });
            return;
        }

        // Collect all URLs with usernames and join them with newlines
        const twitchInfo = twitchUsers.map(user => `\`${user.twitchId} :\` <https://www.twitch.tv/${user.twitchId}>`).join('\n\n');

        await interaction.followUp({ content: `**All Twitch Users Added In This Server:**\n\n${twitchInfo}`, ephermal: true });
    },

    //deleted: true
    name: 'list-twitch-users',
    description: 'Lists all Twitch user\'s added for notify in the server.',
    options: [],
    permissionsRequired: [PermissionFlagsBits.ManageChannels],
    botPermissions: [PermissionFlagsBits.ManageChannels],
};
