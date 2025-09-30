const { ApplicationCommandOptionType, Client, Interaction, PermissionFlagsBits } = require('discord.js');
const sendNowLiveMessage = require("../../events/nowLive/sendNowLiveMessage");

module.exports = {

  /** 
   * 
   * @param {Client} client
   * @param {Interaction} interaction
   */

  callback: async (client, interaction) => {
    try {
      // This command is problematic as it re-initializes the interval loop.
      // The check runs automatically every 15 seconds.
      // A manual trigger isn't necessary and can cause issues.
      interaction.reply({ content: `The live-check runs automatically every 15 seconds. A manual trigger is no longer needed.`, ephemeral: true });
    } catch (error) {
      console.log(error);
    }
  },
  //deleted: true,
  devOnly: true,
  name: 'send-live-message',
  description: 'Will send the live message.',
  options: [],
  permissionsRequired: [PermissionFlagsBits.ManageChannels],
  botPermissions: [PermissionFlagsBits.ManageChannels],
};