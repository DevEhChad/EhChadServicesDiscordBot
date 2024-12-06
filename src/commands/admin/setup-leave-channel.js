const { ApplicationCommandOptionType, Client, Interaction, PermissionFlagsBits } = require('discord.js');
const leaveChannelSchema = require('../../schemas/LeaveChannel');

module.exports = {

    /** 
     * 
     * @param {Client} client
     * @param {Interaction} interaction
     */

    callback: async (client, interaction,) => {
        try {
            const targetChannel = interaction.options.getChannel('target-channel');
            const customMessage = interaction.options.getString('custom-message');

            await interaction.deferReply({ ephemeral: true }); // Corrected spelling of 'ephemeral'

            const query = {
                guildId: interaction.guildId,
                channelId: targetChannel.id,
            };

            const channelExistInDb = await leaveChannelSchema.exists(query);

            if (channelExistInDb) {
                interaction.followUp({ content: 'This channel has already been configured for leave messages.', ephemeral: true }); // Ephemeral added
                return;
            }

            const newLeaveChannel = new leaveChannelSchema({
                ...query,
                customMessage,
            });

            newLeaveChannel
                .save()
                .then(() => {
                    interaction.followUp({ content: `Configured ${targetChannel} to receive leave messages.`, ephemeral: true }); // Ephemeral added
                })
                .catch((error) => {
                    interaction.followUp({ content: 'Database Error. Please try again in a moment.', ephemeral: true }); // Ephemeral added
                    console.log(`DB error in ${__filename}:\n`, error); // Corrected error variable name
                });
            return;

        } catch (error) {
            console.log('Error', error);
        }
        return;
    },

    //deleted: true,
    name: 'setup-leave-channel',
    description: 'Setup a channel to send the leave messages to.',
    options: [
        {
            name: 'target-channel',
            description: 'The channel to get leave messages in.',
            type: ApplicationCommandOptionType.Channel,
            required: true
        },
        {
            name: 'custom-message',
            description: 'TEMPLATES:{mention-member} {username} {server-name} {user-tag} <@{user-tag}>, "The leave Message"',
            type: ApplicationCommandOptionType.String,
        },
    ],
    permissionsRequired: [PermissionFlagsBits.ManageChannels],
    botPermissions: [PermissionFlagsBits.ManageChannels],
};