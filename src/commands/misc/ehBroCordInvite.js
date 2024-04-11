const {
    Client,
    Interaction,
  } = require('discord.js');

/**
 * @param {Client} client
 * @param {Interaction} interaction
 */

module.exports = {
  
    callback: async (client, interaction) => {
      try {
        const invite = "https://discord.gg/EAqNqWjJMQ";

        await interaction.reply(invite);
        
      } catch (error) {
        console.log('error', error);
      } return;
    },

    //deleted: true,
    //devOnly: true,
    name: 'ehbrocord-invite',
    description: 'Will send Eh BroCords discords perma invite link.',
  };