const { ApplicationCommandOptionType, Client, Interaction, PermissionFlagsBits } = require('discord.js');
const YouTubeChannelSchema = require('../../schemas/YouTubeChannel');

module.exports = {

    /** 
      * 
      * @param {Client} client
      * @param {Interaction} interaction
    */
    
    callback: async ( client, interaction, ) => {
    try {
        const targetChannel = interaction.options.getChannel('target-channel');

        await interaction.deferReply({ ephemeral: true });

        const query = {
            guildId: interaction.guildId,
            channelId: targetChannel.id,
        };
   
        const youTubeChannelExistInDb = await YouTubeChannelSchema.exists(query);

        if(!youTubeChannelExistInDb) {
            interaction.followUp('That channel has not been configured for YouTube upload messages.');
            return;
        }

        YouTubeChannelSchema.findOneAndDelete(query)
        .then(() => {
            interaction.followUp(`Removed ${targetChannel} from receiving YouTube upload messages.`);
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
            name: 'remove-youtube-channel',
            description: 'Removes a YouTube channel from sending upload messages.',
            options: [
                {
                name: 'target-channel',
                description: 'The channel to remove upload messages in.',
                type: ApplicationCommandOptionType.Channel,
                required: true,
                },
            ],
            permissionsRequired: [PermissionFlagsBits.ManageChannels],
            botPermissions: [PermissionFlagsBits.ManageChannels],

};