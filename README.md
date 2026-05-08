# swfbbot

Discord bot for **Survive Floods for Brainrots** (SWFB) on Roblox.  
Built with [discord.js v14](https://discord.js.org/) and the [Roblox Open Cloud API](https://create.roblox.com/docs/cloud/open-cloud).

---

## Requirements

- Node.js >= 18
- A Discord application + bot token — [Discord Developer Portal](https://discord.com/developers/applications)
- A Roblox Open Cloud API key — [Roblox Creator Dashboard](https://create.roblox.com/dashboard/credentials)

---

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Copy the environment template and fill in your values:
   ```bash
   cp .env.example .env
   ```

   | Variable              | Description                                              |
   |-----------------------|----------------------------------------------------------|
   | `DISCORD_TOKEN`       | Bot token from the Discord Developer Portal              |
   | `DISCORD_CLIENT_ID`   | Application (client) ID of your bot                     |
   | `DISCORD_GUILD_ID`    | Guild ID for instant dev command registration (optional) |
   | `ROBLOX_API_KEY`      | Open Cloud API key from the Roblox Creator Dashboard     |
   | `ROBLOX_UNIVERSE_ID`  | Universe ID of Survive Floods for Brainrots              |
   | `ROBLOX_PLACE_ID`     | Root place ID of Survive Floods for Brainrots            |

3. Register slash commands:
   ```bash
   npm run deploy-commands
   ```

4. Start the bot:
   ```bash
   npm start
   ```

   For development with auto-restart:
   ```bash
   npm run dev
   ```

---

## Project Structure

```
src/
  index.js               Entry point — loads handlers and logs in
  client.js              Discord client configuration
  deploy-commands.js     One-time script to register slash commands
  commands/
    utility/
      ping.js            Latency check
      gamestatus.js      Fetches live game info from Roblox
  events/
    ready.js             Fires once the bot is online
    interactionCreate.js Routes slash command interactions
  handlers/
    commands.js          Auto-loads all command modules
    events.js            Auto-loads all event modules
  roblox/
    api.js               Roblox Open Cloud API wrapper
```

---

## Roblox Open Cloud Permissions

When creating your API key on the Roblox Creator Dashboard, grant at minimum:

- **Read** on `universe-datastores` (DataStores)
- **Publish** on `universe-messaging-service` (MessagingService topics)
- **Read** on `universe` (universe metadata)
