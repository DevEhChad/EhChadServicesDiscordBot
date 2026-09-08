const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } = require('discord.js');
const YouTubeChannelSchema = require('../../schemas/YouTubeChannel');

module.exports = {

    data: new SlashCommandBuilder()
        .setName('remove-youtube-channel')
        .setDescription('Removes a YouTube channel from sending upload messages.')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
        .addChannelOption((option) =>
            option
                .setName('target-channel')
                .setDescription('The channel to remove upload messages in.')
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

            const youTubeChannelExistInDb = await YouTubeChannelSchema.exists(query);

            if (!youTubeChannelExistInDb) {
                interaction.followUp({ content: 'That channel has not been configured for YouTube upload messages.', flags: MessageFlags.Ephemeral });
                return;
            }

            YouTubeChannelSchema.findOneAndDelete(query)
                .then(() => {
                    interaction.followUp({ content: `Removed ${targetChannel} from receiving YouTube upload messages.`, flags: MessageFlags.Ephemeral });
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
    delted: true,
    permissionsRequired: [PermissionFlagsBits.ManageChannels],
    botPermissions: [PermissionFlagsBits.ManageChannels],

};
