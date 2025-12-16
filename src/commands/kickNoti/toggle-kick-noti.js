const { ApplicationCommandOptionType, Client, Interaction, PermissionFlagsBits } = require('discord.js');
const Toggle = require('../../schemas/Toggle');

/*module.exports = {

  data: new SlashCommandBuilder()
    .setName('toggle-kick-noti')
    .setDescription('Enable or disable Kick notifications for this server')
    .addBooleanOption(opt => opt.setName('enabled').setDescription('Enable Kick notifications?').setRequired(true)),
  async execute(interaction) {
    if (!interaction.guild) return interaction.reply({ content: 'This command must be run in a server.', ephemeral: true });

    const enabled = interaction.options.getBoolean('enabled');
    try {
      await Toggle.findOneAndUpdate(
        { key: `kick-noti`, type: 'service', guildId: interaction.guild.id },
        { key: `kick-noti`, type: 'service', guildId: interaction.guild.id, enabled, devOnly: false },
        { upsert: true }
      );
      return interaction.reply({ content: `Kick notifications have been ${enabled ? 'enabled' : 'disabled'} for this server.`, ephemeral: true });
    } catch (err) {
      console.error('[Kick] Failed to toggle Kick noti:', err);
      return interaction.reply({ content: 'Failed to save configuration. Check bot logs.', ephemeral: true });
    }
  }
};
*/
module.exports = {
    /** 
     * 
     * @param {Client} client
     * @param {Interaction} interaction
     */
    callback: async (client, interaction,) => {
        try {
            const enabled = interaction.options.getBoolean('enabled');
            await interaction.deferReply({ ephemeral: true });
            await Toggle.findOneAndUpdate(
                { key: `kick-noti`, type: 'service', guildId: interaction.guildId },
                { key: `kick-noti`, type: 'service', guildId: interaction.guildId, enabled, devOnly: false },
                { upsert: true }
            );
            interaction.followUp({
                content: `Kick notifications have been ${enabled ? 'enabled' : 'disabled'} for this server.`,
                ephemeral: true
            });
        } catch (error) {
            console.log(`Error in ${__filename}:\n`, error);
            interaction.followUp({ content: 'An error occurred. Please try again.', ephemeral: true });
        }
    },

    name: 'toggle-kick-noti',
    description: 'Enable or disable Kick notifications for this server',
    options: [
        {
            name: 'enabled',
            description: 'Enable Kick notifications?',
            type: ApplicationCommandOptionType.Boolean,
            required: true,
        }
    ],
    permissionsRequired: [PermissionFlagsBits.Administrator],
    botPermissions: [PermissionFlagsBits.ManageChannels],
};
