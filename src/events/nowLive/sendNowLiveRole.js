const { Client, GuildMemberRoleManager } = require('discord.js');
const NowLiveRoleSchema = require('../../schemas/NowLiveRole');
const NowLiveSchema = require("../../schemas/NowLiveChannel");
const TwitchUserSchema = require("../../schemas/TwitchUser");
require("dotenv").config();
const twitchClientID = process.env.TWITCH_CLIENT_ID;
const twitchSecretID = process.env.TWITCH_CLIENT_SECRET;

module.exports = async (client) => {
    const checkTwitchStatus = async () => {
        try {
            const guilds = await NowLiveRoleSchema.find({});

            for (const guildData of guilds) {
                const guildId = guildData.guildId;
                const guild = client.guilds.cache.get(guildId);
                if (!guild) continue;

                const nowLiveRoleId = guildData.nowLiveRoleId;
                const nowLiveRole = guild.roles.cache.get(nowLiveRoleId);
                if (!nowLiveRole) continue;

                const twitchUsers = await TwitchUserSchema.find({ guildId });

                for (const twitchUserData of twitchUsers) {
                    const twitchUsername = twitchUserData.twitchUsername;
                    const member = guild.members.cache.get(twitchUserData.userId);
                    if (!member) continue;

                    try {
                        // Dynamic import for node-fetch
                        const fetch = (await import('node-fetch')).default; 

                        const tokenResponse = await fetch('https://id.twitch.tv/oauth2/token', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/x-www-form-urlencoded'
                            },
                            body: new URLSearchParams({
                                client_id: twitchClientID,
                                client_secret: twitchSecretID,
                                grant_type: 'client_credentials'
                            })
                        });
                        const tokenData = await tokenResponse.json();
                        if (!tokenData.access_token) return console.log('No access token provided');

                        const twitchResponse = await fetch(`https://api.twitch.tv/helix/streams?user_login=${twitchUsername}`, {
                            headers: {
                                'Client-ID': twitchClientID,
                                'Authorization': `Bearer ${tokenData.access_token}`
                            }
                        });

                        if (!twitchResponse.ok) {
                            console.error(`Twitch API Error: ${twitchResponse.status} ${twitchResponse.statusText}`);
                            continue;
                        }

                        const twitchData = await twitchResponse.json();

                        if (twitchData.data.length > 0) {
                            if (!member.roles.cache.has(nowLiveRoleId)) {
                                try {
                                    await member.roles.add(nowLiveRole);
                                    console.log(`Added Now Live role to ${member.user.tag} in ${guild.name}`);
                                } catch (error) {
                                    console.error(`Error adding role to ${member.user.tag}:`, error);
                                }
                            }
                        } else {
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
                }
            }
        } catch (error) {
            console.error("Error checking Twitch status:", error);
        }
    };

    setInterval(checkTwitchStatus, 2 * 60 * 1000);
};