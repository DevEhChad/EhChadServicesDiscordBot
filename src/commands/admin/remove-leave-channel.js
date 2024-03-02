const { ApplicationCommandOptionType, Client, Interaction, PermissionFlagsBits } = require('discord.js');
const leaveChannelSchema = require('../../schemas/LeaveChannel');

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
   
        const channelExistInDb = await leaveChannelSchema.exists(query);

        if(!channelExistInDb) {
            interaction.followUp('That channel has not been configured for leave messages.');
            return;
        }

        leaveChannelSchema.findOneAndDelete(query)
        .then(() => {
            interaction.followUp(`Removed ${targetChannel} from receiving leave messages.`);
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
            name: 'remove-leave-channel',
            description: 'removes a leave channel from sending leave messages.',
            options: [
                {
                name: 'target-channel',
                description: 'The channel to remove leave messages in.',
                type: ApplicationCommandOptionType.Channel,
                required: true,
                },
            ],
            permissionsRequired: [PermissionFlagsBits.Administrator],
            botPermissions: [PermissionFlagsBits.ManageChannels],

};