/**
 * Standalone script to register slash commands with Discord.
 *
 * Usage:
 *   node src/deploy-commands.js
 *
 * Set DISCORD_GUILD_ID to deploy to a single guild instantly (development).
 * Leave it empty to deploy globally (up to 1 hour propagation).
 */

import "dotenv/config";
import { REST, Routes } from "discord.js";
import { readdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath, pathToFileURL } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const COMMANDS_DIR = join(__dirname, "commands");

const commands = [];

const categories = readdirSync(COMMANDS_DIR);
for (const category of categories) {
  const files = readdirSync(join(COMMANDS_DIR, category)).filter((f) =>
    f.endsWith(".js")
  );

  for (const file of files) {
    const filePath = pathToFileURL(join(COMMANDS_DIR, category, file)).href;
    const command = await import(filePath);
    if (command.data) {
      commands.push(command.data.toJSON());
    }
  }
}

const rest = new REST().setToken(process.env.DISCORD_TOKEN);

const clientId = process.env.DISCORD_CLIENT_ID;
const guildId = process.env.DISCORD_GUILD_ID;

if (!clientId) {
  throw new Error("DISCORD_CLIENT_ID is not set in the environment.");
}

if (guildId) {
  await rest.put(Routes.applicationGuildCommands(clientId, guildId), {
    body: commands,
  });
  console.log(
    `Successfully registered ${commands.length} command(s) to guild ${guildId}.`
  );
} else {
  await rest.put(Routes.applicationCommands(clientId), { body: commands });
  console.log(
    `Successfully registered ${commands.length} command(s) globally.`
  );
}
