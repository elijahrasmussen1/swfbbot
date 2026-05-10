import { getVerifiedUser } from "../../db/mongo.js";

export const name = "grb";
export const ownerOnly = true;
export const description = "Grabs the Roblox information linked to a Discord user.";

/**
 * @param {import("discord.js").Message} message
 * @param {string[]} args
 */
export async function execute(message, args) {
  const userId = args[0]?.replace(/\D/g, "");

  if (!userId) {
    await message.reply("Usage: `-grb <@user | userId>`");
    return;
  }

  let discordUser;
  try {
    discordUser = await message.client.users.fetch(userId);
  } catch {
    await message.reply("❌ Could not find a Discord user with that ID.");
    return;
  }

  const record = await getVerifiedUser(discordUser.id);

  if (!record) {
    await message.reply("❌ This user has no linked Roblox account.");
    return;
  }

  const robloxUsername = record.robloxUsername ?? "Unknown";
  const robloxId = record.robloxUserId ?? record.robloxId ?? "unknown";
  const profileUrl = `https://www.roblox.com/users/${robloxId}/profile`;

  await message.channel.send(
    `Roblox: ${robloxUsername} | ${robloxId} | ${profileUrl}`
  );
}
