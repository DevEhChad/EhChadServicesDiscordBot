const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('clear')
        .setDescription('Clears 1-100 messages within 14 days. In current channel')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
        .addStringOption((option) =>
            option
                .setName('number-of-messages')
                .setDescription('The number of messages to delete (1-100)')
                .setRequired(true)
        ),

    async execute(interaction) {
        const amount = interaction.options.getString('number-of-messages');

        const numAmount = parseInt(amount);
        if (isNaN(numAmount) || numAmount < 1 || numAmount > 100) {
            return interaction.reply({
                content: 'Please specify a number between 1 and 100 for the number of messages to delete.',
                flags: MessageFlags.Ephemeral,
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
                flags: MessageFlags.Ephemeral,
            });

        } catch (error) {
            console.error('Error deleting messages:', error);
            if (error.code === 50013) {
                await interaction.reply({
                    content: 'I do not have permission to delete messages in this channel.',
                    flags: MessageFlags.Ephemeral,
                });
            } else {
                await interaction.reply({
                    content: 'There was an error trying to delete messages.',
                    flags: MessageFlags.Ephemeral,
                });
            }
        }
    },
    permissionsRequired: [PermissionFlagsBits.ManageMessages],
    botPermissions: [PermissionFlagsBits.ManageMessages],
};
