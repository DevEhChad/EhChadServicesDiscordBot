const { ApplicationCommandOptionType, Client, Interaction, PermissionFlagsBits } = require('discord.js');
const leaveChannelSchema = require('../../schemas/LeaveChannel');

module.exports = {

    /** 
     * 
     * @param {Client} client
     * @param {Interaction} interaction
     */

    callback: async (client, interaction,) => {

        await interaction.deferReply({ ephemeral: true });

        try {
            const targetChannel = interaction.options.getChannel('target-channel');
            const customMessage = interaction.options.getString('custom-message') ?? null;

            if (!targetChannel) {
                await interaction.followUp({ content: 'Please provide a valid channel.', ephemeral: true });
                return;
            }

            // Ensure channel is a text-based channel we can send messages to
            if (typeof targetChannel.isTextBased === 'function' && !targetChannel.isTextBased()) {
                await interaction.followUp({ content: 'The selected channel is not a text channel.', ephemeral: true });
                return;
            }

            // Check bot permissions in the target channel
            const me = interaction.guild?.members?.me || (await interaction.guild.members.fetchMe?.());
            const botPerms = targetChannel.permissionsFor(me);
            if (!botPerms || !botPerms.has(['ViewChannel', 'SendMessages'])) {
                await interaction.followUp({ content: 'I do not have permission to send messages in that channel. Please adjust permissions and try again.', ephemeral: true });
                return;
            }

            const query = {
                guildId: interaction.guildId,
                channelId: targetChannel.id,
            };

            // Upsert the leave channel atomically to avoid duplicate-key races
            const update = { customMessage };
            const opts = { upsert: true, new: true, setDefaultsOnInsert: true };

            await leaveChannelSchema.findOneAndUpdate(query, update, opts);

            await interaction.followUp({ content: `Configured ${targetChannel} to receive leave messages.`, ephemeral: true });
            return;

        } catch (error) {
            console.log(`Error in ${__filename}:`, error);
            try {
                await interaction.followUp({ content: 'An unexpected error occurred. Please try again later.', ephemeral: true });
            } catch (e) {
                // ignore follow-up errors
            }
            return;
        }
    },

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