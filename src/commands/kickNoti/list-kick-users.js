const { PermissionFlagsBits, EmbedBuilder, SlashCommandBuilder, MessageFlags } = require('discord.js');
const KickUserSchema = require('../../schemas/KickUser');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('list-kick-users')
    .setDescription('Lists all Kick users added for notify in the server.')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    // Query all Kick users associated with the guild
    const kickUsers = await KickUserSchema.find({ guildId: interaction.guildId });
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    if (kickUsers.length === 0) {
      await interaction.followUp({ content: "There are no Kick users configured for notifications yet.", flags: MessageFlags.Ephemeral });
      return;
    }

    // Collect all URLs with usernames and join them with newlines
    const description = kickUsers
      .map(user => `• ${user.kickUsername}: <https://kick.com/${user.kickUsername}>`)
      .join('\n');

    const embed = new EmbedBuilder()
      .setTitle('Kick Streamers Being Tracked')
      .setDescription(description)
      .setColor('#53FC18') // Kick green
      .setTimestamp();

    await interaction.followUp({ embeds: [embed], flags: MessageFlags.Ephemeral });
  },

  permissionsRequired: [PermissionFlagsBits.Administrator],
  botPermissions: [],
};
