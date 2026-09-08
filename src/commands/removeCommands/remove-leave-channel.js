const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } = require('discord.js');
const leaveChannelSchema = require('../../schemas/LeaveChannel');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('remove-leave-channel')
        .setDescription('removes a leave channel from sending leave messages.')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
        .addChannelOption((option) =>
            option
                .setName('target-channel')
                .setDescription('The channel to remove leave messages in.')
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

            const channelExistInDb = await leaveChannelSchema.exists(query);

            if (!channelExistInDb) {
                interaction.followUp({ content: 'That channel has not been configured for leave messages.', flags: MessageFlags.Ephemeral }); // Ephemeral added
                return;
            }

            leaveChannelSchema.findOneAndDelete(query)
                .then(() => {
                    interaction.followUp({ content: `Removed ${targetChannel} from receiving leave messages.`, flags: MessageFlags.Ephemeral }); // Ephemeral added
                })
                .catch((error) => {
                    interaction.followUp({ content: 'Database error. Please try again in a moment.', flags: MessageFlags.Ephemeral }); // Ephemeral added
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
