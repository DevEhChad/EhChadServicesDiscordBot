const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } = require('discord.js');
const TwitchUserSchema = require('../../schemas/TwitchUser');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('add-twitch-user')
    .setDescription('Add Twitch User to get live notifications from.')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addStringOption(opt =>
      opt.setName('twitch-user')
        .setDescription('Add a Twitch User by username. **Not a link**')
        .setRequired(true)),

  async execute(interaction) {
    try {
      const twitchUsername = interaction.options.getString('twitch-user').toLowerCase();

      await interaction.deferReply({ flags: MessageFlags.Ephemeral });

      const query = {
        guildId: interaction.guildId,
        twitchId: twitchUsername,
      };

      const twitchUserExists = await TwitchUserSchema.findOne(query);

      if (twitchUserExists) {
        interaction.followUp({
          content: `User "${twitchUsername}" has already been added for this server.`,
          flags: MessageFlags.Ephemeral,
        });
        return;
      }

      const newTwitchUser = new TwitchUserSchema(query);
      await newTwitchUser.save();

      interaction.followUp({
        content: `Successfully added "${twitchUsername}" to the Twitch notification list.`,
        flags: MessageFlags.Ephemeral,
      });
    } catch (error) {
      console.log(`Error in ${__filename}:\n`, error);
      interaction.followUp({
        content: 'A database error occurred. Please try again.',
        flags: MessageFlags.Ephemeral,
      });
    }
  },

  permissionsRequired: [PermissionFlagsBits.Administrator],
  botPermissions: [PermissionFlagsBits.ManageRoles],
};
