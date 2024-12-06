const { ApplicationCommandOptionType, Client, Interaction, PermissionFlagsBits } = require('discord.js');
const welcomeChannelSchema = require('../../schemas/WelcomeChannel');

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

            const channelExistInDb = await welcomeChannelSchema.exists(query);

            if (channelExistInDb) {
                interaction.followUp({ content: 'This channel has already been configured for welcome messages.', ephemeral: true }); // Ephemeral added
                return;
            }

            const newWelcomeChannel = new welcomeChannelSchema({
                ...query,
                customMessage,
            });

            newWelcomeChannel
                .save()
                .then(() => {
                    interaction.followUp({ content: `Configured ${targetChannel} to receive welcome messages.`, ephemeral: true }); // Ephemeral added
                })
                .catch((error) => {
                    interaction.followUp({ content: 'Database Error. Please try again in a moment.', ephemeral: true }); // Ephemeral added
                    console.log(`DB error in ${__filename}:\n`, error);
                });
            return;

        } catch (error) {
            console.log('Error', error);
        }
        return;
    },

    //deleted: true,
    name: 'setup-welcome-channel',
    description: 'Setup a channel to send the welcome messages to.',
    options: [
        {
            name: 'target-channel',
            description: 'The channel to get welcome messages in.',
            type: ApplicationCommandOptionType.Channel,
            required: true
        },
        {
            name: 'custom-message',
            description: 'TEMPLATES:{mention-member} {username} {server-name} {user-tag} <@{user-tag}>, "The Welcome Message"',
            type: ApplicationCommandOptionType.String,
        },
    ],
    permissionsRequired: [PermissionFlagsBits.ManageChannels],
    botPermissions: [PermissionFlagsBits.ManageChannels],

};