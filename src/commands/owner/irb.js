import { EmbedBuilder } from "discord.js";
import { getVerifiedUser } from "../../db/mongo.js";

export const name = "irb";
export const ownerOnly = true;
export const description = "Looks up the Roblox account linked to an identified Discord user.";

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
          .setDescription("`-irb <@mention | Discord ID>`"),
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
    user = null;
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

  const robloxUsername = doc.robloxUsername ?? "N/A";
  const robloxUserId = doc.robloxUserId ?? "N/A";
  const verifiedAt = doc.verifiedAt ?? "N/A";
  const alts = doc.alts?.length ? doc.alts.join(", ") : "None";

  const embed = new EmbedBuilder()
    .setColor(0x0a84ff)
    .setTitle("Identify Roblox — Lookup")
    .addFields(
      { name: "Discord Username", value: user?.username ?? doc.discordUsername ?? "N/A", inline: true },
      { name: "Discord ID", value: discordId, inline: true },
      { name: "\u200b", value: "\u200b", inline: true },
      { name: "Roblox Username", value: robloxUsername, inline: true },
      { name: "Roblox User ID", value: String(robloxUserId), inline: true },
      { name: "Verified At", value: verifiedAt, inline: true },
      { name: "Alts", value: alts, inline: false },
    )
    .setTimestamp();

  if (user) {
    embed.setThumbnail(user.displayAvatarURL({ size: 128 }));
  }

  await message.channel.send({ embeds: [embed] });
}
