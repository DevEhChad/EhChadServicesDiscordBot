const { mainServer } = require('../../../config.json');
const { Events } = require('discord.js');
const areCommandsDifferent = require('../../utils/areCommandsDifferent');
const getApplicationCommands = require('../../utils/getApplicationCommands');
const getLocalCommands = require('../../utils/getLocalCommands');

module.exports = {
  name: Events.ClientReady,
  once: true,
  async execute(client) {
    try {
      // Always reinitialize (bulk replace) application commands on bot start.
      const localCommands = getLocalCommands();
      const applicationCommands = await getApplicationCommands(client, mainServer);

      // Gather local commands payloads (exclude those marked deleted)
      const toRegister = localCommands.filter(c => !c.deleted);
      const payloads = toRegister.map(c => ({
        name: c.name,
        description: c.description || 'No description provided.',
        options: c.options || [],
      }));

      const skipped = localCommands.filter(c => c.deleted).map(c => c.name);
      const existingCount = applicationCommands.cache?.size || 0;

      // Bulk set replaces all existing application commands with `payloads`.
      await applicationCommands.set(payloads);

  const added = payloads.length;
  const removed = existingCount; // number of commands replaced
  const edited = 0; // bulk set recreates commands, so report edits as 0

  console.log(`✅ Commands reinitialized. Count: ${added} (skipped: ${skipped.length}).`);
    } catch (error) {
      console.log(`There was an error: ${error}`);
    }
  },
};