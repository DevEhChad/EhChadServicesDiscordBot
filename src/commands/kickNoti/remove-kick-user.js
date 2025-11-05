const { SlashCommandBuilder } = require('@discordjs/builders');
const { PermissionFlagsBits } = require('discord.js');
const KickUserSchema = require('../../schemas/KickUser');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('remove-kick-user')
    .setDescription('Remove a Kick user from live notifications')
    .addStringOption((opt) => opt.setName('kick_username').setDescription('Kick username to remove').setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });
    try {
      if (!interaction.guild) return interaction.editReply({ content: 'This command must be used in a server.' });
      const raw = interaction.options.getString('kick_username');
      if (!raw) return interaction.editReply({ content: 'Please provide a Kick username.' });

      const kickUsername = raw.trim().toLowerCase();
      if (!/^[a-z0-9_\-]{2,32}$/.test(kickUsername)) {
        return interaction.editReply({ content: 'That does not look like a valid Kick username.' });
      }

      const result = await KickUserSchema.deleteOne({ guildId: interaction.guild.id, kickUsername });
      if (!result.deletedCount) return interaction.editReply({ content: 'User `'+kickUsername+'` was not found in this server\'s tracked list.' });

      return interaction.editReply({ content: 'Removed `'+kickUsername+'` from Kick notifications for this server.' });
    } catch (err) {
      console.error('[Kick] remove-kick-user error:', err);
      return interaction.editReply({ content: 'An error occurred while removing the Kick user. Check logs.' });
    }
  },
};