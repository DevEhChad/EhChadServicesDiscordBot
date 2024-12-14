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
 
    client.emit('guildMemberAdd', member);
 
    interaction.reply(`Simulated join! for ${member.user.tag}`);
} catch(error) {
    console.log(error)
}        
return; 
},

    //devOnly: true,
    name: 'simulate-join',
    description: 'Simulates a member joining.',
    options: [
        {
            name: 'target-user',
            description: 'The user you want to emulate joining',
            type: ApplicationCommandOptionType.User,
        },
    ],
    permissionsRequired: [PermissionFlagsBits.Administrator],
    botPermissions: [PermissionFlagsBits.Administrator],
};
 