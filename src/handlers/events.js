import { readdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath, pathToFileURL } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const EVENTS_DIR = join(__dirname, "..", "events");

/**
 * Loads every event module from the events directory and attaches it to the
 * Discord client.
 *
 * @param {import("discord.js").Client} client
 */
export async function loadEvents(client) {
  const files = readdirSync(EVENTS_DIR).filter((f) => f.endsWith(".js"));

  for (const file of files) {
    const filePath = pathToFileURL(join(EVENTS_DIR, file)).href;
    const event = await import(filePath);

    if (!event.name || !event.execute) {
      console.warn(
        `[Events] Skipping ${file}: missing "name" or "execute" export.`
      );
      continue;
    }

    if (event.once) {
      client.once(event.name, (...args) => event.execute(...args));
    } else {
      client.on(event.name, (...args) => event.execute(...args));
    }

    console.log(`[Events] Registered: ${event.name}`);
  }
}
