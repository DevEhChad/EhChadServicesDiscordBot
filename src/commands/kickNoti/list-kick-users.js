const { Client, Interaction, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const KickUserSchema = require('../../schemas/KickUser');

module.exports = {
  /**
   * @param {Client} client
   * @param {Interaction} interaction
   */
  callback: async (client, interaction) => {
    await interaction.deferReply({ ephemeral: true });

    const kickUsers = await KickUserSchema.find({ guildId: interaction.guildId });

    if (kickUsers.length === 0) {
      await interaction.followUp({ content: 'There are no Kick users configured for notifications yet.', ephemeral: true });
      return;
    }

    const description = kickUsers
      .map((user) => `• ${user.kickUsername}: <https://kick.com/${user.kickUsername}>`)
      .join('\n');

    const embed = new EmbedBuilder()
      .setTitle('Kick Streamers Being Tracked')
      .setDescription(description)
      .setColor('#53FC18') // Kick green
      .setTimestamp();

    await interaction.followUp({ embeds: [embed], ephemeral: true });
  },

  name: 'list-kick-users',
  description: 'Lists all Kick users being tracked for live notifications.',
  options: [],
  permissionsRequired: [PermissionFlagsBits.Administrator],
  botPermissions: [],
};