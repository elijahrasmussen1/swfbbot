import { getVerifiedUserByRobloxUsername } from "../../db/mongo.js";

export const name = "gdc";
export const ownerOnly = true;
export const description = "Grabs the Discord information linked to a Roblox username.";

/**
 * @param {import("discord.js").Message} message
 * @param {string[]} args
 */
export async function execute(message, args) {
  const robloxUsername = args[0];

  if (!robloxUsername) {
    await message.reply("Usage: `-gdc <robloxUsername>`");
    return;
  }

  const record = await getVerifiedUserByRobloxUsername(robloxUsername);

  if (!record) {
    await message.reply("❌ No linked Discord account found for that Roblox username.");
    return;
  }

  const discordId = record.discordId;

  let discordUser;
  try {
    discordUser = await message.client.users.fetch(discordId);
  } catch {
    await message.reply("❌ Could not fetch the linked Discord user.");
    return;
  }

  const username = discordUser.username;
  const displayName = discordUser.globalName ?? discordUser.displayName ?? username;
  const profileUrl = `https://discord.com/users/${discordId}`;

  await message.channel.send(
    `Discord: ${discordId} | ${username} | ${displayName}\nNot loading? Click [here](${profileUrl}).`
  );
}
