import { readdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath, pathToFileURL } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const COMMANDS_DIR = join(__dirname, "..", "commands");

/**
 * Recursively walks the commands directory and registers every exported
 * command module onto `client.commands`.
 *
 * @param {import("discord.js").Client} client
 */
export async function loadCommands(client) {
  const categories = readdirSync(COMMANDS_DIR);

  for (const category of categories) {
    const files = readdirSync(join(COMMANDS_DIR, category)).filter((f) =>
      f.endsWith(".js")
    );

    for (const file of files) {
      const filePath = pathToFileURL(
        join(COMMANDS_DIR, category, file)
      ).href;
      const command = await import(filePath);

      if (!command.data || !command.execute) {
        console.warn(
          `[Commands] Skipping ${file}: missing "data" or "execute" export.`
        );
        continue;
      }

      client.commands.set(command.data.name, command);
      console.log(`[Commands] Registered: ${command.data.name}`);
    }
  }
}
