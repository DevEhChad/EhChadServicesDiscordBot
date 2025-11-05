const { Events, ActionRowBuilder, ButtonBuilder } = require('discord.js');
const { devs, mainServer } = require('../../../config.json');
const getLocalCommands = require('../../utils/getLocalCommands');
const Toggle = require('../../schemas/Toggle');

module.exports = {
  name: Events.InteractionCreate,
  async execute(client, interaction) {
    // Handle select menu for manage-toggles
    if (interaction.isStringSelectMenu()) {
      if (interaction.customId === 'manage-toggle-select') {
        // Only allow devs
        if (!devs.includes(interaction.user.id)) {
          return interaction.reply({ content: 'Only developers can manage toggles.', ephemeral: true });
        }

        const value = interaction.values[0]; // e.g. 'command:bind-youtube-channel' or 'service:kick-notifier'
        const [type, ...rest] = value.split(':');
        const key = rest.join(':');

        // Fetch current toggle state
        const toggle = await Toggle.findOne({ key, type, guildId: null });
        const enabled = toggle ? toggle.enabled : true;
        const devOnly = toggle ? toggle.devOnly : false;

        const components = [];
        if (type === 'command') {
          const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId(`toggle:command:${key}`).setLabel(`${enabled ? 'Disable' : 'Enable'} ${key}`).setStyle(enabled ? ButtonStyle.Danger : ButtonStyle.Success),
            new ButtonBuilder().setCustomId(`devonly:command:${key}`).setLabel(`${devOnly ? 'Unset Dev' : 'Set Dev'} ${key}`).setStyle(devOnly ? ButtonStyle.Secondary : ButtonStyle.Primary),
          );
          components.push(row);
        } else {
          const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId(`toggle:service:${key}`).setLabel(`${enabled ? 'Disable' : 'Enable'} ${key}`).setStyle(enabled ? ButtonStyle.Danger : ButtonStyle.Success)
          );
          components.push(row);
        }

        return interaction.update({ content: `${key} — ${enabled ? 'enabled' : 'disabled'}${devOnly ? ' • dev-only' : ''}`, components, ephemeral: true });
      }
    }

    // Handle button interactions for toggles
    if (interaction.isButton()) {
      const id = interaction.customId; // e.g. 'toggle:command:bind-youtube-channel'
      if (!id) return;

      const parts = id.split(':');
      if (parts.length >= 3) {
        const action = parts[0];
        const type = parts[1];
        const key = parts.slice(2).join(':');

        // Only allow devs to toggle
        if (!devs.includes(interaction.user.id)) {
          return interaction.reply({ content: 'Only developers can toggle commands/services.', ephemeral: true });
        }

          if (action === 'toggle') {
          const t = await Toggle.findOneAndUpdate({ key, type, guildId: null }, { $setOnInsert: { enabled: true } }, { upsert: true, new: true });
          t.enabled = !t.enabled;
          await t.save();
          return interaction.update({ content: `${key} is now ${t.enabled ? 'enabled' : 'disabled'}.`, components: [] });
        }

        if (action === 'devonly' && type === 'command') {
          const t = await Toggle.findOneAndUpdate({ key, type: 'command', guildId: null }, { $setOnInsert: { enabled: true, devOnly: false } }, { upsert: true, new: true });
          t.devOnly = !t.devOnly;
          await t.save();
          return interaction.update({ content: `${key} devOnly is now ${t.devOnly ? 'ON' : 'OFF'}.`, components: [] });
        }
      }
      return;
    }

    if (!interaction.isChatInputCommand()) {
      return;
    }

    const localCommands = getLocalCommands();
    const commandObject = localCommands.find((cmd) => cmd.name === interaction.commandName);

    if (!commandObject) {
      return;
    }

    // Check command/service toggles
    const globalToggle = await Toggle.findOne({ key: commandObject.name, type: 'command', guildId: null });
    if (globalToggle && globalToggle.enabled === false) {
      return interaction.reply({ content: 'This command has been disabled by the bot owner.', ephemeral: true });
    }

    // devOnly can be set via Toggle or command definition
    const devToggle = await Toggle.findOne({ key: commandObject.name, type: 'command', guildId: null });
    const isDevOnly = (devToggle && devToggle.devOnly) || commandObject.devOnly;
    if (isDevOnly && !devs.includes(interaction.user.id)) {
      return interaction.reply({ content: 'Only developers are allowed to run this command.', ephemeral: true });
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
      // Support both new-style commands (exporting `data` + `execute(interaction)`)
      // and legacy callback-style commands (exporting `callback(client, interaction)`).
      if (typeof commandObject.execute === 'function') {
        // Call execute with the expected number of arguments.
        // Many commands use execute(interaction) but some older ones may accept (client, interaction).
        const sig = commandObject.execute.length;
        if (sig === 1) {
          await commandObject.execute(interaction);
        } else if (sig === 2) {
          await commandObject.execute(client, interaction);
        } else {
          // Unknown signature; try safe call with interaction first.
          await commandObject.execute(interaction).catch(async () => {
            try {
              await commandObject.execute(client, interaction);
            } catch (err) {
              throw err;
            }
          });
        }
      } else if (typeof commandObject.callback === 'function') {
        await commandObject.callback(client, interaction);
      } else {
        console.log(`Command ${interaction.commandName} has no executable handler.`);
      }
    } catch (error) {
      console.log(`There was an error running the command: ${interaction.commandName}`);
      console.log(error);
    }
  },
};