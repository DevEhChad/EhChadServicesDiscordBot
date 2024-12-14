const { ApplicationCommandOptionType, Client, Interaction, PermissionFlagsBits } = require('discord.js');
const NowLiveRoleSchema = require('../../schemas/NowLiveRole');

module.exports = {
    /**
     * @param {Client} client
     * @param {Interaction} interaction
     */
    callback: async (client, interaction) => {
        try {
            const guildId = interaction.guild.id;

            const existingRole = await NowLiveRoleSchema.findOne({ guildId });

            if (!existingRole) {
                interaction.reply({ content: 'No Now Live role has been set for this server.', ephemeral: true });
                return; // Important: Stop execution if no role is found
            }

            await NowLiveRoleSchema.deleteOne({ guildId }); // Directly delete the document

            interaction.reply({ content: 'Now Live role has been removed.', ephemeral: true });
        } catch (error) {
            console.log('Error removing Now Live role:', error);
            interaction.reply({ content: 'There was an error removing the Now Live role.', ephemeral: true });
        }
    },

    name: 'remove-nowlive-role',
    description: 'Removes the configured Now Live role for this server.',
    permissionsRequired: [PermissionFlagsBits.Administrator],
};