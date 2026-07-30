const { ActivityType } = require('discord.js');
const NowLiveRoleSchema = require('../../schemas/NowLiveRole');
const KickUserSchema = require('../../schemas/KickUser');

module.exports = async (client) => {
    // ─────────────────────────────────────────────────────────────────────────
    // TWITCH — Discord presence detection
    // When a user links their Twitch account to Discord and goes live, Discord
    // automatically fires a presenceUpdate with a Streaming activity.
    // No Twitch API calls or per-user Twitch↔Discord mapping needed.
    // Requires: GuildPresences privileged intent (already enabled in main.js).
    // ─────────────────────────────────────────────────────────────────────────

    client.on('presenceUpdate', async (oldPresence, newPresence) => {
        try {
            if (!newPresence?.member || !newPresence?.guild) return;

            const hadTwitchStream = oldPresence?.activities?.some(
                a => a.type === ActivityType.Streaming && a.url?.toLowerCase().includes('twitch.tv')
            ) ?? false;

            const hasTwitchStream = newPresence.activities?.some(
                a => a.type === ActivityType.Streaming && a.url?.toLowerCase().includes('twitch.tv')
            ) ?? false;

            // Only act when Twitch streaming status actually changed
            if (hadTwitchStream === hasTwitchStream) return;

            const guild = newPresence.guild;
            const member = newPresence.member;

            const roleData = await NowLiveRoleSchema.findOne({ guildId: guild.id });
            if (!roleData || !roleData.enabled) return;

            const role = guild.roles.cache.get(roleData.nowLiveRoleId);
            if (!role) return;

            if (hasTwitchStream) {
                if (!member.roles.cache.has(role.id)) {
                    await member.roles.add(role);
                    console.log(`[NowLive] Added role to ${member.user.tag} (Twitch live) in ${guild.name}`);
                }
            } else {
                // Before removing, check if this member is a tracked Kick streamer.
                // If they are, the Kick poller will handle their role — don't interfere.
                const isKickStreamer = await KickUserSchema.findOne({ guildId: guild.id, discordUserId: member.id });
                if (!isKickStreamer && member.roles.cache.has(role.id)) {
                    await member.roles.remove(role);
                    console.log(`[NowLive] Removed role from ${member.user.tag} (Twitch ended) in ${guild.name}`);
                }
            }
        } catch (error) {
            console.error('[NowLive] presenceUpdate error:', error);
        }
    });

    // Startup scan: apply/remove roles for members already streaming when the bot starts.
    client.once('clientReady', async () => {
        try {
            const roleConfigs = await NowLiveRoleSchema.find({});
            for (const roleData of roleConfigs) {
                const guild = client.guilds.cache.get(roleData.guildId);
                if (!guild) continue;

                const role = guild.roles.cache.get(roleData.nowLiveRoleId);
                if (!role) continue;

                for (const [, member] of guild.members.cache) {
                    const isTwitchStreaming = member.presence?.activities?.some(
                        a => a.type === ActivityType.Streaming && a.url?.toLowerCase().includes('twitch.tv')
                    ) ?? false;

                    if (isTwitchStreaming && !member.roles.cache.has(role.id)) {
                        await member.roles.add(role).catch(err =>
                            console.error(`[NowLive] Startup: failed to add role to ${member.user.tag}:`, err)
                        );
                    }
                }
            }
            console.log('[NowLive] Twitch presence startup scan complete.');
        } catch (error) {
            console.error('[NowLive] Startup scan error:', error);
        }
    });

    // ─────────────────────────────────────────────────────────────────────────
    // KICK — API polling (Discord has no native Kick integration)
    // Checks every 2 minutes. Only processes Kick users with a linked discordUserId
    // (set via /add-kick-user kick-username:foo discord-user:@member).
    // ─────────────────────────────────────────────────────────────────────────

    const checkKickStatus = async () => {
        try {
            const { gotScraping } = await import('got-scraping');
            const roleConfigs = await NowLiveRoleSchema.find({});

            for (const roleData of roleConfigs) {
                const guild = client.guilds.cache.get(roleData.guildId);
                if (!guild) continue;

                if (!roleData.enabled) continue;

                const role = guild.roles.cache.get(roleData.nowLiveRoleId);
                if (!role) continue;

                const kickUsers = await KickUserSchema.find({
                    guildId: roleData.guildId,
                    discordUserId: { $exists: true, $ne: null },
                });

                for (const kickUserData of kickUsers) {
                    const member = guild.members.cache.get(kickUserData.discordUserId);
                    if (!member) continue;

                    try {
                        const response = await gotScraping({
                            url: `https://kick.com/api/v2/channels/${kickUserData.kickUsername}`,
                            responseType: 'json',
                            timeout: { request: 10000 },
                        });

                        const isLive = !!(response.body?.livestream);

                        if (isLive && !member.roles.cache.has(role.id)) {
                            await member.roles.add(role);
                            console.log(`[NowLive] Added role to ${member.user.tag} (Kick live) in ${guild.name}`);
                        } else if (!isLive && member.roles.cache.has(role.id)) {
                            // Only remove if they're not currently streaming on Twitch
                            const isTwitchStreaming = member.presence?.activities?.some(
                                a => a.type === ActivityType.Streaming && a.url?.toLowerCase().includes('twitch.tv')
                            ) ?? false;
                            if (!isTwitchStreaming) {
                                await member.roles.remove(role);
                                console.log(`[NowLive] Removed role from ${member.user.tag} (Kick ended) in ${guild.name}`);
                            }
                        }
                    } catch (error) {
                        console.error(`[NowLive] Kick API error for ${kickUserData.kickUsername}:`, error.message);
                    }
                }
            }
        } catch (error) {
            console.error('[NowLive] Kick polling error:', error);
        }
    };

    setInterval(checkKickStatus, 2 * 60 * 1000);
};
