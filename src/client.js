import { Client, GatewayIntentBits, Collection } from "discord.js";

const client = new Client({
  intents: [GatewayIntentBits.Guilds],
});

/**
 * Holds all registered slash commands, keyed by command name.
 * @type {Collection<string, import("./types.js").Command>}
 */
client.commands = new Collection();

export default client;
