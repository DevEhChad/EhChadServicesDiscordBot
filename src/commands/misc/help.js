const { Client, SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fs = require('node:fs');
const path = require('node:path');
const invite = require('./invite');

/**
 * @param {Client} client
 * @param {Interaction} interaction
 */

module.exports = {

    callback: async (client, interaction) => {
        const commandsPath = path.join(__dirname, "../", "../", "commands/"); // Path to your commands directory
        const commandFiles = getAllCommandFiles(commandsPath);

        const embed = new EmbedBuilder()
            .setColor(0x0099FF)
            .setTitle('Available Commands')
            .setDescription('Here\'s a list of all the commands you can use:');

        for (const file of commandFiles) {
            const filePath = path.join(commandsPath, file);
            const command = require(filePath);
            embed.addFields({ name: `/${command.name}`, value: command.description });
        }

        await interaction.reply({ embeds: [embed] });
    },

    deleted: true,
    name: 'help',
    description: 'Provides a list of all commands and their descriptions.',
};

function getAllCommandFiles(dirPath, arrayOfFiles) {
    files = fs.readdirSync(dirPath);

    arrayOfFiles = arrayOfFiles || [];

    files.forEach(function (file) {
        if (fs.statSync(dirPath + "/" + file).isDirectory()) {
            arrayOfFiles = getAllCommandFiles(dirPath + "/" + file, arrayOfFiles);
        } else {
            if (file.endsWith('.js')) {
                arrayOfFiles.push(path.join(dirPath, "/", file));
            }
        }
    });

    return arrayOfFiles;
}