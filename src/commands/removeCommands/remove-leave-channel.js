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

            await interaction.deferReply({ ephemeral: true });

            const query = {
                guildId: interaction.guildId,
                channelId: targetChannel.id,
            };

            const channelExistInDb = await leaveChannelSchema.exists(query);

            if (!channelExistInDb) {
                interaction.followUp({ content: 'That channel has not been configured for leave messages.', ephemeral: true }); // Ephemeral added
                return;
            }

            leaveChannelSchema.findOneAndDelete(query)
                .then(() => {
                    interaction.followUp({ content: `Removed ${targetChannel} from receiving leave messages.`, ephemeral: true }); // Ephemeral added
                })
                .catch((error) => {
                    interaction.followUp({ content: 'Database error. Please try again in a moment.', ephemeral: true }); // Ephemeral added
                    console.log(`DB error in ${__filename}:\n`, error);
                })
            return;
        } catch (error) {
            console.log(`Error in ${__filename}:\n`, error);
        }
        return;
    },
    //deleted: true,
    name: 'remove-leave-channel',
    description: 'removes a leave channel from sending leave messages.',
    options: [
        {
            name: 'target-channel',
            description: 'The channel to remove leave messages in.',
            type: ApplicationCommandOptionType.Channel,
            required: true,
        }
    ],
    permissionsRequired: [PermissionFlagsBits.ManageChannels],
    botPermissions: [PermissionFlagsBits.ManageChannels],

};