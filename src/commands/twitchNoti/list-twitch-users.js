const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, MessageFlags } = require('discord.js');
const TwitchUserSchema = require('../../schemas/TwitchUser');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('list-twitch-users')
    .setDescription('Lists all Twitch users added for notify in the server.')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    // Query all Twitch users associated with the guild
    const twitchUsers = await TwitchUserSchema.find({ guildId: interaction.guildId });

    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    if (twitchUsers.length === 0) {
      await interaction.followUp({ content: "There are no Twitch users configured for notifications yet.", flags: MessageFlags.Ephemeral });
      return;
    }

    // Collect all URLs with usernames and join them with newlines
    const description = twitchUsers
      .map(user => `• ${user.twitchId}: <https://www.twitch.tv/${user.twitchId}>`)
      .join('\n');

    const embed = new EmbedBuilder()
      .setTitle('Twitch Streamers Being Tracked')
      .setDescription(description)
      .setColor('#6441A5') // Twitch purple
      .setTimestamp();

    await interaction.followUp({ embeds: [embed], flags: MessageFlags.Ephemeral });
  },

  permissionsRequired: [PermissionFlagsBits.Administrator],
  botPermissions: [],
};
