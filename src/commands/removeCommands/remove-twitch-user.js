const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } = require('discord.js');

const TwitchUserSchema = require('../../schemas/TwitchUser');

module.exports = {

    data: new SlashCommandBuilder()
        .setName('remove-twitch-user')
        .setDescription('removes a twitch user from the twitch user list.')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addStringOption((option) =>
            option
                .setName('twitch-user')
                .setDescription('The user to remove.')
                .setRequired(true)
        ),

    async execute(interaction) {
        try {
            const twitchUsername = interaction.options.getString('twitch-user').toLowerCase();

            await interaction.deferReply({ flags: MessageFlags.Ephemeral });

            const result = await TwitchUserSchema.deleteOne({
                guildId: interaction.guildId,
                twitchId: twitchUsername,
            });

            if (result.deletedCount === 0) {
                interaction.followUp({
                    content: `User "${twitchUsername}" was not found in the notification list.`,
                    flags: MessageFlags.Ephemeral
                });
                return;
            }

            interaction.followUp({
                content: `Successfully removed "${twitchUsername}" from the Twitch notification list.`,
                flags: MessageFlags.Ephemeral
            });
        } catch (error) {
            console.log(`Error in ${__filename}:\n`, error);
            interaction.followUp({ content: 'An error occurred. Please try again.', flags: MessageFlags.Ephemeral });
        }
    },

    permissionsRequired: [PermissionFlagsBits.Administrator],
    botPermissions: [PermissionFlagsBits.ManageChannels],

};
