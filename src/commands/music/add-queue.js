const { ApplicationCommandOptionType, Client, Interaction, PermissionFlagsBits } = require('discord.js');
const SongQueueSchema = require('../../schemas/SongQueue');

module.exports = {
    callback: async (client, interaction) => {
        try {
            await interaction.deferReply(); // Acknowledge the interaction immediately

            const songUrl = interaction.options.getString('song-url');
            const guildId = interaction.guild.id;

            // Fetch the existing queue or create a new one if it doesn't exist
            let songQueue = await SongQueueSchema.findOne({ guildId });
            if (!songQueue) {
                songQueue = new SongQueueSchema({ guildId, queue: [] });
            }

            // Add the song to the queue
            songQueue.queue.push(songUrl);
            await songQueue.save();

            await interaction.editReply(`Added to queue: ${songUrl}`);

        } catch (error) {
            console.error('Error adding to queue:', error);
            await interaction.editReply('An error occurred while adding to the queue.');
        }

    },
    deleted: true,
    devOnly: true,
    name: 'add-queue',
    description: 'Adds a song to the play queue',
    options: [
        {
            name: 'song-url',
            type: ApplicationCommandOptionType.String,
            required: true,
            description: 'The song url'
        }
    ],
    permissionsRequired: [PermissionFlagsBits.Administrator],
    botPermissions: [PermissionFlagsBits.ManageMessages],
};