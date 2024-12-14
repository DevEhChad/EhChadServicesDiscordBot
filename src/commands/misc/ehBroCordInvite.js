const {
  Client,
  Interaction,
  EmbedBuilder,
} = require('discord.js');

/**
 * @param {Client} client
 * @param {Interaction} interaction
 */

module.exports = {

  callback: async (client, interaction) => {
    try {

      const invite = "https://discord.gg/EAqNqWjJMQ";

      const embed = new EmbedBuilder()
        .setColor(0xFF0000)
        .setTitle("Click to join!")
        .setDescription(`Link: ${invite}`)
        .setURL(invite);

      await interaction.user.send({ embeds: [embed], content: invite });
      await interaction.reply({ content: "Check your DMs!", ephemeral: true });

    } catch (error) {
      console.log('error', error);
      if (error.code === 50007) {
        await interaction.reply({ content: "I can't DM you. Please enable DMs from server members.", ephemeral: true });
      } else {
        await interaction.reply({ content: "Something went wrong.", ephemeral: true });
      }
    } return;
  },

  
  //devOnly: true,
  name: 'ehbrocord-invite',
  description: 'Will send Eh BroCords discords perma invite link.',
};