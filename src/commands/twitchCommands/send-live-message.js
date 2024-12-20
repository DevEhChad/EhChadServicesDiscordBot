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
      interaction.reply({ content: `Sending Live Message!`, ephemeral: true });
      sendNowLiveMessage(client);
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