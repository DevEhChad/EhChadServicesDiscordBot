# EhChadServices Discord Bot

EhChadServices' in-house Discord bot, built for the **Eh Brocord** community. It handles moderation, welcome/leave messages, auto-roles, a message-based leveling system, and live/upload notifications for Twitch, Kick, and YouTube — all through slash commands.

Built and maintained by DevEhChad as an ongoing project to build with the latest [discord.js](https://discord.js.org/) API.

## Features

**Moderation**
- `/ban`, `/kick`, `/timeout`, `/clear` — standard moderation with permission checks

**Onboarding**
- Auto-role on join (`/autorole-configure`, `/autorole-disable`)
- Welcome and leave messages (`/setup-welcome-channel`, `/setup-leave-channel`)
- `/simulate-join` / `/simulate-leave` to preview those messages without a real member event

**Leveling**
- Chat-based XP and levels, with a rendered rank card via [canvacord](https://github.com/canvacord/canvacord) (`/level`)

**Live & Upload Notifications**
- **Twitch** — go-live announcements, a "now live" role, and per-server config (`twitchNoti/`, `twitchCommands/`)
- **Kick** — go-live announcements via `kickNoti/` commands
- **YouTube** — new-upload and go-live announcements, bindable per channel (`youTubeNoti/`)

**Admin & Dev Tools**
- `/manage-toggles` — enable/disable individual commands or notifier services at runtime, and mark them dev-only, without a redeploy
- `/help`, `/ping`, `/invite` and other utility commands

## Tech Stack

- [discord.js](https://discord.js.org/) v14 — Discord API client
- [Mongoose](https://mongoosejs.com/) / MongoDB — persistence for configs, users, and notifier state
- [googleapis](https://github.com/googleapis/google-api-nodejs-client) — YouTube Data API v3
- [got-scraping](https://github.com/apify/got-scraping) — Twitch/Kick live-status polling
- [canvacord](https://github.com/canvacord/canvacord) — rank card image rendering
- [nodemon](https://nodemon.io/) — dev-time auto-restart

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) 18 or later
- A MongoDB database (e.g. [MongoDB Atlas](https://www.mongodb.com/atlas))
- A [Discord application/bot](https://discord.com/developers/applications) with a bot token
- Optional, only if you want those notifiers: a [Twitch developer app](https://dev.twitch.tv/console/apps) and a [YouTube Data API v3 key](https://console.cloud.google.com/apis/library/youtube.googleapis.com)

### Installation

```bash
git clone https://github.com/DevEhChad/EhChadServicesDiscordBot.git
cd EhChadServicesDiscordBot
npm install
```

### Configuration

The bot reads secrets from `.env` and server/runtime settings from `config.json`. Neither file is committed — copy the provided examples and fill in your own values:

```bash
cp .env.Example .env
cp config-example.json config.json
```

**`.env`**

| Variable | Required | Description |
|---|---|---|
| `TOKEN` | Yes | Discord bot token (Developer Portal → Bot) |
| `CLIENT_ID` | Yes | Discord application/client ID |
| `MONGODB_URI` | Yes | MongoDB connection string |
| `BOT_OWNER_ID` | No | Your Discord user ID, for owner-only commands |
| `TWITCH_CLIENT_ID` / `TWITCH_CLIENT_SECRET` | No | Enables Twitch live notifications |
| `YOUTUBE_API_KEY` | No | Enables YouTube upload and live notifications |
| `NODE_ENV` | No | `development` or `production` |

**`config.json`**

| Key | Description |
|---|---|
| `mainServer` | Guild ID where slash commands are registered |
| `clientId` | Bot's application/client ID (same as `CLIENT_ID`) |
| `devs` | Array of Discord user IDs with developer/owner permissions |
| `statusChannelId` | Channel for the bot's startup message (leave `""` to disable) |
| `disableKickNotifier` | Set `true` to fully disable the Kick live notifier |

Full field-by-field notes, including how to get each credential, are in `.env.Example`.

### Running

```bash
npm start      # runs via nodemon, auto-restarts on file changes
```

Slash commands are (re)registered automatically against `mainServer` every time the bot starts — there's no separate deploy step.

### Scripts

| Script | Description |
|---|---|
| `npm start` | Start the bot with nodemon |
| `npm test` / `npm run lint` | Syntax-check every file under `src/` |

## Project Structure

```
src/
├── main.js              # Entry point: client setup, DB connection, notifier bootstrap
├── commands/             # Slash commands, grouped by category
│   ├── admin/
│   ├── economy/
│   ├── kickNoti/
│   ├── misc/
│   ├── moderation/
│   ├── removeCommands/
│   ├── twitchCommands/
│   ├── twitchNoti/
│   └── youTubeNoti/
├── events/               # Discord client + custom notifier events
├── handlers/             # Event file loader
├── schemas/              # Mongoose models
└── utils/                # Command loading, registration helpers
```

## License

MIT — see `package.json`.
