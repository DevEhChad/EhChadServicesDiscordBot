const { Client, Interaction, PermissionFlagsBits } = require('discord.js');
const AutoRole = require('../../schemas/AutoRole');

module.exports = {
  /**
   *
   * @param {Client} client
   * @param {Interaction} interaction
   */
  callback: async (client, interaction) => {
    try {
      await interaction.deferReply({ ephemeral: true }); // Ephemeral added here

      if (!(await AutoRole.exists({ guildId: interaction.guild.id }))) {
        interaction.editReply({ content: 'Auto role has not been configured for this server. Use `/autorole-configure` to set it up.', ephemeral: true }); // Ephemeral added here
        return;
      }

      await AutoRole.findOneAndDelete({ guildId: interaction.guild.id });
      interaction.editReply({ content: 'Auto role has been disabled for this server. Use `/autorole-configure` to set it up again.', ephemeral: true }); // Ephemeral added here
    } catch (error) {
      console.log(`Error: `, error);
    }
  },
  name: 'autorole-disable',
  description: 'Disable auto-role in this server.',
  permissionsRequired: [PermissionFlagsBits.ManageRoles],
  botPermissions: [PermissionFlagsBits.ManageRoles],
};