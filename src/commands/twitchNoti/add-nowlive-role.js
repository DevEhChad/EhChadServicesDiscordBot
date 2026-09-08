const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } = require('discord.js');
const NowLiveRoleSchema = require('../../schemas/NowLiveRole');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('add-nowlive-role')
    .setDescription('Set the role to be given when someone goes Live.')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addRoleOption(opt =>
      opt.setName('role')
        .setDescription('The role to be given to users who are live.')
        .setRequired(true)),

  async execute(interaction) {
    try {
      const role = interaction.options.getRole('role');
      const guildId = interaction.guild.id;

      // Check if a role already exists for this guild
      const existingRole = await NowLiveRoleSchema.findOne({ guildId });

      if (existingRole) {
        // Update the existing role
        existingRole.nowLiveRoleId = role.id;
        await existingRole.save();
        interaction.reply({ content: `Now Live role updated to ${role}`, flags: MessageFlags.Ephemeral });
      } else {
        // Create a new role entry
        const newRole = new NowLiveRoleSchema({
          guildId,
          nowLiveRoleId: role.id,
        });
        await newRole.save();
        interaction.reply({ content: `Now Live role set to ${role}`, flags: MessageFlags.Ephemeral });
      }
    } catch (error) {

      console.log('Error', error);
      interaction.reply({ content: 'There was an error processing your request.', flags: MessageFlags.Ephemeral });
    }

    return;
  },
  permissionsRequired: [PermissionFlagsBits.Administrator],
  botPermissions: [PermissionFlagsBits.ManageRoles],
};
