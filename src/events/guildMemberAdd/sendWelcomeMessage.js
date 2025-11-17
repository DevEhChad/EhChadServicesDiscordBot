const { Events } = require('discord.js');
const welcomeChannelSchema = require('../../schemas/WelcomeChannel');

/**
 *
 * @param {Client} client
 * @param {GuildMember} guildMember
 */

module.exports = {
  name: Events.GuildMemberAdd,
  async execute(client, guildMember) {
    try {
      const welcomeConfigs = await welcomeChannelSchema.find({ guildId: String(guildMember.guild.id) });
      if (!welcomeConfigs || welcomeConfigs.length === 0) return;

      for (const welcomeConfig of welcomeConfigs) {
        const targetChannel =
          guildMember.guild.channels.cache.get(welcomeConfig.channelId) ||
          (await guildMember.guild.channels.fetch(welcomeConfig.channelId).catch(e => {
            if (e && e.code === 10003) {
              welcomeChannelSchema.findOneAndDelete({ guildId: guildMember.guild.id, channelId: welcomeConfig.channelId }).catch(deleteError => {
                console.error(`[Welcome] Error deleting welcome channel from DB:`, deleteError);
              });
            } else {
              console.error(`[Welcome] Error fetching channel:`, e);
            }
          }));

        if (!targetChannel) {
          continue; // Skip to next config if channel not found
        }

        const customMessage = welcomeConfig.customMessage || 'Hello {username}. Welcome to {server-name}!';

        const welcomeMessage = customMessage
          .replace('{mention-member}', `<@${guildMember.id}>`)
          .replace('{username}', guildMember.user.username)
          .replace('{server-name}', guildMember.guild.name)
          .replace('{user-tag}', guildMember.user.tag)
          .replace('<@{user-tag}>', `<@${guildMember.user.id}>`);

        await targetChannel.send({ content: welcomeMessage }).catch(sendError => {
          console.error(`[Welcome] Error sending welcome message to channel ${targetChannel.id}:`, sendError);
        });
      }
    } catch (error) {
      console.error(`[Welcome] Error in ${__filename}:`, error);
    }
  }
};