const { Events } = require('discord.js');
const AutoRole = require('../../schemas/AutoRole');

module.exports = {
  name: Events.GuildMemberAdd,
  async execute(client, member) {
    try {
      const guild = member.guild;
      if (!guild) return;

      const autoRole = await AutoRole.findOne({ guildId: String(guild.id) });
      if (!autoRole) return;

      // Fetch the role from the guild
      const role = guild.roles.cache.get(autoRole.roleId) || (await guild.roles.fetch(autoRole.roleId).catch(() => null));

      if (role) {
        // Role exists, add it to the member
        await member.roles.add(role).catch(err => {
          console.error(`[AutoRole] Failed to add role ${autoRole.roleId} to ${member.user.tag}:`, err);
        });
      } else {
        // Role doesn't exist, delete the entry from the database
        console.log(`[AutoRole] Role with ID ${autoRole.roleId} not found in guild ${guild.name}. Deleting from DB.`);
        await AutoRole.deleteOne({ guildId: String(guild.id) }).catch(err => console.error('[AutoRole] Failed to delete missing role entry:', err));
      }
    } catch (error) {
      console.error('[AutoRole] Error in handler:', error);
    }
  }
};