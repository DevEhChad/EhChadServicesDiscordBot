const { Events } = require('discord.js');
const { devs, mainServer } = require('../../../config.json');
const getLocalCommands = require('../../utils/getLocalCommands');

module.exports = {
  name: Events.InteractionCreate,
  async execute(client, interaction) {
    if (!interaction.isChatInputCommand()) {
      return;
    }

    const localCommands = getLocalCommands();
    const commandObject = localCommands.find(
      (cmd) => cmd.name === interaction.commandName
    );

    if (!commandObject) {
      return;
    }

    if (commandObject.devOnly) {
      if (!devs.includes(interaction.member.id)) {
        interaction.reply({
          content: 'Only developers are allowed to run this command.',
          ephemeral: true,
        });
        return;
      }
    }

    if (commandObject.permissionsRequired?.length) {
      for (const permission of commandObject.permissionsRequired) {
        if (!interaction.member.permissions.has(permission)) {
          interaction.reply({
            content: 'You do not have the required permissions to run this command.',
            ephemeral: true,
          });
          return;
        }
      }
    }

    try {
      await commandObject.callback(client, interaction);
    } catch (error) {
      console.log(`There was an error running the command: ${interaction.commandName}`);
      console.log(error);
    }
  },
};