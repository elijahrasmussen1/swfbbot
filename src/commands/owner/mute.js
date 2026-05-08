import { EmbedBuilder } from "discord.js";
import { executeModAction } from "../../utils/modAction.js";
import { parseDuration, formatDuration } from "../../utils/parseDuration.js";

export const name = "mute";
export const ownerOnly = true;
export const description = "Times out (mutes) a user and records the case.";

/**
 * @param {import("discord.js").Message} message
 * @param {string[]} args
 */
export async function execute(message, args) {
  const userId = args[0]?.replace(/\D/g, "");

  if (!userId || args.length < 2) {
    await message.reply({
      embeds: [
        new EmbedBuilder()
          .setColor(0xf7140f)
          .setTitle("Correct Usage")
          .setDescription("`-mute <@user> <duration> [reason]`\nDuration examples: `10m`, `1h`, `7d`"),
      ],
    });
    return;
  }

  const muteMs = parseDuration(args[1]);
  if (!muteMs) {
    await message.reply({
      embeds: [
        new EmbedBuilder()
          .setColor(0xf7140f)
          .setTitle("Invalid Duration")
          .setDescription(
            "Please provide a valid duration. Examples: `10m`, `2h`, `1d`, `7d`\n" +
              "Maximum duration is 28 days."
          ),
      ],
    });
    return;
  }

  const reason = args.slice(2).join(" ") || "No reason provided.";
  const durationText = formatDuration(muteMs);

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

  const member = await message.guild?.members.fetch(userId).catch(() => null);

  if (!member) {
    await message.reply({
      embeds: [
        new EmbedBuilder()
          .setColor(0xf7140f)
          .setDescription("❌ That user is not in this server."),
      ],
    });
    return;
  }

  await executeModAction({
    message,
    user,
    member,
    type: "mute",
    reason: `${reason} (Duration: ${durationText})`,
    muteMs,
  });
}
