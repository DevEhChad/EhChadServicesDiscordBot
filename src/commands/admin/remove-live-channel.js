const { ApplicationCommandOptionType, Client, Interaction, PermissionFlagsBits } = require('discord.js');
const NowLiveSchema = require('../../schemas/NowLiveChannel');

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
   
        const channelExistInDb = await NowLiveSchema.exists(query);

        if(!channelExistInDb) {
            interaction.followUp('That channel has not been configured for live messages.');
            return;
        }

        NowLiveSchema.findOneAndDelete(query)
        .then(() => {
            interaction.followUp(`Removed ${targetChannel} from receiving live messages.`);
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
            name: 'remove-live-channel',
            description: 'removes a live channel from sending live messages.',
            options: [
                {
                name: 'target-channel',
                description: 'The channel to remove live messages in.',
                type: ApplicationCommandOptionType.Channel,
                required: true,
                },
            ],
            permissionsRequired: [PermissionFlagsBits.Administrator],
            botPermissions: [PermissionFlagsBits.ManageChannels],

};