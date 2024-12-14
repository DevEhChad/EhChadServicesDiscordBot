const { ApplicationCommandOptionType, Client, Interaction, PermissionFlagsBits } = require('discord.js');

    /** 
      * 
      * @param {Client} client
      * @param {Interaction} interaction
    */

module.exports = {
    callback: async (client, interaction,) => {
    try {  
    const targetUser = interaction.options.getUser('target-user');
 
    let member;
 
    if (targetUser) {
        member =
            interaction.guild.members.cache.get(targetUser.id) ||
            (await interaction.guild.members.fetch(targetUser.id));
    } else {
        member = interaction.member;
    }
 
    client.emit('guildMemberRemove', member);
 
    interaction.reply(`Simulated leave! for ${member.user.tag}`);
} catch(error) {
    console.log(error)
}        
return; 
},

    //devOnly: true,
    name: 'simulate-leave',
    description: 'Simulates a member leaving.',
    options: [
        {
            name: 'target-user',
            description: 'The user you want to emulate leaving',
            type: ApplicationCommandOptionType.User,
        },
    ],
    permissionsRequired: [PermissionFlagsBits.Administrator],
    botPermissions: [PermissionFlagsBits.Administrator],
};
 