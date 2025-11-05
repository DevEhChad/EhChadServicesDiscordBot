const { SlashCommandBuilder } = require('@discordjs/builders');
const { PermissionFlagsBits } = require('discord.js');
const KickUserSchema = require('../../schemas/KickUser');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('add-kick-user')
    .setDescription('Add a Kick user to receive live notifications')
    .addStringOption((opt) => opt.setName('kick_username').setDescription('Kick username (e.g., xqc)').setRequired(true))
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

      const query = { guildId: interaction.guild.id, kickUsername };
  const exists = await KickUserSchema.findOne(query);
  if (exists) return interaction.editReply({ content: 'User `'+kickUsername+'` is already being tracked in this server.', ephemeral: true });

  await KickUserSchema.create(query);
  return interaction.editReply({ content: 'Added `'+kickUsername+'` to Kick notifications for this server.' });
    } catch (err) {
      console.error('[Kick] add-kick-user error:', err);
      return interaction.editReply({ content: 'An error occurred while adding the Kick user. Check logs.' });
    }
  },
};