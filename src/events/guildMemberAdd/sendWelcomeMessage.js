const { Client, GuildMember, GuildChannel } = require('discord.js');
const welcomeChannelSchema = require('../../schemas/WelcomeChannel');

    /** 
     * 
     * @param {Client} client
     * @param {GuildMember} member
     * @param {GuildChannel} guildChannel
    */

module.exports = async (client, member, guildChannel,) => {
    try {
        //let guild = member.guild;
        //if (!guild) return;
        //if (member.user.bot) return;
        const welcomeConfigs = await welcomeChannelSchema.findOne({ guildId: member.guild.id });
        //if (!welcomeConfigs) return;

        for (const welcomeConfig of welcomeConfigs) { 
            const targetChannel = member.guild.channels.cache.get(welcomeConfig.channelId);
            console.log(targetChannel);

            if (!targetChannel) { welcomeChannelSchema.findOneAndDelete({ guildId: member.guild.Id, channelId: welcomeConfig.channelId, })
            }

            const customMessage = welcomeConfig.customMessage || 'Hello {username}. Welcome to {server-name}!';

            const welcomeMessage = customMessage
                .replace('{mention-member}', `<@${member.id}>`)
                .replace('{username}', member.user.username)
                .replace('{server-name}', member.guild.name)
            
                targetChannel.send(welcomeMessage);
        }
    } catch (error) {
        console.log(`Error in ${__filename}:\n`, error);
    }
};