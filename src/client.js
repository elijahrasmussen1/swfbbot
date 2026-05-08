import { Client, GatewayIntentBits, Collection } from "discord.js";

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

/**
 * Holds all registered prefix commands, keyed by command name.
 * @type {Collection<string, object>}
 */
client.commands = new Collection();

export default client;
