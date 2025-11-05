const { SlashCommandBuilder } = require('@discordjs/builders');
const { PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const KickUserSchema = require('../../schemas/KickUser');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('list-kick-users')
    .setDescription('List Kick users being tracked in this server')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });
    try {
      if (!interaction.guild) return interaction.editReply({ content: 'This command must be used in a server.' });
      const kickUsers = await KickUserSchema.find({ guildId: interaction.guild.id });
      if (!kickUsers || kickUsers.length === 0) return interaction.editReply({ content: 'There are no Kick users configured for notifications in this server.' });

      const description = kickUsers.map(u => `• ${u.kickUsername}: <https://kick.com/${u.kickUsername}>`).join('\n');
      const embed = new EmbedBuilder().setTitle('Kick Streamers Being Tracked').setDescription(description).setColor('#53FC18').setTimestamp();
      return interaction.editReply({ embeds: [embed] });
    } catch (err) {
      console.error('[Kick] list-kick-users error:', err);
      return interaction.editReply({ content: 'Failed to fetch Kick users. Check logs.' });
    }
  }
};