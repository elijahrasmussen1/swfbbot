export const name = "ping";
export const description = "Checks the bot response time.";

/**
 * @param {import("discord.js").Message} message
 * @param {string[]} _args
 */
export async function execute(message, _args) {
  const sent = await message.channel.send("Pinging...");

  const roundtrip = sent.createdTimestamp - message.createdTimestamp;
  const heartbeat = Math.round(message.client.ws.ping);

  await sent.edit(
    `Pong. Roundtrip: ${roundtrip}ms | WebSocket heartbeat: ${heartbeat}ms`
  );
}
