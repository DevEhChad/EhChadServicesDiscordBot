const { ApplicationCommandOptionType, Client, Interaction, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const NowLiveSchema = require('../../schemas/NowLiveChannel');

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

            await interaction.deferReply({ ephemeral: true });

            const query = {
                guildId: interaction.guildId,
                channelId: targetChannel.id,
            };

            const channelExistInDb = await NowLiveSchema.findOne(query);

            if (channelExistInDb) {
                interaction.followUp({ content: 'This channel has already been configured for live messages.', ephemeral: true });
                return;
            }

            const newNowLiveChannel = new NowLiveSchema({
                ...query,
                customMessage,
            });

            await newNowLiveChannel.save();

            if (customMessage) {
                interaction.followUp({
                    content: `Configured ${targetChannel} to receive live messages with a custom message: "**${customMessage}**"`,
                    ephemeral: true
                });
            } else {
                interaction.followUp({
                    content: `Configured ${targetChannel} to receive live messages with the default message.`,
                    ephemeral: true
                });
            }
        } catch (error) {
            console.log(`Error in ${__filename}:\n`, error);
            interaction.followUp({ content: 'An error occurred. Please try again.', ephemeral: true });
        }
    },

    name: 'setup-live-channel',
    description: 'Setup a channel to send the live messages to.',
    options: [
        {
            name: 'target-channel',
            description: 'The channel to get live messages in.',
            type: ApplicationCommandOptionType.Channel,
            required: true,
        },
        {
            name: 'custom-message',
            description: 'A custom notification message.',
            type: ApplicationCommandOptionType.String,
            required: false,
        },
    ],
    permissionsRequired: [PermissionFlagsBits.ManageChannels],
    botPermissions: [PermissionFlagsBits.ManageChannels],

};