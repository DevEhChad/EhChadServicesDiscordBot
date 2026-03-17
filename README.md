# EhChadServicesDiscordBot

Lightweight Discord bot used as a development playground for EhChadServices. Built on discord.js v14, this project contains moderation, notification, and utility features used on the "Eh Brocord" community server.

## Features
- Command-based moderation (ban, kick, timeout, clear)
- Welcome / leave messages and autorole handling
- Twitch / YouTube live/ upload notifications
- XP / leveling system
- Configurable notification channels and roles

## Prerequisites
- Node.js 16+ (Node 18 recommended)
- npm (or yarn)
- A MongoDB instance (cloud or local) for persistence
- A Discord bot token and the bot added to your server

## Quick Start
1. Clone the repository

   git clone https://github.com/DevEhChad/EhChadServicesDiscordBot.git
   cd EhChadServicesDiscordBot

2. Install dependencies

   npm install

3. Create environment file

   Copy `.env.example` or create a `.env` file in the project root with the following variables (create the file if it does not exist):

   TOKEN=your_discord_bot_token
   MONGODB_URI=your_mongodb_connection_string

   Note: This project uses `dotenv` and expects `process.env.TOKEN` and `process.env.MONGODB_URI` (see `src/main.js`).

4. (Optional) Review `config-example.json`

   There is a small JSON example at [config-example.json](config-example.json). You can copy it to `config.json` and fill values used by some utilities, but the bot's primary secrets are provided via `.env`.

5. Start the bot

   Run directly with Node:

   node src/main.js

   Or using nodemon for development:

   npx nodemon src/main.js

   Note: the repository's `package.json` currently has a `start` script set to `nodemon main.js`. To use `npm start` as-is you can update the script to `nodemon src/main.js`.

## Configuration
- `src/main.js` reads environment variables using `dotenv`. Required variables:
  - `TOKEN` — your Discord bot token
  - `MONGODB_URI` — MongoDB connection string (optional but required for DB features)

- `config-example.json` shows other non-secret settings (server IDs, developer IDs, toggles). Copy and modify as needed.

## Development notes
- Entry point: `src/main.js`
- Command handlers and event handlers are inside `src/commands` and `src/events`
- Database schemas live in `src/schemas`

## Troubleshooting
- If you see authentication errors, verify your `TOKEN` in `.env`.
- If database connection fails, verify `MONGODB_URI` and that your MongoDB instance allows connections.
- If `npm start` doesn't run the bot, run `node src/main.js` or update the `start` script in `package.json`.
