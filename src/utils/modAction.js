import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";
import { addCase, getCases } from "./modlog.js";

const OWNER_IDS = (process.env.OWNER_IDS ?? "").split(",").map((id) => id.trim()).filter(Boolean);

const DEV_EMOJI = "<:Dev:1502483226931757116>";
const APPEAL_URL = "https://discord.gg/xMpPt3U7Qz";

/** @type {Record<string, string>} */
const ACTION_PAST = {
  warn: "warned",
  ban: "banned",
  mute: "muted",
  unmute: "unmuted",
  kick: "kicked",
  permban: "permanently banned",
  unban: "unbanned",
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
 * Format a Date into the full human-readable footer used in ban DMs.
 * e.g. "Thursday, December 25, 2025 at 9:41 AM"
 * @param {Date} date
 * @returns {string}
 */
function formatFullDate(date) {
  const datePart = date.toLocaleString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
  const timePart = date.toLocaleString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
  return `${datePart} at ${timePart}`;
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

  const isOwner = OWNER_IDS.includes(message.author.id);
  const rank = isOwner ? "(O)" : "(D)";

  // 2. DM the user
  let dmSuccess = false;
  try {
    let dmPayload;

    if (type === "ban" || type === "permban" || type === "unban") {
      // Count all modlogs for this user (including the one just added)
      const modlogCount = getCases(user.id).length;
      const actionLabel = type === "unban" ? "an unban" : "a ban";
      const teamTag = isOwner ? "(O)" : "(D)";

      const dmEmbed = new EmbedBuilder()
        .setColor(0xf7140f)
        .setTitle(`Case #${entry.caseId}`)
        .setDescription(
          `**You have received ${actionLabel}.**\n\n` +
          `**Reason:** ${DEV_EMOJI} [SFFB] ${teamTag} ${reason}\n\n` +
          `${DEV_EMOJI} [SFFB] AquaForge Studios\n` +
          `This punishment has been sent out by the AquaForge Team ${teamTag} and is appealable at anytime.`
        )
        .setFooter({
          text: `You have ${modlogCount} modlog${modlogCount === 1 ? "" : "s"}.\nCreated at ${formatFullDate(caseDate)}`,
        });

      const appealRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setLabel("Appeal")
          .setURL(APPEAL_URL)
          .setStyle(ButtonStyle.Link)
      );

      dmPayload = { embeds: [dmEmbed], components: [appealRow] };
    } else {
      const dmEmbed = new EmbedBuilder()
        .setColor(0xf7140f)
        .setDescription(
          `You have been **${pastTense}** in **${message.guild?.name ?? "the server"}**.\n` +
            `**Actioned by:** <@${message.author.id}>\n` +
            `**Reason:** ${reason}`
        )
        .setFooter({ text: caseFooter });
      dmPayload = { embeds: [dmEmbed] };
    }

    await user.send(dmPayload);
    dmSuccess = true;
  } catch {
    dmSuccess = false;
  }

  // 3. Apply the Discord guild action
  try {
    if (type === "ban" || type === "permban") {
      if (member) await member.ban({ reason });
    } else if (type === "unban") {
      await message.guild?.bans.remove(user.id, reason);
    } else if (type === "kick") {
      if (member) await member.kick(reason);
    } else if (type === "mute" && muteMs != null) {
      if (member) await member.timeout(muteMs, reason);
    } else if (type === "unmute") {
      if (member) await member.timeout(null, reason);
    }
  } catch (err) {
    console.error(`[modAction] Failed to apply "${type}" to ${user.id}:`, err);
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
