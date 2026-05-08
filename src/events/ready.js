import { Events } from "discord.js";

export const name = Events.ClientReady;
export const once = true;

/**
 * Fires once when the Discord client has successfully established a connection
 * and is ready to process events.
 *
 * @param {import("discord.js").Client} client
 */
export function execute(client) {
  console.log(`[Ready] Logged in as ${client.user.tag}`);
}
