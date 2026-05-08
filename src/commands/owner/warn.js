import { EmbedBuilder } from "discord.js";
import { addWarning } from "../../utils/warnings.js";

export const name = "warn";
export const ownerOnly = true;
export const description = "Warns a user and records the warning in their modlog.";

/**
 * @param {import("discord.js").Message} message
 * @param {string[]} args
 */
export async function execute(message, args) {
  if (args.length < 2) {
    const usageEmbed = new EmbedBuilder()
      .setColor(0xf7140f)
      .setTitle("Correct Usage")
      .setDescription('`-warn <@user> <reason>`');
    await message.reply({ embeds: [usageEmbed] });
    return;
  }

  const userId = args[0].replace(/\D/g, "");
  const reason = args.slice(1).join(" ");

  if (!userId) {
    const usageEmbed = new EmbedBuilder()
      .setColor(0xf7140f)
      .setTitle("Correct Usage")
      .setDescription('`-warn <@user> <reason>`');
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

  const warnings = addWarning(userId, reason, message.author.id);

  const embed = new EmbedBuilder()
    .setColor(0xf7140f)
    .setAuthor({ name: user.username, iconURL: user.displayAvatarURL({ size: 64 }) })
    .setTitle("⚠️ Warning Issued")
    .addFields(
      { name: "User", value: `<@${userId}>`, inline: true },
      { name: "Moderator", value: `<@${message.author.id}>`, inline: true },
      { name: "Total Warnings", value: String(warnings.length), inline: true },
      { name: "Reason", value: reason }
    )
    .setTimestamp();

  await message.channel.send({ embeds: [embed] });
}
