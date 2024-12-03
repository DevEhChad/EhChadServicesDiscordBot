const
    {
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
                youTubeLink: youTubeLink,
            };

            const youtubeUserExistInDb = await YouTubeUserSchema.exists(query);

            if (!youtubeUserExistInDb) {
                interaction.followUp(`That user hasn't been added to the YouTube users list.`);
                return;
            }

            YouTubeUserSchema.findOneAndDelete(query)
                .then(() => {
                    interaction.followUp(`Removed ${YouTubeUser} from the YouTube Users list.`);
                })
                .catch((error) => {
                    interaction.followUp('Database error. Please try again in a moment.');
                    console.log(`DB error in ${__filename}:\n`, error);
                })
            return;
        } catch (error) {
            console.log(`Error in ${__filename}:\n`, error);
        }
        return;
    },
    //deleted: true,
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