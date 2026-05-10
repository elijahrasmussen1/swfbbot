import { EmbedBuilder } from "discord.js";
import { getVerifiedUser } from "../../db/mongo.js";
import { gameBanUser } from "../../roblox/api.js";

export const name = "gb";
export const ownerOnly = true;
export const description = "Game-bans a Roblox user from the game.";

/**
 * Resolve the input argument to a numeric Roblox user ID string.
 * Accepts:
 *   - Discord mention  (<@123...> / <@!123...>) → DB lookup → robloxUserId
 *   - Discord ID       (≥ 17 digits)             → DB lookup → robloxUserId
 *   - Roblox ID        (< 17 digits)             → used directly
 *
 * Returns null if the input is invalid or the DB record has no Roblox ID.
 *
 * @param {string} arg
 * @returns {Promise<{ robloxUserId: string, source: "roblox" | "discord" } | null>}
 */
async function resolveRobloxId(arg) {
  if (!arg) return null;

  // Strip Discord mention syntax
  const isMention = /^<@!?\d+>$/.test(arg);
  const digits = arg.replace(/\D/g, "");

  if (!digits) return null;

  // If it came from a mention, or looks like a Discord snowflake (≥ 17 digits),
  // try to resolve via the database first.
  if (isMention || digits.length >= 17) {
    const record = await getVerifiedUser(digits);
    if (!record) return null;
    const robloxUserId = record.robloxUserId ?? record.robloxId ?? null;
    if (!robloxUserId) return null;
    return { robloxUserId: String(robloxUserId), source: "discord" };
  }

  // Short digit string — treat as a Roblox user ID directly.
  return { robloxUserId: digits, source: "roblox" };
}

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
          .setDescription("`-gb <@mention | Discord ID | Roblox ID> [reason]`"),
      ],
    });
    return;
  }

  const resolved = await resolveRobloxId(args[0]);

  if (!resolved) {
    await message.reply({
      embeds: [
        new EmbedBuilder()
          .setColor(0xf7140f)
          .setDescription(
            "❌ Could not resolve a Roblox user ID from that input.\n" +
            "If you provided a Discord user, they may not be verified in the database."
          ),
      ],
    });
    return;
  }

  const reason = args.slice(1).join(" ") || "No reason provided.";

  try {
    await gameBanUser(resolved.robloxUserId, reason);
  } catch (err) {
    console.error("[gb] Roblox API error:", err?.response?.data ?? err);
    await message.reply({
      embeds: [
        new EmbedBuilder()
          .setColor(0xf7140f)
          .setDescription(
            `❌ Failed to game-ban Roblox user \`${resolved.robloxUserId}\`.\n` +
            `API error: \`${err?.response?.data?.message ?? err?.message ?? "Unknown error"}\``
          ),
      ],
    });
    return;
  }

  await message.reply({
    embeds: [
      new EmbedBuilder()
        .setColor(0x57f287)
        .setTitle("✅ Game Ban Applied")
        .setDescription(
          `**Roblox ID:** \`${resolved.robloxUserId}\`\n` +
          `**Reason:** ${reason}\n` +
          (resolved.source === "discord"
            ? `*(resolved from Discord ID \`${args[0].replace(/\D/g, "")}\`)*`
            : "")
        )
        .setTimestamp(),
    ],
  });
}
