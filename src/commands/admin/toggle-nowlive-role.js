const { ApplicationCommandOptionType, Client, Interaction, PermissionFlagsBits } = require('discord.js');
const NowLiveRoleSchema = require('../../schemas/NowLiveRole');

module.exports = {
    /**
     * @param {Client} client
     * @param {Interaction} interaction
     */
    callback: async (client, interaction) => {
        try {
            await interaction.deferReply({ ephemeral: true });

            const action = interaction.options.getString('action');
            const guildId = interaction.guild.id;

            const roleData = await NowLiveRoleSchema.findOne({ guildId });

            if (!roleData) {
                return interaction.followUp({
                    content: 'No Now Live role has been configured yet. Use `/add-nowlive-role` first.',
                    ephemeral: true,
                });
            }

            if (action === 'enable') {
                if (roleData.enabled) {
                    return interaction.followUp({ content: 'The Now Live role is already enabled.', ephemeral: true });
                }
                roleData.enabled = true;
                await roleData.save();
                return interaction.followUp({
                    content: `✅ Now Live role enabled. Members will receive <@&${roleData.nowLiveRoleId}> when they go live.`,
                    ephemeral: true,
                });
            }

            if (action === 'disable') {
                if (!roleData.enabled) {
                    return interaction.followUp({ content: 'The Now Live role is already disabled.', ephemeral: true });
                }
                roleData.enabled = false;
                await roleData.save();
                return interaction.followUp({
                    content: `⏸️ Now Live role disabled. The role config is saved — use \`/toggle-nowlive-role enable\` to turn it back on.`,
                    ephemeral: true,
                });
            }

            if (action === 'status') {
                const state = roleData.enabled ? '✅ Enabled' : '⏸️ Disabled';
                return interaction.followUp({
                    content: `**Now Live Role:** <@&${roleData.nowLiveRoleId}>\n**Status:** ${state}`,
                    ephemeral: true,
                });
            }
        } catch (error) {
            console.error('[toggle-nowlive-role] Error:', error);
            interaction.followUp({ content: 'There was an error processing your request.', ephemeral: true });
        }
    },

    name: 'toggle-nowlive-role',
    description: 'Enable, disable, or check the status of the Now Live role without removing it.',
    options: [
        {
            name: 'action',
            description: 'What to do with the Now Live role.',
            type: ApplicationCommandOptionType.String,
            required: true,
            choices: [
                { name: 'Enable', value: 'enable' },
                { name: 'Disable', value: 'disable' },
                { name: 'Status', value: 'status' },
            ],
        },
    ],
    permissionsRequired: [PermissionFlagsBits.Administrator],
    botPermissions: [PermissionFlagsBits.ManageRoles],
};
