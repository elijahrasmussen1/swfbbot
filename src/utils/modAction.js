import { EmbedBuilder } from "discord.js";
import { addCase } from "./modlog.js";

/** @type {Record<string, string>} */
const ACTION_PAST = {
  warn: "warned",
  ban: "banned",
  mute: "muted",
  unmute: "unmuted",
  kick: "kicked",
  permban: "permanently banned",
};

/**
 * Format a Date into "M/D/YY, H:MM AM/PM" (matching the screenshot DM footer).
 * If the date is today, returns "Today at H:MM AM/PM".
 * @param {Date} date
 * @returns {string}
 */
function formatCaseTime(date) {
  const now = new Date();
  const isToday =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate();

  const time = date.toLocaleString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  if (isToday) return `Today at ${time}`;

  const short = date.toLocaleString("en-US", {
    month: "numeric",
    day: "numeric",
    year: "2-digit",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
  return short;
}

/**
 * Execute a moderation action: log the case, attempt to DM the user,
 * apply the Discord guild action, and send the action-success embed.
 *
 * @param {{
 *   message: import("discord.js").Message,
 *   user: import("discord.js").User,
 *   member: import("discord.js").GuildMember | null,
 *   type: import("./modlog.js").ActionType,
 *   reason: string,
 *   muteMs?: number | null,
 * }} options
 * @returns {Promise<import("./modlog.js").CaseEntry>}
 */
export async function executeModAction({ message, user, member, type, reason, muteMs = null }) {
  // 1. Record the case
  const entry = addCase(user.id, type, reason, message.author.id);
  const caseDate = new Date(entry.timestamp);
  const caseFooter = `Case #${entry.caseId} • ${formatCaseTime(caseDate)}`;
  const pastTense = ACTION_PAST[type] ?? type;

  // 2. DM the user
  let dmSuccess = false;
  try {
    const dmEmbed = new EmbedBuilder()
      .setColor(0xf7140f)
      .setDescription(
        `You have been **${pastTense}** in **${message.guild?.name ?? "the server"}**.\n` +
          `**Actioned by:** <@${message.author.id}>\n` +
          `**Reason:** ${reason}`
      )
      .setFooter({ text: caseFooter });
    await user.send({ embeds: [dmEmbed] });
    dmSuccess = true;
  } catch {
    dmSuccess = false;
  }

  // 3. Apply the Discord guild action
  if (member) {
    try {
      if (type === "ban" || type === "permban") {
        await member.ban({ reason });
      } else if (type === "kick") {
        await member.kick(reason);
      } else if (type === "mute" && muteMs != null) {
        await member.timeout(muteMs, reason);
      } else if (type === "unmute") {
        await member.timeout(null, reason);
      }
    } catch (err) {
      console.error(`[modAction] Failed to apply "${type}" to ${user.id}:`, err);
    }
  }

  // 4. Send the action-success embed in the channel
  const embed = new EmbedBuilder()
    .setColor(0x57f287)
    .setThumbnail(user.displayAvatarURL({ size: 256 }))
    .setTitle("✅ Action Success")
    .setDescription(
      `<@${user.id}> has been ${pastTense}.\n` +
        `Reason: ${reason}\n` +
        (dmSuccess ? "💬 DM'd the user successfully." : "❌ Could not DM the user.")
    )
    .setFooter({ text: caseFooter });

  await message.channel.send({ embeds: [embed] });
  return entry;
}
