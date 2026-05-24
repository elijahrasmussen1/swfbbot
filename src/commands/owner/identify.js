import { EmbedBuilder } from "discord.js";
import { identifyUser } from "../../db/mongo.js";

export const name = "identify";
export const ownerOnly = true;
export const description = "Adds a Discord user to the identify database with empty fields.";

/**
 * @param {import("discord.js").Message} message
 * @param {string[]} args
 */
export async function execute(message, args) {
  if (!args[0]) {
    await message.reply({
      embeds: [
        new EmbedBuilder()
          .setColor(0xf7140f)
          .setTitle("Correct Usage")
          .setDescription("`-identify <@mention | Discord ID>`"),
      ],
    });
    return;
  }

  const discordId = args[0].replace(/\D/g, "");

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

  let user;
  try {
    user = await message.client.users.fetch(discordId);
  } catch {
    await message.reply({
      embeds: [
        new EmbedBuilder()
          .setColor(0xf7140f)
          .setDescription("❌ Could not find a Discord user with that ID."),
      ],
    });
    return;
  }

  try {
    const doc = await identifyUser({
      discordId,
      discordUsername: user.username,
    });

    await message.reply({
      embeds: [
        new EmbedBuilder()
          .setColor(0x57f287)
          .setTitle("✅ User Identified")
          .setThumbnail(user.displayAvatarURL({ size: 128 }))
          .addFields(
            { name: "Discord Username", value: user.username, inline: true },
            { name: "Discord ID", value: discordId, inline: true },
            { name: "Roblox Username", value: doc?.robloxUsername ?? "N/A", inline: true },
            { name: "Roblox User ID", value: doc?.robloxUserId ?? "N/A", inline: true },
            { name: "Verified At", value: doc?.verifiedAt ?? "N/A", inline: true },
          )
          .setTimestamp(),
      ],
    });
  } catch (err) {
    console.error("[identify] DB error:", err);
    await message.reply({
      embeds: [
        new EmbedBuilder()
          .setColor(0xf7140f)
          .setDescription("❌ Failed to save user to the database."),
      ],
    });
  }
}
