import { EmbedBuilder } from "discord.js";
import { getVerifiedUser, updateIdentifiedUserRoblox } from "../../db/mongo.js";
import axios from "axios";

export const name = "irb";
export const ownerOnly = true;
export const description = "Links a Roblox ID to an identified Discord user in the database.";

/**
 * Attempt to fetch the Roblox username for a given Roblox user ID.
 * @param {string} robloxUserId
 * @returns {Promise<string|null>}
 */
async function fetchRobloxUsername(robloxUserId) {
  try {
    const { data } = await axios.get(`https://users.roblox.com/v1/users/${robloxUserId}`);
    return data?.name ?? null;
  } catch {
    return null;
  }
}

/**
 * @param {import("discord.js").Message} message
 * @param {string[]} args
 */
export async function execute(message, args) {
  if (!args[0] || !args[1]) {
    await message.reply({
      embeds: [
        new EmbedBuilder()
          .setColor(0xf7140f)
          .setTitle("Correct Usage")
          .setDescription("`-irb <@mention | Discord ID> <robloxID>`"),
      ],
    });
    return;
  }

  const discordId = args[0].replace(/\D/g, "");
  const robloxUserId = args[1].replace(/\D/g, "");

  if (!discordId) {
    await message.reply({
      embeds: [
        new EmbedBuilder()
          .setColor(0xf7140f)
          .setDescription("❌ Invalid user mention or ID."),
      ],
    });
    return;
  }

  if (!robloxUserId) {
    await message.reply({
      embeds: [
        new EmbedBuilder()
          .setColor(0xf7140f)
          .setDescription("❌ Invalid Roblox ID."),
      ],
    });
    return;
  }

  const doc = await getVerifiedUser(discordId);

  if (!doc) {
    await message.reply({
      embeds: [
        new EmbedBuilder()
          .setColor(0xf7140f)
          .setDescription(
            "❌ No record found for that user.\nUse `-identify` first to add them to the database."
          ),
      ],
    });
    return;
  }

  // Try to fetch roblox username from Roblox API
  const robloxUsername = await fetchRobloxUsername(robloxUserId);

  try {
    await updateIdentifiedUserRoblox(discordId, robloxUserId, robloxUsername);

    await message.reply({
      embeds: [
        new EmbedBuilder()
          .setColor(0x57f287)
          .setTitle("✅ Roblox ID Linked")
          .setDescription(`Roblox ID \`${robloxUserId}\`${robloxUsername ? ` (${robloxUsername})` : ""} has been linked to this user.`)
          .setFooter({ text: `Today at ${new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })}` }),
      ],
    });
  } catch (err) {
    console.error("[irb] DB error:", err);
    await message.reply({
      embeds: [
        new EmbedBuilder()
          .setColor(0xf7140f)
          .setDescription("❌ Failed to update the Roblox information in the database."),
      ],
    });
  }
}
