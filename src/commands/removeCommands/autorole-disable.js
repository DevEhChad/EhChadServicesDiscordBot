const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } = require('discord.js');
const AutoRole = require('../../schemas/AutoRole');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('autorole-disable')
    .setDescription('Disable auto-role in this server.')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles),

  async execute(interaction) {
    try {
      await interaction.deferReply({ flags: MessageFlags.Ephemeral }); // Ephemeral added here

      if (!(await AutoRole.exists({ guildId: interaction.guild.id }))) {
        interaction.editReply({ content: 'Auto role has not been configured for this server. Use `/autorole-configure` to set it up.' }); // Ephemeral added here
        return;
      }

      await AutoRole.findOneAndDelete({ guildId: interaction.guild.id });
      interaction.editReply({ content: 'Auto role has been disabled for this server. Use `/autorole-configure` to set it up again.' }); // Ephemeral added here
    } catch (error) {
      console.log(`Error: `, error);
    }
  },
  permissionsRequired: [PermissionFlagsBits.ManageRoles],
  botPermissions: [PermissionFlagsBits.ManageRoles],
};
