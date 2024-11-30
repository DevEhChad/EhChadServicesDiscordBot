const { ApplicationCommandOptionType, Client, Interaction, PermissionFlagsBits } = require('discord.js');
const welcomeChannelSchema = require('../../schemas/WelcomeChannel');

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
   
        const channelExistInDb = await welcomeChannelSchema.exists(query);

        if(!channelExistInDb) {
            interaction.followUp('That channel has not been configured for welcome messages.');
            return;
        }

        welcomeChannelSchema.findOneAndDelete(query)
        .then(() => {
            interaction.followUp(`Removed ${targetChannel} from receiving welcome messages.`);
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
            name: 'remove-welcome-channel',
            description: 'removes a welcome channel from sending welcome messages.',
            options: [
                {
                name: 'target-channel',
                description: 'The channel to get remove welcome messages in.',
                type: ApplicationCommandOptionType.Channel,
                required: true,
                },
            ],
            permissionsRequired: [PermissionFlagsBits.ManageChannels],
            botPermissions: [PermissionFlagsBits.ManageChannels],

};