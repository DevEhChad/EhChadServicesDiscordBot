require("dotenv").config();
const { Client, IntentsBitField, ActivityType } = require('discord.js');
const eventHandler = require('./handlers/eventHandler');

const client = new Client({
    intents: [
        IntentsBitField.Flags.Guilds,
        IntentsBitField.Flags.GuildMembers,
        IntentsBitField.Flags.GuildMessages,
        IntentsBitField.Flags.MessageContent,
    ],
});

// Old Interaction Message commands
/*client.on('interactionCreate', async (interaction) => {
    try {
        if (interaction.isButton()) return;
    await interaction.deferReply({ ephemeral: true });

    const role = interaction.guild.roles.cache.get(interaction.customid);
    if (!role) {
        interaction.editReply({
            content: "I couldn't find that role.",
        })
        return;
    }

    const hasRole = interaction.member.roles.cache.has(role.id);
    
    if (hasRole) {
        await interaction.member.roles.remove(role);
        await interaction.editReply(`The role ${role} has been removed.`);
        return;
    }
    
    await interaction.member.roles.add(role);
    await interaction.editReply(`The role ${role} has been added.`);

    } catch (error) {
        console.log(error);
    }
});*/

eventHandler(client);

client.login(process.env.TOKEN);