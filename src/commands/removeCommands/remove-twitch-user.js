const {
    ApplicationCommandOptionType,
    Client,
    Interaction,
    PermissionFlagsBits
} = require('discord.js');

const TwitchUserSchema = require('../../schemas/TwitchUser');

module.exports = {

    /** 
     * 
     * @param {Client} client
     * @param {Interaction} interaction
     */

    callback: async (client, interaction,) => {
        try {
            const twitchUsername = interaction.options.getString('twitch-user').toLowerCase();

            await interaction.deferReply({ ephemeral: true });

            const result = await TwitchUserSchema.deleteOne({
                guildId: interaction.guildId,
                twitchId: twitchUsername,
            });

            if (result.deletedCount === 0) {
                interaction.followUp({
                    content: `User "${twitchUsername}" was not found in the notification list.`,
                    ephemeral: true
                });
                return;
            }

            interaction.followUp({
                content: `Successfully removed "${twitchUsername}" from the Twitch notification list.`,
                ephemeral: true
            });
        } catch (error) {
            console.log(`Error in ${__filename}:\n`, error);
            interaction.followUp({ content: 'An error occurred. Please try again.', ephemeral: true });
        }
    },

    name: 'remove-twitch-user',
    description: 'removes a twitch user from the twitch user list.',
    options: [
        {
            name: 'twitch-user',
            description: 'The user to remove.',
            type: ApplicationCommandOptionType.String,
            required: true,
        }
    ],
    permissionsRequired: [PermissionFlagsBits.Administrator],
    botPermissions: [PermissionFlagsBits.ManageChannels],

};