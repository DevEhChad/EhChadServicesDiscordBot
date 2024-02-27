const {devs, testServer} = require('../../../config.json');
const getLocalCommands = require('../../utils/getLocalCommands');


module.exports = async (client, interaction) => {
    if (!interaction.isChatInputCommand()) return;

    const localCommands = getLocalCommands();

    try {
        const commandObject = localCommands.find((cmd) => cmd.name === interaction.commandName
        );

        if (!commandObject) return;

        if (commandObject.devOnly) {
            if (!devs.includes(interaction.member.id)) {
                interaction.reply({
                    content: 'Only developers of this bot can use this command.',
                    ephemeral: true,
                });
                return;
            } 
        }

        if (commandObject.testOnly) {
            if (!(interaction.member.id === testServer)) {
                interaction.reply({
                    content: 'This Command cannot be ran in this server.',
                    ephemeral: true,
                });
                return;
            }
        }

        if (commandObject.permissionsRequired?.length) {
            for (const permission of commandObject.permissionsRequired) {
                if (!interaction.member.permission.has(permission)) {
                    interaction.reply({
                        content: 'Dont have the permissions.',
                        ephemeral: true,
                    });
                    return;
                }
            }
        }

        if (commandObject.botPermissions?.length) {
            for (const permission of commandObject.botPermissions) {
                const bot = interaction.guild.members.me;

                if (!bot.permissions.has(permission)) {
                    interaction.reply({
                        content: "Bot doesn't have the correct permissions for this command.",
                        ephemeral: true,
                    });
                    break;
                }
            }
        }

    await commandObject.callback(client, interaction);
    } catch (error) {
        console.log(`There was an error running this command: ${error}`);
    }
};