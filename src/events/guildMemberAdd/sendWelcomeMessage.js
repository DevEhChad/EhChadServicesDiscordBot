const { Client, GuildMember } = require('discord.js');
const welcomeChannelSchema = require('../../schemas/WelcomeChannel');

/**
 *
 * @param {Client} client
 * @param {GuildMember} guildMember
 */

module.exports = async (client, guildMember) => {
  try {
    const welcomeConfigs = await welcomeChannelSchema.find({ guildId: guildMember.guild.id });
    if (!welcomeConfigs.length) return;

    for (const welcomeConfig of welcomeConfigs) {
      const targetChannel = guildMember.guild.channels.cache.get(welcomeConfig.channelId) || (await guildMember.guild.channels.fetch(welcomeConfig.channelId).catch(e => {
          if (e.code === 10003) {
              welcomeChannelSchema.findOneAndDelete({ guildId: guildMember.guild.id, channelId: welcomeConfig.channelId }).catch(deleteError => {
                console.error(`Error deleting welcome channel from database:`, deleteError);
              });
          } else {
              console.error(`Error fetching channel:`, e)
          }
      }));
        
      if (!targetChannel) {
        continue; // Skips to the next welcomeConfig if channel is not found and was deleted
      }

      const customMessage = welcomeConfig.customMessage || 'Hello {username}. Welcome to {server-name}!';

      const welcomeMessage = customMessage
        .replace('{mention-member}', `<@${guildMember.id}>`)
        .replace('{username}', guildMember.user.username)
        .replace('{server-name}', guildMember.guild.name)
        .replace('{user-tag}', guildMember.user.id)
        .replace('<@{user-tag}>', `<@${guildMember.user.id}>`);

      targetChannel.send(welcomeMessage).catch(sendError => {
        console.error(`Error sending welcome message to channel ${targetChannel.name}:`, sendError);
      });
      console.log(`${guildMember.user.tag} has joined ${guildMember.guild.name}`);
    }
  } catch (error) {
    console.log(`Error in ${__filename}:\n`, error);
  }
};