const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('simulate-join')
        .setDescription('Simulates a member joining.')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addUserOption((opt) =>
            opt.setName('target-user').setDescription('The user you want to emulate joining')
        ),

    //devOnly: true,
    async execute(interaction) {
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

            interaction.client.emit('guildMemberAdd', member);

            interaction.reply(`Simulated join! for ${member.user.tag}`);
        } catch (error) {
            console.log(error)
        }
        return;
    },

    permissionsRequired: [PermissionFlagsBits.Administrator],
    botPermissions: [PermissionFlagsBits.Administrator],
};
