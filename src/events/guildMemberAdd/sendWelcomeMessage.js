const { Client, GuildMember } = require('discord.js');
const welcomeChannelSchema = require('../../schemas/WelcomeChannel');

/**
 *
 * @param {Client} client
 * @param {GuildMember} guildMember
 */

module.exports = async (client, guildMember) => {
    try {
        //let guild = guildMember.guild;
        const welcomeConfigs = await welcomeChannelSchema.find({ guildId: guildMember.guild.id });
        if (!welcomeConfigs.length) return;

        for (const welcomeConfig of welcomeConfigs) {
            const targetChannel = guildMember.guild.channels.cache.get(welcomeConfig.channelId) || (await guildMember.guild.channels.fetch(welcomeConfig.channelId));

            if (!targetChannel) { welcomeChannelSchema.findOneAndDelete({ guildId: guildMember.guild.id, channelId: welcomeConfig.channelId }).catch(() => {});
            return;
        }

        const customMessage = welcomeConfig.customMessage || 'Hello {username}. Welcome to {server-name}!';

        const welcomeMessage = customMessage
            .replace('{mention-member}', `<@${guildMember.id}>`)
            .replace('{username}', guildMember.user.username)
            .replace('{server-name}', guildMember.guild.name)

        targetChannel.send(welcomeMessage).catch(() => {});
        console.log(`${guildMember.user.tag} has joined ${guildMember.guild.name}`);
        }
    } catch (error) {
        console.log(`Error in ${__filename}:\n`, error);
    }
};