const { Client, SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

/**
 * @param {Client} client
 * @param {Interaction} interaction
 */

module.exports = {

    //deleted: true,
    name: 'help',
    description: 'Provides a list of all commands and their descriptions.',

    callback: async (client, interaction) => {
        const commandsPath = path.join(__dirname, "..", "..", "commands/"); // Path to commands directory
        const commandFiles = getAllCommandFiles(commandsPath); // Pass commandsPath here

        const embed = new EmbedBuilder()
            .setColor(0x0099FF)
            .setTitle('Available Commands')
            .setDescription('Here\'s a list of all the commands you can use:');

        for (const file of commandFiles) {

            try {
                // Read the file content
                const fileContent = fs.readFileSync(file, 'utf-8');

                // Extract name and description (adjust regex if needed)
                const nameMatch = fileContent.match(/name: '(.+?)'/);
                const descriptionMatch = fileContent.match(/description: '(.+?)'/);

                const name = nameMatch ? nameMatch[1] : 'Unknown name';
                const description = descriptionMatch ? descriptionMatch[1] : 'Unknown description';

                embed.addFields({ name: `/${name}`, value: description, ephemeral: true });

            } catch (error) {

            }
        }

        await interaction.reply({ embeds: [embed], ephemeral: true });
    },

};

function getAllCommandFiles(dirPath, arrayOfFiles) {
    files = fs.readdirSync(dirPath);
    arrayOfFiles = arrayOfFiles || [];

    files.forEach(function (file) {
        let filePath = path.join(dirPath, file);

        // Normalize the file path
        filePath = path.normalize(filePath);

        // Print the file path for verification
        // console.log("Checking:", filePath); 

        if (fs.statSync(filePath).isDirectory()) {
            arrayOfFiles = getAllCommandFiles(filePath, arrayOfFiles);
        } else {
            if (file.endsWith('.js')) {
                arrayOfFiles.push(filePath);
            }
        }
    });

    return arrayOfFiles;
}