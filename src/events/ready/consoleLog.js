const { Activity, ActivityType } = require("discord.js");

let status = [
    {
        name: 'EhChadServices',
        type: ActivityType.Streaming,
        url: 'https://twitch.tv/ehchad'
    },
    {
        name: 'Watch EhChad Live!',
        type: ActivityType.Streaming,
        url: 'https://twitch.tv/ehchad'
    },
    {
        name: 'Follow EhChad on Twitch!',
        type: ActivityType.Streaming,
        url: 'https://twitch.tv/ehchad'
    },
    {
        name: '/help',
        type: ActivityType.Streaming,
        url: 'https://twitch.tv/ehchad'
    },
]


module.exports = (client) => {
    console.log(`✅ ${client.user.tag} is now online! ✅`);

    setInterval(() => {
        let random = Math.floor(Math.random() * status.length);
        client.user.setActivity(status[random]);
    }, 5000);
};