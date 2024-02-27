module.exports = {
    //deleted: Boolean,
    name: 'ping',
    description: 'Pong!',
    //devOnly: Boolean,
    //testOnly: Boolen,
    //options: Object[],

    callback: (client, interaction) => {
        interaction.reply(`Pong! ${client.ws.ping}ms`)
    }
};