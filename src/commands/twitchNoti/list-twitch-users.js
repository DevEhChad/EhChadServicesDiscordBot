const { Client, Interaction, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const TwitchUserSchema = require('../../schemas/TwitchUser');

module.exports = {

    /** 
      * 
      * @param {Client} client
      * @param {Interaction} interaction
    */

    callback: async (client, interaction) => {
        // Query all Twitch users associated with the guild
        const twitchUsers = await TwitchUserSchema.find({ guildId: interaction.guildId });

        await interaction.deferReply({ ephemeral: true });

        if (twitchUsers.length === 0) {
            await interaction.followUp({ content: "There are no Twitch users configured for notifications yet.", ephemeral: true });
            return;
        }

        // Collect all URLs with usernames and join them with newlines
        const description = twitchUsers
            .map(user => `• ${user.twitchId}: <https://www.twitch.tv/${user.twitchId}>`)
            .join('\n');

        const embed = new EmbedBuilder()
            .setTitle('Twitch Streamers Being Tracked')
            .setDescription(description)
            .setColor('#6441A5') // Twitch purple
            .setTimestamp();

        await interaction.followUp({ embeds: [embed], ephemeral: true });
    },


    name: 'list-twitch-users',
    description: 'Lists all Twitch users added for notify in the server.',
    options: [],
    permissionsRequired: [PermissionFlagsBits.Administrator],
    botPermissions: [],
};
