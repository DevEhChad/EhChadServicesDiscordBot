const { Client, GuildMember } = require('discord.js');
const AutoRole = require('../../schemas/AutoRole');

/**
 *
 * @param {Client} client
 * @param {GuildMember} member
 */
module.exports = async (client, member) => {
  try {
    let guild = member.guild;
    if (!guild) return;

    const autoRole = await AutoRole.findOne({ guildId: guild.id });
    if (!autoRole) return;

    // Fetch the role from the guild
    const role = guild.roles.cache.get(autoRole.roleId);

    if (role) {
      // Role exists, add it to the member
      await member.roles.add(role);
    } else {
      // Role doesn't exist, delete the entry from the database
      console.log(`Role with ID ${autoRole.roleId} not found in guild ${guild.name}. Deleting from database.`);
      await AutoRole.deleteOne({ guildId: guild.id });
    }
  } catch (error) {
    if (error.code === 10011) { // 10011: Unknown Role
            await AutoRole.deleteOne({ guildId: guild.id });
        } else {
            console.log(`Error giving role automatically: ${error}`);
        }
  }
};