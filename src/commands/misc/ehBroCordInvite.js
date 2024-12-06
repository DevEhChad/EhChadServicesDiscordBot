const {
  Client,
  Interaction,
  Embed,
  EmbedBuilder,
} = require('discord.js');

/**
 * @param {Client} client
 * @param {Interaction} interaction
 */

module.exports = {

  callback: async (client, interaction, message) => {
    try {
      const invite = "https://discord.gg/EAqNqWjJMQ";

      const embed = new EmbedBuilder()
        .setColor(0xFF0000)
        .setTitle("Click to join!")
        .setDescription(`Link: ${invite}`)
        .setURL(invite);

      await interaction.reply({ embeds: [embed], content: invite, epheremal: true });

    } catch (error) {
      console.log('error', error);
    } return;
  },

  //deleted: true,
  //devOnly: true,
  name: 'ehbrocord-invite',
  description: 'Will send Eh BroCords discords perma invite link.',
};