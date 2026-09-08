const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Replies with the bot ping!'),

  async execute(interaction) {

    function getRandomColor() {
      const letters = '0123456789ABCDEF';
      let color = '#';
      for (let i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
      }
      return color;
    }

    await interaction.deferReply({ flags: MessageFlags.Ephemeral }); // Ephemeral added here

    const reply = await interaction.fetchReply();

    const ping = reply.createdTimestamp - interaction.createdTimestamp;

    const embed = new EmbedBuilder()
      .setColor(getRandomColor())
      .setTitle("Pong!")
      .setDescription(`Ping is ${ping}ms | Websocket: ${interaction.client.ws.ping}ms`);

    await interaction.editReply({
      embeds: [embed],
    });

    setTimeout(async () => {
      try {
        await interaction.deleteReply();
      } catch (error) {
        console.error('Error deleting reply:', error);
      }
    }, 10000); // 10000 milliseconds = 10 seconds
  },
};
