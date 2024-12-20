const { ApplicationCommandOptionType, Client, Interaction, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const YouTubeChannelSchema = require('../../schemas/YouTubeChannel');

module.exports = {

    /** 
      * 
      * @param {Client} client
      * @param {Interaction} interaction
    */
    deleted: true,
    name: 'setup-youtube-channel',
    description: 'Sets up a YouTube Upload noti channel',
    options: [
        {
            name: 'target-channel',
            description: 'The channel to get upload messages in.',
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

    callback: async (client, interaction,) => {
      
        try {
            const targetChannel = interaction.options.getChannel('target-channel');
            const customMessage = interaction.options.getString('custom-message');

            await interaction.deferReply({ ephmeral: true });

            const query = {
                guildId: interaction.guildId,
                channelId: targetChannel.id,
            };

            const youTubeChannelExistInDb = await YouTubeChannelSchema.exists(query);

            if (youTubeChannelExistInDb) {
                interaction.followUp({ content: 'This channel has already been configured for youtube upload messages.', ephemeral: true });
                return;
            }

            const newYouTubeChannel = new YouTubeChannelSchema({
                ...query,
                customMessage,
            });

            newYouTubeChannel
                .save()
                .then(() => {
                    if (customMessage) {
                        interaction.followUp({
                            content: `Configured ${targetChannel} to receive YouTube upload message with a custom message: "**${customMessage}**"`,
                            ephemeral: true
                        });
                    } else {
                        interaction.followUp({
                            content: `Configured ${targetChannel} to recieve YouTube upload messages with the default message.`,
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
    }

};