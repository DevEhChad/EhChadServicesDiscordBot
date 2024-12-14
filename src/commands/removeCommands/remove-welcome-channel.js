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

            await interaction.deferReply({ ephemeral: true });

            const query = {
                guildId: interaction.guildId,
                channelId: targetChannel.id,
            };

            const channelExistInDb = await welcomeChannelSchema.exists(query);

            if (!channelExistInDb) {
                interaction.followUp({ content: 'That channel has not been configured for welcome messages.', ephemeral: true });
                return;
            }

            welcomeChannelSchema.findOneAndDelete(query)
                .then(() => {
                    interaction.followUp({ content: `Removed ${targetChannel} from receiving welcome messages.`, ephemeral: true });
                })
                .catch((error) => {
                    interaction.followUp({ content: 'Database error. Please try again in a moment.', ephemeral: true });
                    console.log(`DB error in ${__filename}:\n`, error);
                })
            return;
        } catch (error) {
            console.log(`Error in ${__filename}:\n`, error);
        }
        return;
    },
    name: 'remove-welcome-channel',
    description: 'removes a welcome channel from sending welcome messages.',
    options: [
        {
            name: 'target-channel',
            description: 'The channel to get remove welcome messages in.',
            type: ApplicationCommandOptionType.Channel,
            required: true,
        }
    ],
    permissionsRequired: [PermissionFlagsBits.ManageChannels],
    botPermissions: [PermissionFlagsBits.ManageChannels],

};