import { EmbedBuilder } from "discord.js";
import { gameUnbanUser } from "../../roblox/api.js";
import { addCase } from "../../utils/modlog.js";

export const name = "gub";
export const ownerOnly = true;
export const description = "Game-unbans a Roblox user from the game and logs it to modlog.";

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
          .setDescription("`-gub <robloxId> [reason]`"),
      ],
    });
    return;
  }

  const robloxUserId = args[0].replace(/\D/g, "");

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

  const reason = args.slice(1).join(" ") || "No reason provided.";

  try {
    await gameUnbanUser(robloxUserId, reason);
  } catch (err) {
    console.error("[gub] Roblox API error:", err?.response?.data ?? err);
    await message.reply({
      embeds: [
        new EmbedBuilder()
          .setColor(0xf7140f)
          .setDescription(
            `❌ Failed to game-unban Roblox user \`${robloxUserId}\`.\n` +
            `API error: \`${err?.response?.data?.message ?? err?.message ?? "Unknown error"}\``
          ),
      ],
    });
    return;
  }

  // Log to modlog (using robloxUserId since this is a game-level action, not a Discord action)
  addCase(robloxUserId, "gameunban", reason, message.author.id);

  await message.reply({
    embeds: [
      new EmbedBuilder()
        .setColor(0x57f287)
        .setTitle("✅ Game Unban Applied")
        .setDescription(
          `**Roblox ID:** \`${robloxUserId}\`\n` +
          `**Reason:** ${reason}`
        )
        .setTimestamp(),
    ],
  });
}
