import { EmbedBuilder } from "discord.js";
import { getWarnings } from "../../utils/warnings.js";

export const name = "search";
export const ownerOnly = true;
export const description = "Searches a user's modlogs by Discord user ID.";

/**
 * @param {import("discord.js").Message} message
 * @param {string[]} args
 */
export async function execute(message, args) {
  const userId = args[0]?.replace(/\D/g, "");

  if (!userId) {
    const usageEmbed = new EmbedBuilder()
      .setColor(0xf7140f)
      .setTitle("Correct Usage")
      .setDescription('`-search <userId>`');
    await message.reply({ embeds: [usageEmbed] });
    return;
  }

  let user;
  try {
    user = await message.client.users.fetch(userId);
  } catch {
    const embed = new EmbedBuilder()
      .setColor(0xf7140f)
      .setDescription("❌ Could not find a user with that ID.");
    await message.reply({ embeds: [embed] });
    return;
  }

  const warnings = getWarnings(userId);

  const embed = new EmbedBuilder()
    .setColor(0xf7140f)
    .setAuthor({ name: user.username, iconURL: user.displayAvatarURL({ size: 64 }) })
    .setThumbnail(user.displayAvatarURL({ size: 256 }));

  if (warnings.length === 0) {
    embed.setDescription("No modlogs found for this user.");
  } else {
    const lines = warnings.map(
      (w, i) =>
        `**${i + 1}.** ${w.reason} — <t:${Math.floor(new Date(w.timestamp).getTime() / 1000)}:R> by <@${w.moderatorId}>`
    );
    embed
      .setTitle(`Modlogs — ${warnings.length} warning${warnings.length === 1 ? "" : "s"}`)
      .setDescription(lines.join("\n"));
  }

  await message.channel.send({ embeds: [embed] });
}
