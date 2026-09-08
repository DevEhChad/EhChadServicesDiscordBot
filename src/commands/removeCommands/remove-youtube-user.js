const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } = require('discord.js');

const YouTubeUserSchema = require('../../schemas/YouTubeUser');

module.exports = {

    data: new SlashCommandBuilder()
        .setName('remove-youtube-user')
        .setDescription('Removes a YouTube user from the YouTube user list.')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addStringOption((option) =>
            option
                .setName('youtube-user')
                .setDescription('The user to remove.')
                .setRequired(true)
        ),

    async execute(interaction) {
        try {
            const YouTubeUser = interaction.options.getString('youtube-user');

            await interaction.deferReply({ flags: MessageFlags.Ephemeral });

            const query = {
                guildId: interaction.guildId,
                youTubeId: YouTubeUser,
                // youTubeLink: youTubeLink,  // This seems to be unused, consider removing it
            };

            const youtubeUserExistInDb = await YouTubeUserSchema.exists(query);

            if (!youtubeUserExistInDb) {
                interaction.followUp({ content: `That user hasn't been added to the YouTube users list.`, flags: MessageFlags.Ephemeral });
                return;
            }

            YouTubeUserSchema.findOneAndDelete(query)
                .then(() => {
                    interaction.followUp({ content: `Removed ${YouTubeUser} from the YouTube Users list.`, flags: MessageFlags.Ephemeral });
                })
                .catch((error) => {
                    interaction.followUp({ content: 'Database error. Please try again in a moment.', flags: MessageFlags.Ephemeral });
                    console.log(`DB error in ${__filename}:\n`, error);
                })
            return;
        } catch (error) {
            console.log(`Error in ${__filename}:\n`, error);
        }
        return;
    },
    deleted: true,
    permissionsRequired: [PermissionFlagsBits.Administrator],
    botPermissions: [PermissionFlagsBits.ManageChannels],

};
