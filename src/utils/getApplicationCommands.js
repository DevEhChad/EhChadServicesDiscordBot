module.exports = async (client, guildId) => {
  let applicationCommands;

  if (guildId) {
    // This part remains the same
    const guild = await client.guilds.fetch(guildId);
    applicationCommands = guild.commands;
  } else {
    // Fetch global commands instead of guild commands
    applicationCommands = await client.application.commands;
  }

  await applicationCommands.fetch();
  return applicationCommands;

};

/*module.exports = async (client, guildId) => {
    let applicationCommands;
  
    if (guildId) {
      const guild = await client.guilds.fetch(guildId);
      applicationCommands = guild.commands;
    } else {
      applicationCommands = await client.application.commands;
    }
  
    await applicationCommands.fetch();
    return applicationCommands;
  };*/