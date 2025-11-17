const { Events } = require('discord.js');
const leaveChannelSchema = require('../../schemas/LeaveChannel');

module.exports = {
    name: Events.GuildMemberRemove,
    async execute(client, guildMember) {
        try {
            const leaveConfigs = await leaveChannelSchema.find({ guildId: String(guildMember.guild.id) });
            if (!leaveConfigs || leaveConfigs.length === 0) return;

            for (const leaveConfig of leaveConfigs) {
                const targetChannel =
                    guildMember.guild.channels.cache.get(leaveConfig.channelId) ||
                    (await guildMember.guild.channels.fetch(leaveConfig.channelId).catch(e => {
                        if (e && e.code === 10003) {
                            // Unknown Channel - remove stale DB entry
                            leaveChannelSchema.findOneAndDelete({ guildId: guildMember.guild.id, channelId: leaveConfig.channelId }).catch(deleteError => {
                                console.error(`[Leave] Error deleting leave channel from DB:`, deleteError);
                            });
                        } else {
                            console.error(`[Leave] Error fetching channel:`, e);
                        }
                    }));

                if (!targetChannel) {
                    continue; // Skip this config if channel not found
                }

                const customMessage = leaveConfig.customMessage || 'Goodbye {username}. We will miss you at {server-name}.';

                const leaveMessage = customMessage
                    .replace('{mention-member}', `<@${guildMember.id}>`)
                    .replace('{username}', guildMember.user.username)
                    .replace('{server-name}', guildMember.guild.name)
                    .replace('{user-tag}', guildMember.user.tag)
                    .replace('<@{user-tag}>', `<@${guildMember.user.id}>`);

                await targetChannel.send({ content: leaveMessage }).catch(sendError => {
                    console.error(`[Leave] Error sending leave message to channel ${targetChannel.id}:`, sendError);
                });
            }
        } catch (error) {
            console.error(`[Leave] Error in ${__filename}:`, error);
        }
    }
};