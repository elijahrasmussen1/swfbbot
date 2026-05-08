import { Events } from "discord.js";

const PREFIX = process.env.PREFIX ?? "-";
const OWNER_IDS = (process.env.OWNER_IDS ?? "").split(",").map((id) => id.trim()).filter(Boolean);

export const name = Events.MessageCreate;
export const once = false;

/**
 * Parses incoming messages and routes them to the matching prefix command.
 *
 * @param {import("discord.js").Message} message
 */
export async function execute(message) {
  if (message.author.bot) return;
  if (!message.content.startsWith(PREFIX)) return;

  const args = message.content.slice(PREFIX.length).trim().split(/\s+/);
  const commandName = args.shift().toLowerCase();

  if (!commandName) return;

  const command = message.client.commands.get(commandName);

  if (!command) return;

  if (command.ownerOnly && !OWNER_IDS.includes(message.author.id)) {
    await message.reply("You do not have permission to use this command.");
    return;
  }

  try {
    await command.execute(message, args);
  } catch (error) {
    console.error(`[MessageCreate] Error executing "${commandName}":`, error);
    await message.reply("An error occurred while executing that command.");
  }
}
