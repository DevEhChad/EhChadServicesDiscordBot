const 
{ 
    ApplicationCommandOptionType, 
    Client, 
    Interaction, 
    PermissionFlagsBits 
} = require('discord.js');

const TwitchUserSchema = require('../../schemas/TwitchUser');

module.exports = {

    /** 
      * 
      * @param {Client} client
      * @param {Interaction} interaction
    */
    
    callback: async ( client, interaction, ) => {
    try {
        const TwitchUser = interaction.options.getString('twitch-user');

        await interaction.deferReply({ ephemeral: true });

        const query = {
            guildId: interaction.guildId,
            twitchId: TwitchUser,
        };
   
        const twitchUserExistInDb = await TwitchUserSchema.exists(query);

        if(!twitchUserExistInDb) {
            interaction.followUp(`That user hasn't been added to the twitch users list.`);
            return;
        }

        TwitchUserSchema.findOneAndDelete(query)
        .then(() => {
            interaction.followUp(`Removed ${TwitchUser} from the Twitch Users list.`);
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
            name: 'remove-twitch-user',
            description: 'removes a twitch user from the twitch user list.',
            options: [
                {
                name: 'twitch-user',
                description: 'The user to remove.',
                type: ApplicationCommandOptionType.String,
                required: true,
                }
            ],
            permissionsRequired: [PermissionFlagsBits.Administrator],
            botPermissions: [PermissionFlagsBits.ManageChannels],

};