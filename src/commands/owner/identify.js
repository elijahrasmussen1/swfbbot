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
          .setTitle("✅ Identified")
          .setDescription("This user has been added to the database.")
          .addFields(
            { name: "Roblox ID", value: doc?.robloxUserId ?? "N/A", inline: true },
          )
          .setFooter({ text: `Today at ${new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })}` }),
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
