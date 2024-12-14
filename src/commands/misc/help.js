const { Client, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const fs = require('fs');
const path = require('path');

/**
 * @param {Client} client
 * @param {Interaction} interaction
 */

module.exports = {
    name: 'help',
    description: 'Provides a list of all commands and their descriptions.',

    callback: async (client, interaction) => {
        const commandsPath = path.join(__dirname, "..", "..", "commands/");
        const commandFiles = getAllCommandFiles(commandsPath);

        const commandsPerPage = 20;
        const numPages = Math.ceil(commandFiles.length / commandsPerPage);
        let currentPage = 1;

        const generateEmbed = (page) => {
            const embed = new EmbedBuilder()
                .setColor(0x0099FF)
                .setTitle(`Available Commands (Page ${page}/${numPages})`)
                .setDescription(`Use the buttons below to navigate.`);

            let commandIndex = (page - 1) * commandsPerPage + 1;
            let commandsAdded = 0;
            let processedCommands = 0;

            while (commandsAdded < commandsPerPage && processedCommands < commandFiles.length) {
                const fileIndex = (page - 1) * commandsPerPage + processedCommands;
                if (fileIndex >= commandFiles.length) break;

                try {
                    const file = commandFiles[fileIndex];
                    const fileContent = fs.readFileSync(file, 'utf-8');
                    const deletedMatch = fileContent.match(/^\s*deleted:\s*true\s*,?$/m);

                    if (deletedMatch) {
                        processedCommands++;
                        continue;
                    }

                    const nameMatch = fileContent.match(/name: '(.+?)'/);
                    const descriptionMatch = fileContent.match(/description: '(.+?)'/);

                    const name = nameMatch ? nameMatch[1] : 'Unknown name';
                    const description = descriptionMatch ? descriptionMatch[1] : 'Unknown description';

                    if (name !== 'Unknown name' && description !== 'Unknown description') {
                        embed.addFields({ name: `${commandIndex}. /${name}`, value: description });
                        commandIndex++;
                        commandsAdded++;
                    } else {
                        console.warn(`Could not parse name or description in file: ${file}`);
                    }
                } catch (error) {
                    console.error(`Error with file ${file}:`, error);
                }
                processedCommands++;
            }
            if (commandsAdded === 0 && page !== 1 && numPages !== 0) {
                return generateEmbed(page - 1);
            }
            return embed;
        };

        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('prev_page')
                    .setLabel('Previous')
                    .setStyle(ButtonStyle.Primary)
                    .setDisabled(currentPage === 1),
                new ButtonBuilder()
                    .setCustomId('next_page')
                    .setLabel('Next')
                    .setStyle(ButtonStyle.Primary)
                    .setDisabled(currentPage === numPages || numPages === 0),
            );

        const message = await interaction.reply({ embeds: [generateEmbed(currentPage)], components: [row], ephemeral: true, fetchReply: true });

        const collector = message.createMessageComponentCollector({ time: 60000 });

        collector.on('collect', async i => {
            if (i.user.id !== interaction.user.id) {
                return i.reply({ content: "You can't use these buttons!", ephemeral: true });
            }

            if (i.customId === 'prev_page' && currentPage > 1) {
                currentPage--;
            } else if (i.customId === 'next_page' && currentPage < numPages) {
                currentPage++;
            }

            row.components[0].setDisabled(currentPage === 1);
            row.components[1].setDisabled(currentPage === numPages || numPages === 0);

            await i.update({ embeds: [generateEmbed(currentPage)], components: [row] });
        });

        collector.on('end', collected => {
            if (collected.size === 0) {
                message.edit({ components: [] }).catch(console.error);
            }
        });
    },
};

function getAllCommandFiles(dirPath, arrayOfFiles) {
    files = fs.readdirSync(dirPath);
    arrayOfFiles = arrayOfFiles || [];

    files.forEach(function (file) {
        let filePath = path.join(dirPath, file);
        filePath = path.normalize(filePath);

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