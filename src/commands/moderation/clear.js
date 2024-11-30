const { ApplicationCommandOptionType, Client, Interaction, PermissionFlagsBits } = require('discord.js');

module.exports = {
    callback: async (client, interaction) => {
        const amount = interaction.options.getString('number-of-messages');

        const numAmount = parseInt(amount);
        if (isNaN(numAmount) || numAmount < 1 || numAmount > 100) {
            return interaction.reply({
                content: 'Please specify a number between 1 and 100 for the number of messages to delete.',
                ephemeral: true, 
            });
        }

        try {
            const messages = await interaction.channel.messages.fetch({ limit: numAmount });

            // Calculate the date 14 days ago
            const twoWeeksAgo = new Date();
            twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

            // Separate messages into deletable and non-deletable
            const deletableMessages = messages.filter(msg => msg.createdAt > twoWeeksAgo);
            const nonDeletableMessages = messages.filter(msg => msg.createdAt <= twoWeeksAgo);

            // Combine the replies into a single response
            let replyContent = ""; 

            if (nonDeletableMessages.size > 0) {
                replyContent += `Some messages are older than 14 days and cannot be deleted. Only deleting the ${deletableMessages.size} messages that are within the 14-day limit.\n`;
            }

            if (deletableMessages.size > 0) {
                await interaction.channel.bulkDelete(deletableMessages);
                replyContent += `Successfully deleted ${deletableMessages.size} messages.`;
            } else { 
                replyContent += "No messages could be deleted. They might be older than 14 days.";
            }

            // Send a single reply with the combined content
            await interaction.reply({
                content: replyContent,
                ephemeral: true,
            });

        } catch (error) {
            console.error('Error deleting messages:', error);
            if (error.code === 50013) { 
                await interaction.reply({
                    content: 'I do not have permission to delete messages in this channel.',
                    ephemeral: true,
                });
            } else {
                await interaction.reply({
                    content: 'There was an error trying to delete messages.',
                    ephemeral: true,
                });
            }
        }
    },
    name: 'clear',
    description: 'Clears 1-100 messages within 14 days. In current channel',
    options: [
        {
            //deleted: true,
            name: 'number-of-messages',
            type: ApplicationCommandOptionType.String, 
            required: true,
            description: 'The number of messages to delete (1-100)'
        }
    ],
    permissionsRequired: [PermissionFlagsBits.ManageMessages],
    botPermissions: [PermissionFlagsBits.ManageMessages], 
};