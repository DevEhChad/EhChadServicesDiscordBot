const { ApplicationCommandOptionType, Client, Interaction, PermissionFlagsBits } = require('discord.js');
const AutoRole = require('../../schemas/AutoRole');

module.exports = {
  /**
   *
   * @param {Client} client
   * @param {Interaction} interaction
   */
  callback: async (client, interaction) => {
    if (!interaction.inGuild()) {
      interaction.reply({ content: 'You can only run this command inside a server.', ephemeral: true }); // Ephemeral added
      return;
    }

    const targetRoleId = interaction.options.get('role').value;

    try {
      await interaction.deferReply({ ephemeral: true }); // Ephemeral added

      let autoRole = await AutoRole.findOne({ guildId: interaction.guild.id });

      if (autoRole) {
        if (autoRole.roleId === targetRoleId) {
          interaction.editReply({ content: 'Auto role has already been configured for that role. To disable run `/autorole-disable`', ephemeral: true }); // Ephemeral added
          return;
        }

        autoRole.roleId = targetRoleId;
      } else {
        autoRole = new AutoRole({
          guildId: interaction.guild.id,
          roleId: targetRoleId,
        });
      }

      await autoRole.save();
      interaction.editReply({ content: 'Autorole has now been configured. To disable run `/autorole-disable`', ephemeral: true }); // Ephemeral added
    } catch (error) {
      console.log(error);
    }
  },
  name: 'autorole-configure',
  description: 'Configure your auto-role for this server.',
  options: [
    {
      name: 'role',
      description: 'The role you want users to get on join.',
      type: ApplicationCommandOptionType.Role,
      required: true,
    },
  ],
  permissionsRequired: [PermissionFlagsBits.ManageRoles],
  botPermissions: [PermissionFlagsBits.ManageRoles],
};