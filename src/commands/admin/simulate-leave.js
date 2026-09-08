const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('simulate-leave')
        .setDescription('Simulates a member leaving.')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addUserOption((opt) =>
            opt.setName('target-user').setDescription('The user you want to emulate leaving')
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

            interaction.client.emit('guildMemberRemove', member);

            interaction.reply(`Simulated leave! for ${member.user.tag}`);
        } catch (error) {
            console.log(error)
        }
        return;
    },

    permissionsRequired: [PermissionFlagsBits.Administrator],
    botPermissions: [PermissionFlagsBits.Administrator],
};
