const { ApplicationCommandOptionType, Client, Interaction, PermissionFlagsBits } = require('discord.js');
const KickNowLiveChannel = require('../../schemas/KickNowLiveChannel');

/*module.exports = {
  data: new SlashCommandBuilder()
    .setName('remove-kick-channel')
    .setDescription('Remove the Kick notifications channel binding for this server'),
  async execute(interaction) {
    if (!interaction.guild) return interaction.reply({ content: 'This command must be run in a server.', ephemeral: true });

    try {
      const res = await KickNowLiveChannel.deleteOne({ guildId: interaction.guild.id });
      if (res.deletedCount && res.deletedCount > 0) {
        return interaction.reply({ content: 'Kick notifications channel unbound for this server.', ephemeral: true });
      }
      return interaction.reply({ content: 'No Kick notifications channel was configured for this server.', ephemeral: true });
    } catch (err) {
      console.error('[Kick] Failed to remove Kick channel:', err);
      return interaction.reply({ content: 'Failed to remove configuration. Check bot logs.', ephemeral: true });
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
            await interaction.deferReply({ ephemeral: true }); 
            const result = await KickNowLiveChannel.deleteOne({
                guildId: interaction.guildId,
            }); 
            if (result.deletedCount === 0) {
                interaction.followUp({
                    content: 'No Kick notifications channel was configured for this server.',
                    ephemeral: true
                });
                return;
            }
            interaction.followUp({
                content: 'Kick notifications channel unbound for this server.',
                ephemeral: true
            });
        } catch (error) {
            console.log(`Error in ${__filename}:\n`, error);
            interaction.followUp({ content: 'An error occurred. Please try again.', ephemeral: true });
        }
    },
    name: 'remove-kick-channel',
    description: 'Remove the Kick notifications channel binding for this server',
    permissionsRequired: [PermissionFlagsBits.Administrator],
    botPermissions: [PermissionFlagsBits.ManageChannels],
};