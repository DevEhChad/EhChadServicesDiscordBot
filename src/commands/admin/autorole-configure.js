const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } = require('discord.js');
const AutoRole = require('../../schemas/AutoRole');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('autorole-configure')
    .setDescription('Configure your auto-role for this server.')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
    .addRoleOption((opt) =>
      opt
        .setName('role')
        .setDescription('The role you want users to get on join.')
        .setRequired(true)
    ),

  async execute(interaction) {
    if (!interaction.inGuild()) {
      interaction.reply({ content: 'You can only run this command inside a server.', flags: MessageFlags.Ephemeral }); // Ephemeral added
      return;
    }

    const targetRoleId = interaction.options.get('role').value;

    try {
      await interaction.deferReply({ flags: MessageFlags.Ephemeral }); // Ephemeral added

      let autoRole = await AutoRole.findOne({ guildId: interaction.guild.id });

      if (autoRole) {
        if (autoRole.roleId === targetRoleId) {
          interaction.editReply({ content: 'Auto role has already been configured for that role. To disable run `/autorole-disable`' }); // Ephemeral added
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
      interaction.editReply({ content: 'Autorole has now been configured. To disable run `/autorole-disable`' }); // Ephemeral added
    } catch (error) {
      console.log(error);
    }
  },

  permissionsRequired: [PermissionFlagsBits.ManageRoles],
  botPermissions: [PermissionFlagsBits.ManageRoles],
};
