import "dotenv/config";
import client from "./client.js";
import { loadCommands } from "./handlers/commands.js";
import { loadEvents } from "./handlers/events.js";

await loadCommands(client);
await loadEvents(client);

await client.login(process.env.DISCORD_TOKEN);
