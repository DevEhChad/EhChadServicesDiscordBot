const {
    ApplicationCommandOptionType,
    Client,
    Interaction,
    PermissionFlagsBits
} = require('discord.js');

const YouTubeUserSchema = require('../../schemas/YouTubeUser');

module.exports = {

    /** 
     * 
     * @param {Client} client
     * @param {Interaction} interaction
     */

    callback: async (client, interaction,) => {
        try {
            const YouTubeUser = interaction.options.getString('youtube-user');

            await interaction.deferReply({ ephemeral: true });

            const query = {
                guildId: interaction.guildId,
                youTubeId: YouTubeUser,
                // youTubeLink: youTubeLink,  // This seems to be unused, consider removing it
            };

            const youtubeUserExistInDb = await YouTubeUserSchema.exists(query);

            if (!youtubeUserExistInDb) {
                interaction.followUp({ content: `That user hasn't been added to the YouTube users list.`, ephemeral: true });
                return;
            }

            YouTubeUserSchema.findOneAndDelete(query)
                .then(() => {
                    interaction.followUp({ content: `Removed ${YouTubeUser} from the YouTube Users list.`, ephemeral: true });
                })
                .catch((error) => {
                    interaction.followUp({ content: 'Database error. Please try again in a moment.', ephemeral: true });
                    console.log(`DB error in ${__filename}:\n`, error);
                })
            return;
        } catch (error) {
            console.log(`Error in ${__filename}:\n`, error);
        }
        return;
    },
    deleted: true,
    name: 'remove-youtube-user',
    description: 'Removes a YouTube user from the YouTube user list.',
    options: [
        {
            name: 'youtube-user',
            description: 'The user to remove.',
            type: ApplicationCommandOptionType.String,
            required: true,
        }
    ],
    permissionsRequired: [PermissionFlagsBits.Administrator],
    botPermissions: [PermissionFlagsBits.ManageChannels],

};