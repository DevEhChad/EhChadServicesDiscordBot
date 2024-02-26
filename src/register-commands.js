require('dotenv').config();
const { REST, Routes, ApplicationCommandOptionType } = require('discord.js');

const commands = [
  {
    name: 'add',
    description: "Adds two numbers.",
    options: [
        {
            name: 'first-number',
            description: 'The first number.',
            type: ApplicationCommandOptionType.Number,
            require: true,
            choices: [
                {
                    name: 'one',
                    value: 1,
                },

                {
                    name: 'two',
                    value: 2,
                },

                {
                    name: 'three',
                    value: 3,
                },
            ]
        },

        {
            name: 'second-number',
            description: 'The Second number.',
            type: ApplicationCommandOptionType.Number,
            require: true,
        },

    ]
  },
];

const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

(async () => {
    try {
        console.log('Registering slash commands...');

        await rest.put(
            Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
            { body: commands }
        )
        
        console.log('All Commands Registered')
    } catch (error) {
        console.log(`There was an error: ${error}`);
    }
})();