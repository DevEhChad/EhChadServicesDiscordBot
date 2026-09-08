const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } = require('discord.js');
const NowLiveRoleSchema = require('../../schemas/NowLiveRole');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('toggle-nowlive-role')
        .setDescription('Enable, disable, or check the status of the Now Live role without removing it.')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addStringOption((opt) =>
            opt
                .setName('action')
                .setDescription('What to do with the Now Live role.')
                .setRequired(true)
                .addChoices(
                    { name: 'Enable', value: 'enable' },
                    { name: 'Disable', value: 'disable' },
                    { name: 'Status', value: 'status' },
                )
        ),

    async execute(interaction) {
        try {
            await interaction.deferReply({ flags: MessageFlags.Ephemeral });

            const action = interaction.options.getString('action');
            const guildId = interaction.guild.id;

            const roleData = await NowLiveRoleSchema.findOne({ guildId });

            if (!roleData) {
                return interaction.followUp({
                    content: 'No Now Live role has been configured yet. Use `/add-nowlive-role` first.',
                    flags: MessageFlags.Ephemeral,
                });
            }

            if (action === 'enable') {
                if (roleData.enabled) {
                    return interaction.followUp({ content: 'The Now Live role is already enabled.', flags: MessageFlags.Ephemeral });
                }
                roleData.enabled = true;
                await roleData.save();
                return interaction.followUp({
                    content: `✅ Now Live role enabled. Members will receive <@&${roleData.nowLiveRoleId}> when they go live.`,
                    flags: MessageFlags.Ephemeral,
                });
            }

            if (action === 'disable') {
                if (!roleData.enabled) {
                    return interaction.followUp({ content: 'The Now Live role is already disabled.', flags: MessageFlags.Ephemeral });
                }
                roleData.enabled = false;
                await roleData.save();
                return interaction.followUp({
                    content: `⏸️ Now Live role disabled. The role config is saved — use \`/toggle-nowlive-role enable\` to turn it back on.`,
                    flags: MessageFlags.Ephemeral,
                });
            }

            if (action === 'status') {
                const state = roleData.enabled ? '✅ Enabled' : '⏸️ Disabled';
                return interaction.followUp({
                    content: `**Now Live Role:** <@&${roleData.nowLiveRoleId}>\n**Status:** ${state}`,
                    flags: MessageFlags.Ephemeral,
                });
            }
        } catch (error) {
            console.error('[toggle-nowlive-role] Error:', error);
            interaction.followUp({ content: 'There was an error processing your request.', flags: MessageFlags.Ephemeral });
        }
    },

    permissionsRequired: [PermissionFlagsBits.Administrator],
    botPermissions: [PermissionFlagsBits.ManageRoles],
};
