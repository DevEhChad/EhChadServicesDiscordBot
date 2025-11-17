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

      // Try cache then fetch role
      let role = guild.roles.cache.get(autoRole.roleId);
      if (!role) {
        role = await guild.roles.fetch(autoRole.roleId).catch(() => null);
      }

      if (!role) {
        console.log(`[AutoRole] Role with ID ${autoRole.roleId} not found in guild ${guild.name}. Deleting DB entry.`);
        await AutoRole.deleteOne({ guildId: String(guild.id) }).catch(() => {});
        return;
      }

      // Check bot permissions and role hierarchy
      const me = guild.members.me || (await guild.members.fetchMe?.());
      if (!me) {
        // Can't determine bot member, try to add and catch errors
        await member.roles.add(role).catch(err => console.error(`[AutoRole] Failed to add role:`, err));
        return;
      }

      const botHasManage = me.permissions.has?.('ManageRoles');
      if (!botHasManage) {
        console.warn('[AutoRole] Bot lacks ManageRoles permission; cannot assign role automatically.');
        return;
      }

      // Ensure bot's highest role is higher than the target role
      if (me.roles.highest.position <= role.position) {
        console.warn('[AutoRole] Bot role hierarchy prevents assigning the configured role.');
        return;
      }

      await member.roles.add(role).catch(err => console.error(`[AutoRole] Error adding role to member:`, err));
    } catch (error) {
      console.error(`[AutoRole] Error in ${__filename}:`, error);
    }
  }
};