const { Client, GuildMember, GuildMemberRemove } = require('discord.js');
const leaveChannelSchema = require('../../schemas/LeaveChannel');

/**
 *
 * @param {Client} client
 * @param {GuildMember} guildMember
 * @param {GuildMemberRemove} removeMember
 */

module.exports = async (client, guildMember) => {
    try {
        //let guild = guildMember.guild;
        const leaveConfigs = await leaveChannelSchema.find({ guildId: guildMember.guild.id });
        if (!leaveConfigs.length) return;

        for (const leaveConfig of leaveConfigs) {
            const targetChannel = guildMember.guild.channels.cache.get(leaveConfig.channelId) || (await guildMember.guild.channels.fetch(leaveConfig.channelId));

            if (!targetChannel) { leaveChannelSchema.findOneAndDelete({ guildId: guildMember.guild.id, channelId: leaveConfig.channelId }).catch(() => {});
            return;
        }

        const customMessage = leaveConfig.customMessage || `**{username}**, {mention-member}, {user-tag}, <@{user-tag}>, Left the server: **{server-name}**!`;

        const leaveMessage = customMessage
            .replace('{mention-member}', `<@${guildMember.id}>`)
            .replace('{username}', guildMember.user.username)
            .replace('{server-name}', guildMember.guild.name)
            .replace('{user-tag}', guildMember.user.id)
            .replace('<@{user-tag}>', `<@${guildMember.user.id}>`)

        targetChannel.send(leaveMessage).catch(() => {});
        console.log(`${guildMember.user.tag} has left ${guildMember.guild.name}`);
        }
    } catch (error) {
        console.log(`Error in ${__filename}:\n`, error);
    }
};