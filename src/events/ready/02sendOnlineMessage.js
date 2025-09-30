const { EmbedBuilder, Events } = require('discord.js');
const { statusChannelId } = require('../../../config.json');

module.exports = {
  name: Events.ClientReady,
  once: true,
  async execute(client) {
    if (!statusChannelId) {
      console.log('Status channel ID not configured. Skipping online message.');
      return;
    }
  
    try {
      const channel = await client.channels.fetch(statusChannelId);
  
      if (channel) {
        const embed = new EmbedBuilder()
          .setColor('#57F287') // Green
          .setTitle('Bot Status')
          .setDescription(`${client.user.username} is now online and ready!`)
          .setThumbnail(client.user.displayAvatarURL())
          .setTimestamp()
          .setFooter({ text: 'ehchadservices.com' });
  
        await channel.send({ embeds: [embed] });
      }
    } catch (error) {
      console.error(`Error sending online message to channel ${statusChannelId}:`, error);
    }
  },
};