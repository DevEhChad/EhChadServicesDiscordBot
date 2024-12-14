const { Client, GuildMemberRoleManager } = require('discord.js');
const NowLiveRoleSchema = require('../schemas/NowLiveRole'); // Path to your schema
const fetch = require('node-fetch'); // For making HTTP requests to the Twitch API

module.exports = (client) => {
    client.on('presenceUpdate', async (oldPresence, newPresence) => {
        if (!newPresence.guild) return; // Ignore DMs or other non-guild presences

        const guildId = newPresence.guild.id;
        const guild = client.guilds.cache.get(guildId);
        if(!guild) return;

        const nowLiveRoleData = await NowLiveRoleSchema.findOne({ guildId });
        if (!nowLiveRoleData) return; // No role set for this guild

        const nowLiveRoleId = nowLiveRoleData.nowLiveRoleId;
        const nowLiveRole = guild.roles.cache.get(nowLiveRoleId);
        if(!nowLiveRole) return;

        const member = newPresence.member;
        if (!member) return;

        const twitchActivity = newPresence.activities.find(activity => activity.type === 4 && activity.name === 'Twitch');
        if (!twitchActivity) {
            // User is no longer streaming on Twitch. Remove the role.
            if (member.roles.cache.has(nowLiveRoleId)) {
                try {
                    await member.roles.remove(nowLiveRole);
                    console.log(`Removed Now Live role from ${member.user.tag} in ${guild.name}`);
                } catch (error) {
                    console.error(`Error removing role from ${member.user.tag}:`, error);
                }
            }
            return;
        }

        const twitchUsername = twitchActivity.url.split('/').pop(); // Extract username from URL
        if (!twitchUsername) return;

        try {

            const twitchClientId = process.env.TWITCH_CLIENT_ID; // Get your Twitch Client ID from environment variables
            const twitchClientSecret = process.env.TWITCH_CLIENT_SECRET
            if(!twitchClientId || !twitchClientSecret) return console.log('No twitch credentials provided')

            const tokenResponse = await fetch('https://id.twitch.tv/oauth2/token', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: new URLSearchParams({
                    client_id: twitchClientId,
                    client_secret: twitchClientSecret,
                    grant_type: 'client_credentials'
                })
            })
            const tokenData = await tokenResponse.json()
            if(!tokenData.access_token) return console.log('No access token provided')

            const twitchResponse = await fetch(`https://api.twitch.tv/helix/streams?user_login=${twitchUsername}`, {
                headers: {
                    'Client-ID': twitchClientId,
                    'Authorization': `Bearer ${tokenData.access_token}`
                }
            });

            if (!twitchResponse.ok) {
                console.error(`Twitch API Error: ${twitchResponse.status} ${twitchResponse.statusText}`);
                return;
            }

            const twitchData = await twitchResponse.json();

            if (twitchData.data.length > 0) {
                // User is live on Twitch. Add the role.
                if (!member.roles.cache.has(nowLiveRoleId)) {
                    try {
                        await member.roles.add(nowLiveRole);
                        console.log(`Added Now Live role to ${member.user.tag} in ${guild.name}`);
                    } catch (error) {
                        console.error(`Error adding role to ${member.user.tag}:`, error);
                    }
                }
            } else {
                // User is not live on Twitch. Remove the role.
                if (member.roles.cache.has(nowLiveRoleId)) {
                    try {
                        await member.roles.remove(nowLiveRole);
                        console.log(`Removed Now Live role from ${member.user.tag} in ${guild.name}`);
                    } catch (error) {
                        console.error(`Error removing role from ${member.user.tag}:`, error);
                    }
                }
            }
        } catch (error) {
            console.error("Error checking Twitch status:", error);
        }
    });
};