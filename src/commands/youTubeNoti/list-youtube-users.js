const { ApplicationCommandOptionType, Client, Interaction, PermissionFlagsBits } = require('discord.js');
const YouTubeUserSchema = require('../../schemas/YouTubeUser');

module.exports = {

    /** 
      * 
      * @param {Client} client
      * @param {Interaction} interaction
    */

    callback: async (client, interaction) => {
        // Query all YouTube users associated with the guild
        const youTubeUsers = await YouTubeUserSchema.find();

        await interaction.deferReply({ ephemeral: true });

        if (youTubeUsers.length === 0) {
            await interaction.followUp("No YouTube users found.");
            return;
        }

        // Collect all URLs with usernames and join them with newlines
        const youTubeInfo = youTubeUsers.map(user => `${user.youTubeId}: ${user.youTubeLink}`);


        await interaction.followUp({ content: `**All YouTube Users Added In This Server:**\n\n${youTubeInfo}`, ephemeral: true });
    },

    deleted: true,
    name: 'list-youtube-users',
    description: 'Lists all YouTube users added for notify in the server.',
    options: [],
    permissionsRequired: [PermissionFlagsBits.ManageChannels],
    botPermissions: [PermissionFlagsBits.ManageChannels],
};
