const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } = require('discord.js');
const welcomeChannelSchema = require('../../schemas/WelcomeChannel');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setup-welcome-channel')
        .setDescription('Setup a channel to send the welcome messages to.')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
        .addChannelOption((opt) =>
            opt
                .setName('target-channel')
                .setDescription('The channel to get welcome messages in.')
                .setRequired(true)
        )
        .addStringOption((opt) =>
            opt
                .setName('custom-message')
                .setDescription('TEMPLATES:{mention-member} {username} {server-name} {user-tag} <@{user-tag}>, "The Welcome Message"')
        ),

    //deleted: true,
    async execute(interaction) {

        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        try {
            const targetChannel = interaction.options.getChannel('target-channel');
            const customMessage = interaction.options.getString('custom-message') ?? null;

            if (!targetChannel) {
                await interaction.followUp({ content: 'Please provide a valid channel.', flags: MessageFlags.Ephemeral });
                return;
            }

            // Ensure channel is a text-based channel we can send messages to
            if (typeof targetChannel.isTextBased === 'function' && !targetChannel.isTextBased()) {
                await interaction.followUp({ content: 'The selected channel is not a text channel.', flags: MessageFlags.Ephemeral });
                return;
            }

            // Check bot permissions in the target channel
            const me = interaction.guild?.members?.me || (await interaction.guild.members.fetchMe?.());
            const botPerms = targetChannel.permissionsFor(me);
            if (!botPerms || !botPerms.has(['ViewChannel', 'SendMessages'])) {
                await interaction.followUp({ content: 'I do not have permission to send messages in that channel. Please adjust permissions and try again.', flags: MessageFlags.Ephemeral });
                return;
            }

            const query = {
                guildId: interaction.guildId,
                channelId: targetChannel.id,
            };

            // Upsert the welcome channel atomically to avoid duplicate-key races
            const update = { customMessage };
            const opts = { upsert: true, new: true, setDefaultsOnInsert: true };

            await welcomeChannelSchema.findOneAndUpdate(query, update, opts);

            await interaction.followUp({ content: `Configured ${targetChannel} to receive welcome messages.`, flags: MessageFlags.Ephemeral });
            return;

        } catch (error) {
            console.log(`Error in ${__filename}:`, error);
            try {
                await interaction.followUp({ content: 'An unexpected error occurred. Please try again later.', flags: MessageFlags.Ephemeral });
            } catch (e) {
                // ignore follow-up errors
            }
            return;
        }
    },

    permissionsRequired: [PermissionFlagsBits.ManageChannels],
    botPermissions: [PermissionFlagsBits.ManageChannels],

};
