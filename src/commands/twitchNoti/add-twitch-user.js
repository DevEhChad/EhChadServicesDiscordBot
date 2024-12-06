const { ApplicationCommandOptionType, Client, Interaction, PermissionFlagsBits } = require('discord.js');
const TwitchUserSchema = require('../../schemas/TwitchUser');

module.exports = {

    /** 
     * 
     * @param {Client} client
     * @param {Interaction} interaction
     */

    callback: async (client, interaction,) => {
        try {
            const TwitchUser = interaction.options.getString('twitch-user');

            await interaction.deferReply({ ephemeral: true });  // Corrected spelling of 'ephemeral'

            const query = {
                guildId: interaction.guildId,
                twitchId: TwitchUser,
            };

            const TwitchUserExistInDb = await TwitchUserSchema.exists(query);

            if (TwitchUserExistInDb) {
                interaction.followUp({ content: 'This user has already been added to the live list for this server.', ephemeral: true }); // Ephemeral added
                return;
            }

            const twitchUser = new TwitchUserSchema({
                ...query,
            });

            twitchUser
                .save()
                .then(() => {
                    interaction.followUp({ content: `added ${TwitchUser} to the twitch users.`, ephemeral: true }); // Ephemeral added
                })
                .catch((error) => {
                    interaction.followUp({ content: 'Database Error. Please try again in a moment.', ephemeral: true }); // Ephemeral added
                    console.log(`DB error in ${__filename}:\n`, error);
                });
            return;

        } catch (error) {
            console.log('Error', error);
        }
        return;
    },
    //deleted: true,
    name: 'add-twitch-user',
    description: 'Add Twitch User to get live notifications from.',
    options: [
        {
            name: 'twitch-user',
            description: 'Add a Twitch User by username. **Not a link**',
            type: ApplicationCommandOptionType.String,
            required: true
        }
    ],
    permissionsRequired: [PermissionFlagsBits.Administrator],
    botPermissions: [PermissionFlagsBits.ManageRoles],

};