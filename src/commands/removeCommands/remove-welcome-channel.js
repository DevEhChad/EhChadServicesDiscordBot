const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } = require('discord.js');
const welcomeChannelSchema = require('../../schemas/WelcomeChannel');

module.exports = {

    data: new SlashCommandBuilder()
        .setName('remove-welcome-channel')
        .setDescription('removes a welcome channel from sending welcome messages.')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
        .addChannelOption((option) =>
            option
                .setName('target-channel')
                .setDescription('The channel to get remove welcome messages in.')
                .setRequired(true)
        ),

    async execute(interaction) {
        try {
            const targetChannel = interaction.options.getChannel('target-channel');

            await interaction.deferReply({ flags: MessageFlags.Ephemeral });

            const query = {
                guildId: interaction.guildId,
                channelId: targetChannel.id,
            };

            const channelExistInDb = await welcomeChannelSchema.exists(query);

            if (!channelExistInDb) {
                interaction.followUp({ content: 'That channel has not been configured for welcome messages.', flags: MessageFlags.Ephemeral });
                return;
            }

            welcomeChannelSchema.findOneAndDelete(query)
                .then(() => {
                    interaction.followUp({ content: `Removed ${targetChannel} from receiving welcome messages.`, flags: MessageFlags.Ephemeral });
                })
                .catch((error) => {
                    interaction.followUp({ content: 'Database error. Please try again in a moment.', flags: MessageFlags.Ephemeral });
                    console.log(`DB error in ${__filename}:\n`, error);
                })
            return;
        } catch (error) {
            console.log(`Error in ${__filename}:\n`, error);
        }
        return;
    },
    permissionsRequired: [PermissionFlagsBits.ManageChannels],
    botPermissions: [PermissionFlagsBits.ManageChannels],

};
