const { ApplicationCommandOptionType, ActionRowBuilder, StringSelectMenuBuilder, Client, Interaction } = require('discord.js');
const Toggle = require('../../schemas/Toggle');
const getLocalCommands = require('../../utils/getLocalCommands');
const { devs } = require('../../../config.json');

/*module.exports = {
  data: new SlashCommandBuilder()
    .setName('manage-toggles')
    .setDescription('Manage command and service toggles (enable/disable, set dev-only)')
    .addStringOption(opt => opt.setName('target').setDescription('Command or service name (or "all")').setRequired(false)),
  async execute(interaction) {
    // Restrict to devs only
    if (!devs.includes(interaction.user.id)) {
      return interaction.reply({ content: 'This command is restricted to the bot developers.', ephemeral: true });
    }

    const target = interaction.options.getString('target');
    const localCommands = getLocalCommands();

    // If no target provided, show interactive list of commands and services using a select menu
    if (!target) {
      // Build list of command options (include deleted commands but mark them)
      const options = [];
      for (const cmd of localCommands) {
        const key = cmd.name || '(unnamed)';
        const isDeleted = !!cmd.deleted;
        const toggle = await Toggle.findOne({ key, type: 'command', guildId: null });
        const enabled = toggle ? toggle.enabled : true;
        const devOnly = toggle ? toggle.devOnly : !!cmd.devOnly;

        const label = `${key}${isDeleted ? ' (deleted)' : ''}`.slice(0, 100);
        const description = `${enabled ? 'enabled' : 'disabled'}${devOnly ? ' • dev-only' : ''}`.slice(0, 100);

        options.push({ label, value: `command:${key}`, description });
      }

      // Add service toggles (like 'kick-notifier' or 'youtube-notifier')
      const services = ['kick-notifier', 'youtube-notifier'];
      for (const svc of services) {
        const toggle = await Toggle.findOne({ key: svc, type: 'service', guildId: null });
        const enabled = toggle ? toggle.enabled : true;
        options.push({ label: svc, value: `service:${svc}`, description: enabled ? 'enabled' : 'disabled' });
      }

      if (options.length === 0) return interaction.reply({ content: 'No commands or services available to manage.', ephemeral: true });

      // Discord select menus support up to 25 options. If more, slice to 25 and show a note.
      let note = '';
      let selectOptions = options;
      if (options.length > 25) {
        selectOptions = options.slice(0, 25);
        note = `Showing first 25 of ${options.length} items. Narrow the list by providing the 'target' option.`;
      }

      const select = new StringSelectMenuBuilder()
        .setCustomId('manage-toggle-select')
        .setPlaceholder('Select a command or service to manage')
        .addOptions(selectOptions)
        .setMaxValues(1)
        .setMinValues(1);

      const row = new ActionRowBuilder().addComponents(select);

      // Also build a simple textual summary to show all items and statuses
      const lines = await Promise.all(options.map(async (opt) => {
        const [type, key] = opt.value.split(':');
        const toggle = await Toggle.findOne({ key, type, guildId: null });
        const enabled = toggle ? toggle.enabled : true;
        const devOnly = toggle ? toggle.devOnly : false;
        const deletedMark = opt.label.includes('(deleted)') ? ' (deleted)' : '';
        return `• ${opt.label}${deletedMark} — ${enabled ? 'enabled' : 'disabled'}${devOnly ? ' • dev-only' : ''}`;
      }));

      const content = ['Manage toggles (developer only):', '', ...lines];
      if (note) content.push('', note);

      await interaction.reply({ content: content.join('\n'), components: [row], ephemeral: true });
      return;
    }

    // If target provided, toggle or display status
    const entry = await Toggle.findOne({ key: target, guildId: null });
    if (!entry) {
      return interaction.reply({ content: `No toggle configured for ${target}. Use the interactive view to create one.`, ephemeral: true });
    }

    return interaction.reply({ content: `Toggle for ${target}: ${entry.enabled ? 'enabled' : 'disabled'} (devOnly: ${entry.devOnly})`, ephemeral: true });
  }
};
*/

module.exports = {
    /** 
     *
     * @param {Client} client
     * @param {Interaction} interaction
     */
    callback: async (client, interaction,) => {
        try {
            // Restrict to devs only
            if (!devs.includes(interaction.user.id)) {
                return interaction.reply({ content: 'This command is restricted to the bot developers.', ephemeral: true });
            }
            const target = interaction.options.getString('target');
            const localCommands = getLocalCommands();
            // If no target provided, show interactive list of commands and services using a select menu
            if (!target) {
                // Build list of command options (include deleted commands but mark them)
                const options = [];
                for (const cmd of localCommands) {
                    const key = cmd.name || '(unnamed)';
                    const isDeleted = !!cmd.deleted;
                    const toggle = await Toggle.findOne({ key, type: 'command', guildId: null });
                    const enabled = toggle ? toggle.enabled : true;
                    const devOnly = toggle ? toggle.devOnly : !!cmd.devOnly;
                    const label = `${key}${isDeleted ? ' (deleted)' : ''}`.slice(0, 100);
                    const description = `${enabled ? 'enabled' : 'disabled'}${devOnly ? ' • dev-only' : ''}`.slice(0, 100);
                    options.push({ label, value: `command:${key}`, description });
                }
                // Add service toggles (like 'kick-notifier' or 'youtube-notifier')
                const services = ['kick-notifier', 'youtube-notifier'];
                for (const svc of services) {
                    const toggle = await Toggle.findOne({ key: svc, type: 'service', guildId: null });
                    const enabled = toggle ? toggle.enabled : true;
                    options.push({ label: svc, value: `service:${svc}`, description: enabled ? 'enabled' : 'disabled' });
                }
                if (options.length === 0) return interaction.reply({ content: 'No commands or services available to manage.', ephemeral: true });
                // Discord select menus support up to 25 options. If more, slice to 25 and show a note.
                let note = '';
                let selectOptions = options;
                if (options.length > 25) {
                    selectOptions = options.slice(0, 25);
                    note = `Showing first 25 of ${options.length} items. Narrow the list by providing the 'target' option.`;
                }
                const select = new StringSelectMenuBuilder()
                    .setCustomId('manage-toggle-select')
                    .setPlaceholder('Select a command or service to manage')
                    .addOptions(selectOptions)
                    .setMaxValues(1)
                    .setMinValues(1);
                const row = new ActionRowBuilder().addComponents(select);
                let content = note || 'Select a command or service to manage from the menu below.';
                return interaction.reply({ content, components: [row], ephemeral: true });
            }
            const [type, key] = target.split(':');
            if (!['command', 'service'].includes(type)) {
                return interaction.reply({ content: 'Invalid target type. Must be "command" or "service".', ephemeral: true });
            }
            // If target provided, toggle or display status
            const entry = await Toggle.findOne({ key, type, guildId: null });
            if (!entry) {
                return interaction.reply({ content: `No toggle configured for ${target}. Use the interactive view to create one.`, ephemeral: true });
            }
            return interaction.reply({ content: `Toggle for ${target}: ${entry.enabled ? 'enabled' : 'disabled'} (devOnly: ${entry.devOnly})`, ephemeral: true });
        } catch (error) {
            console.log(`Error in ${__filename}:\n`, error);
            interaction.reply({ content: 'An error occurred. Please try again.', ephemeral: true });
        }


    },
    name: 'manage-toggles',
    description: 'Manage command and service toggles (enable/disable, set dev-only)',
    options: [
        {
            name: 'target',
            description: 'Command or service name (or "all")',
            type: ApplicationCommandOptionType.String,
            required: false,
        }
    ],
};