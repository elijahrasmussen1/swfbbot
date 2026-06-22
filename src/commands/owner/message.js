export const name = "message";
export const ownerOnly = true;
export const description = "Sends a message to a channel or DMs a user as the bot.";

/**
 * @param {import("discord.js").Message} message
 * @param {string[]} args
 */
export async function execute(message, args) {
  const target = args[0];

  if (!target || args.length < 2) {
    await message.reply("Usage: `-message <#channel | channelId | @user | userId> <message text>`");
    return;
  }

  const id = target.replace(/\D/g, "");
  const text = args.slice(1).join(" ");

  // Try to resolve as a channel first
  let channel;
  try {
    channel = await message.client.channels.fetch(id);
  } catch {
    channel = null;
  }

  if (channel) {
    if (!channel.isTextBased()) {
      await message.reply("❌ That channel is not a text channel.");
      return;
    }
    await channel.send(text);
  } else {
    // Fall back to DMing a user
    let user;
    try {
      user = await message.client.users.fetch(id);
    } catch {
      await message.reply("❌ Could not find a channel or user with that ID.");
      return;
    }

    try {
      await user.send(text);
    } catch {
      await message.reply("❌ Could not send a DM to that user (they may have DMs disabled).");
      return;
    }
  }

  try {
    await message.delete();
  } catch {
    // Missing permissions to delete — silently ignore
  }
}

