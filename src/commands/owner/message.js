export const name = "message";
export const ownerOnly = true;
export const description = "Sends a message to a specified channel as the bot.";

/**
 * @param {import("discord.js").Message} message
 * @param {string[]} args
 */
export async function execute(message, args) {
  const channelArg = args[0];

  if (!channelArg || args.length < 2) {
    await message.reply("Usage: `-message <#channel | channelId> <message text>`");
    return;
  }

  const channelId = channelArg.replace(/\D/g, "");
  const text = args.slice(1).join(" ");

  let channel;
  try {
    channel = await message.client.channels.fetch(channelId);
  } catch {
    await message.reply("❌ Could not find that channel.");
    return;
  }

  if (!channel?.isTextBased()) {
    await message.reply("❌ That channel is not a text channel.");
    return;
  }

  await channel.send(text);

  try {
    await message.delete();
  } catch {
    // Missing permissions to delete — silently ignore
  }
}
