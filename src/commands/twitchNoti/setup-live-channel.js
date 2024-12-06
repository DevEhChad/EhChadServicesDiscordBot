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

            await interaction.deferReply({ ephmeral: true });

            const query = {
                guildId: interaction.guildId,
                channelId: targetChannel.id,
            };

            const channelExistInDb = await NowLiveSchema.exists(query);

            if (channelExistInDb) {
                interaction.followUp({ content: 'This channel has already been configured for live messages.', ephemeral: true });
                return;
            }

            const newNowLiveChannel = new NowLiveSchema({
                ...query,
                customMessage,
            });

            newNowLiveChannel
                .save()
                .then(() => {
                    if (customMessage) {
                        interaction.followUp({
                            content: `Configured ${targetChannel} to receive live message with a custom message: "**${customMessage}**"`,
                            ephemeral: true
                        });
                    } else {
                        interaction.followUp({
                            content: `Configured ${targetChannel} to recieve live messages with the default message.`,
                            ephemeral: true
                        })
                    }
                })
                .catch((error) => {
                    interaction.followUp({ content: 'Database Error. Please try again in a moment.', ephemeral: true });
                    console.log(`DB error in ${__filename}:\n`, error);
                });
            return;

        } catch (error) {
            console.log('Error', error);
        }
        return;
    },

    //deleted: true,
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