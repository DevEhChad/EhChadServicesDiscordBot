const path = require('path');
const getAllFiles = require('./getAllFiles');

module.exports = (exceptions = []) => {
  let localCommands = [];

  const commandCategories = getAllFiles(
    path.join(__dirname, '..', 'commands'),
    true
  );

  for (const commandCategory of commandCategories) {
    const commandFiles = getAllFiles(commandCategory);

    for (const commandFile of commandFiles) {
      const commandObject = require(commandFile);

      // Normalize new-style slash command exports that use `data: new SlashCommandBuilder()`
      // to the legacy shape { name, description, options } expected by the registrar.
      let normalized = commandObject;
      try {
        if (commandObject && commandObject.data && typeof commandObject.data.toJSON === 'function') {
          const json = commandObject.data.toJSON();
          normalized = Object.assign({}, commandObject, {
            name: json.name,
            description: json.description,
            options: json.options,
          });
        }
      } catch (err) {
        // If normalization fails, fall back to original object
        normalized = commandObject;
      }

      if (exceptions.includes(normalized.name)) continue;

      localCommands.push(normalized);
    }
  }

  return localCommands;
};