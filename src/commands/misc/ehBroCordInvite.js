const {
  SlashCommandBuilder,
  EmbedBuilder,
  MessageFlags,
} = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ehbrocord-invite')
    .setDescription('Will send Eh BroCords discords perma invite link.'),

  //devOnly: true,
  async execute(interaction) {
    try {

      const invite = "https://discord.gg/EAqNqWjJMQ";

      const embed = new EmbedBuilder()
        .setColor(0xFF0000)
        .setTitle("Click to join!")
        .setDescription(`Link: ${invite}`)
        .setURL(invite);

      await interaction.user.send({ embeds: [embed], content: invite });
      await interaction.reply({ content: "Check your DMs!", flags: MessageFlags.Ephemeral });

    } catch (error) {
      console.log('error', error);
      if (error.code === 50007) {
        await interaction.reply({ content: "I can't DM you. Please enable DMs from server members.", flags: MessageFlags.Ephemeral });
      } else {
        await interaction.reply({ content: "Something went wrong.", flags: MessageFlags.Ephemeral });
      }
    } return;
  },
};
