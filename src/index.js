import "dotenv/config";
import client from "./client.js";
import { loadCommands } from "./handlers/commands.js";
import { loadEvents } from "./handlers/events.js";
import { connectMongo } from "./db/mongo.js";

await connectMongo();

await loadCommands(client);
await loadEvents(client);

await client.login(process.env.DISCORD_TOKEN);
