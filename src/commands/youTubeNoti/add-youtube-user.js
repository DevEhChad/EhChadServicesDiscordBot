const { ApplicationCommandOptionType, Client, Interaction, PermissionFlagsBits } = require('discord.js');
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
            const YouTubeLink = interaction.options.getString('youtube-link');

            await interaction.deferReply({ ephmeral: true });

            const query = {
                guildId: interaction.guildId,
                youTubeId: YouTubeUser,
                youTubeLink: YouTubeLink,

            };

            //console.log(query); // Log the query to inspect the data

            const YouTubeUserExistInDb = await YouTubeUserSchema.exists(query);

            if (YouTubeUserExistInDb) {
                interaction.followUp({ content: 'This user has already been added to the live list for this server.', ephemeral: true });
                return;
            }

            const youTubeUser = new YouTubeUserSchema({
                ...query,
            });

            youTubeUser
                .save()
                .then(() => {
                    interaction.followUp({ content: `added ${YouTubeUser}: ${YouTubeLink} to the YouTube users.`, ephemeral: true });
                })
                .catch((error) => {
                    interaction.followUp({ content: 'Database Error. Please try again in a moment.', ephemeral: true });
                    console.log(`DB error in ${__filename}:\n`, error);
                });
            return;

        } catch (error) {
            console.log('Error', error);
        }
        return;
    },
    //deleted: true,
    name: 'add-youtube-user',
    description: 'Add YouTube User for notify',
    options: [
        {
            name: 'youtube-user',
            description: 'Add a YouTube User by username. **Not a link**',
            type: ApplicationCommandOptionType.String,
            required: true,
        },
        {
            name: 'youtube-link',
            description: "Please provide the channel share link.",
            type: ApplicationCommandOptionType.String,
            required: true,
        },
    ],
    permissionsRequired: [PermissionFlagsBits.Administrator],
    botPermissions: [PermissionFlagsBits.ManageRoles],
};