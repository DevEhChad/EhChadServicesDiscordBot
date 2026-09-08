const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } = require('discord.js');
const NowLiveRoleSchema = require('../../schemas/NowLiveRole');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('remove-nowlive-role')
        .setDescription('Removes the configured Now Live role for this server.')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        try {
            const guildId = interaction.guild.id;

            const existingRole = await NowLiveRoleSchema.findOne({ guildId });

            if (!existingRole) {
                interaction.reply({ content: 'No Now Live role has been set for this server.', flags: MessageFlags.Ephemeral });
                return; // Important: Stop execution if no role is found
            }

            await NowLiveRoleSchema.deleteOne({ guildId }); // Directly delete the document

            interaction.reply({ content: 'Now Live role has been removed.', flags: MessageFlags.Ephemeral });
        } catch (error) {
            console.log('Error removing Now Live role:', error);
            interaction.reply({ content: 'There was an error removing the Now Live role.', flags: MessageFlags.Ephemeral });
        }
    },
    permissionsRequired: [PermissionFlagsBits.Administrator],
};
