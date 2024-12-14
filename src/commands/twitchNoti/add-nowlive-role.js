const { ApplicationCommandOptionType, Client, Interaction, PermissionFlagsBits } = require('discord.js');
const NowLiveRoleSchema = require('../../schemas/NowLiveRole');

module.exports = {
    /**
     * @param {Client} client
     * @param {Interaction} interaction
     */

    callback: async (client, interaction) => {
        try {
            const role = interaction.options.getRole('role');
            const guildId = interaction.guild.id;

            // Check if a role already exists for this guild
            const existingRole = await NowLiveRoleSchema.findOne({ guildId });

            if (existingRole) {
                // Update the existing role
                existingRole.NowLiveRoleId = role.id;
                await existingRole.save();
                interaction.reply({ content: `Now Live role updated to ${role}`, ephemeral: true });
            } else {
                // Create a new role entry
                const newRole = new NowLiveRoleSchema({
                    guildId,
                    NowLiveRoleId: role.id,
                });
                await newRole.save();
                interaction.reply({ content: `Now Live role set to ${role}`, ephemeral: true });
            }
        } catch (error) {
            console.log('Error', error);
            interaction.reply({ content: 'There was an error processing your request.', ephemeral: true });
        }
        return;
    },

    name: 'add-nowlive-role',
    description: 'Set the role to be given when someone goes Live.',
    options: [
        {
            name: 'role',
            description: 'The role to be given to users who are live.',
            type: ApplicationCommandOptionType.Role,
            required: true
        }
    ],
    permissionsRequired: [PermissionFlagsBits.Administrator],
    botPermissions: [PermissionFlagsBits.ManageRoles],
};