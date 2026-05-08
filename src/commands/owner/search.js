import { EmbedBuilder } from "discord.js";
import { getCases } from "../../utils/modlog.js";

export const name = "search";
export const ownerOnly = true;
export const description = "Searches a user's modlog cases by Discord user ID.";

const CASES_PER_PAGE = 5;

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
      .setDescription("`-search <userId> [page]`");
    await message.reply({ embeds: [usageEmbed] });
    return;
  }

  let user;
  try {
    user = await message.client.users.fetch(userId);
  } catch {
    await message.reply({
      embeds: [
        new EmbedBuilder()
          .setColor(0xf7140f)
          .setDescription("❌ Could not find a user with that ID."),
      ],
    });
    return;
  }

  const cases = getCases(userId);
  const totalPages = Math.max(1, Math.ceil(cases.length / CASES_PER_PAGE));
  const requestedPage = Math.max(1, parseInt(args[1] ?? "1", 10) || 1);
  const page = Math.min(requestedPage, totalPages);
  const start = (page - 1) * CASES_PER_PAGE;
  const pageCases = cases.slice(start, start + CASES_PER_PAGE);

  const embed = new EmbedBuilder()
    .setColor(0xf7140f)
    .setAuthor({ name: user.username, iconURL: user.displayAvatarURL({ size: 64 }) })
    .setThumbnail(user.displayAvatarURL({ size: 256 }));

  if (cases.length === 0) {
    embed.setDescription("No modlogs found for this user.");
  } else {
    const lines = pageCases.map((c) => `**Case #${c.caseId}** - ${c.type}\n${c.reason}`);
    embed
      .setDescription(lines.join("\n\n"))
      .setFooter({ text: `Page ${page}/${totalPages} | Results: ${cases.length}` });
  }

  await message.channel.send({ embeds: [embed] });
}
