const path = require('path');
const fs = require('fs');

module.exports = (client) => {
  const eventsPath = path.join(__dirname, '..', 'events');
  const eventFolders = fs.readdirSync(eventsPath);

  for (const eventFolder of eventFolders) {
    const folderPath = path.join(eventsPath, eventFolder);
    const eventFiles = fs.readdirSync(folderPath).filter(file => file.endsWith('.js'));

    for (const file of eventFiles) {
      const filePath = path.join(folderPath, file);
      const event = require(filePath);

      // Check if the event is in the new object format
      if (event.name && event.execute) {
        if (event.once) {
          client.once(event.name, (...args) => event.execute(client, ...args));
        } else {
          // Pass client to the execute function
          client.on(event.name, (...args) => event.execute(client, ...args));
        }
      } else {
        // This will skip files that are not structured as event handlers
      }
    }
  }
};