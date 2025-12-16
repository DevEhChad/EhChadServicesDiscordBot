const { ApplicationCommandOptionType, Client, Interaction, PermissionFlagsBits } = require('discord.js');
const KickNowLiveChannel = require('../../schemas/KickNowLiveChannel');

/*module.exports = {
  data: new SlashCommandBuilder()
    .setName('setup-kick-channel')
    .setDescription('Bind the current channel as the Kick notifications channel for this server')
    .addStringOption(opt => opt.setName('message').setDescription('Optional custom message (use {user} for streamer).').setRequired(false)),
  async execute(interaction) {
    if (!interaction.guild) return interaction.reply({ content: 'This command must be run in a server.', ephemeral: true });

    const channelId = interaction.channelId;
    const customMessage = interaction.options.getString('message') || null;

    try {
      // Ensure the channel exists and the bot can at least view it
      const channel = await interaction.guild.channels.fetch(channelId).catch(() => null);
      if (!channel) return interaction.reply({ content: 'Unable to access this channel. Make sure the bot can see it.', ephemeral: true });

      // Check basic permissions (notify admin if missing, but still save the binding)
      let missingPerms = [];
      try {
        const perms = channel.permissionsFor ? channel.permissionsFor(interaction.client.user) : null;
        if (perms) {
          if (!perms.has('SendMessages')) missingPerms.push('SendMessages');
          if (!perms.has('EmbedLinks')) missingPerms.push('EmbedLinks');
          if (!perms.has('AttachFiles')) missingPerms.push('AttachFiles');
        }
      } catch (permErr) {
        // ignore permission check failures
      }

      await KickNowLiveChannel.findOneAndUpdate(
        { guildId: String(interaction.guild.id) },
        { guildId: String(interaction.guild.id), channelId: String(channelId), customMessage },
        { upsert: true, new: true }
      );

      const note = missingPerms.length ? ` Note: bot may be missing permissions: ${missingPerms.join(', ')}.` : '';
      return interaction.reply({ content: `This channel has been set as the Kick notifications channel.${note}`, ephemeral: true });
    } catch (err) {
      console.error('[Kick] Failed to set Kick channel:', err);
      return interaction.reply({ content: 'Failed to save configuration. Check bot logs.', ephemeral: true });
    }
  }
};*/

module.exports = {
    /** 
     * 
     * @param {Client} client
     * @param {Interaction} interaction
     */
    callback: async (client, interaction,) => {
        try {
            const targetChannel = interaction.channelId;
            const customMessage = interaction.options.getString('message') || null;
            await interaction.deferReply({ ephemeral: true });
            const newKickNowLiveChannel = new KickNowLiveChannel({
                guildId: interaction.guildId,
                channelId: targetChannel,
                customMessage,
            });
            await newKickNowLiveChannel.save();
            if (customMessage) {
                interaction.followUp({
                    content: `Configured <#${targetChannel}> to receive Kick notifications with a custom message: "**${customMessage}**"`,
                    ephemeral: true
                });
            } else {
                interaction.followUp({
                    content: `Configured <#${targetChannel}> to receive Kick notifications with the default message.`,
                    ephemeral: true
                });
            }
        } catch (error) {
            console.log(`Error in ${__filename}:\n`, error);
            interaction.followUp({ content: 'An error occurred. Please try again.', ephemeral: true });
        }
    },

    name: 'setup-kick-channel',
    description: 'Bind the current channel as the Kick notifications channel for this server',
    options: [
        {
            name: 'message',
            description: 'Optional custom message (use {user} for streamer).',
            type: ApplicationCommandOptionType.String,
            required: false,
        }
    ],
    permissionsRequired: [PermissionFlagsBits.Administrator],
    botPermissions: [PermissionFlagsBits.ManageChannels],
};
