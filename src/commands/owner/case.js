import {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} from "discord.js";
import { getCaseById, updateCaseReason, deleteCase } from "../../utils/modlog.js";

export const name = "case";
export const ownerOnly = true;
export const description = "View, edit, or delete a moderation case by case number.";

const COLLECTOR_TIMEOUT_MS = 5 * 60 * 1_000; // 5 minutes
const EDIT_TIMEOUT_MS = 2 * 60 * 1_000;       // 2 minutes to respond in edit mode

/**
 * Build the case embed.
 * @param {import("../../utils/modlog.js").CaseEntry} entry
 * @param {import("discord.js").User} moderator
 * @param {import("discord.js").User} inflicted
 */
function buildCaseEmbed(entry, moderator, inflicted) {
  return new EmbedBuilder()
    .setColor(0xf7140f)
    .setTitle(`Case #${entry.caseId}`)
    .setAuthor({ name: moderator.username, iconURL: moderator.displayAvatarURL({ size: 64 }) })
    .setThumbnail(inflicted.displayAvatarURL({ size: 256 }))
    .addFields(
      { name: "Admin",   value: `<@${entry.moderatorId}>`, inline: true },
      { name: "User",    value: `<@${entry.userId}>`,      inline: true },
      { name: "Type",    value: entry.type,                inline: true },
      { name: "Reason",  value: entry.reason }
    )
    .setFooter({ text: new Date(entry.timestamp).toLocaleString("en-US") });
}

/**
 * Build the action row (Edit + Delete buttons).
 * @param {boolean} disabled
 */
function buildCaseComponents(disabled = false) {
  return [
    new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("case_edit")
        .setLabel("✏️ Edit")
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(disabled),
      new ButtonBuilder()
        .setCustomId("case_delete")
        .setLabel("🗑️ Delete")
        .setStyle(ButtonStyle.Danger)
        .setDisabled(disabled),
    ),
  ];
}

/**
 * @param {import("discord.js").Message} message
 * @param {string[]} args
 */
export async function execute(message, args) {
  const caseId = parseInt(args[0], 10);

  if (!args[0] || isNaN(caseId) || caseId <= 0) {
    await message.reply({
      embeds: [
        new EmbedBuilder()
          .setColor(0xf7140f)
          .setTitle("Correct Usage")
          .setDescription("`-case <caseId>`"),
      ],
    });
    return;
  }

  const entry = getCaseById(caseId);
  if (!entry) {
    await message.reply({
      embeds: [
        new EmbedBuilder()
          .setColor(0xf7140f)
          .setDescription(`❌ Case #${caseId} not found.`),
      ],
    });
    return;
  }

  let moderator, inflicted;
  try {
    [moderator, inflicted] = await Promise.all([
      message.client.users.fetch(entry.moderatorId),
      message.client.users.fetch(entry.userId),
    ]);
  } catch {
    await message.reply({
      embeds: [
        new EmbedBuilder()
          .setColor(0xf7140f)
          .setDescription("❌ Could not fetch one or more users for this case."),
      ],
    });
    return;
  }

  const reply = await message.channel.send({
    embeds: [buildCaseEmbed(entry, moderator, inflicted)],
    components: buildCaseComponents(),
  });

  // Track the live entry so edits reflect the latest state
  let liveEntry = entry;

  const collector = reply.createMessageComponentCollector({
    filter: (i) => i.user.id === message.author.id,
    time: COLLECTOR_TIMEOUT_MS,
  });

  collector.on("collect", async (interaction) => {
    if (interaction.customId === "case_delete") {
      deleteCase(caseId);
      await interaction.update({
        embeds: [
          new EmbedBuilder()
            .setColor(0xf7140f)
            .setDescription(`✅ Case #${caseId} has been deleted.`),
        ],
        components: [],
      });
      collector.stop("deleted");
      return;
    }

    if (interaction.customId === "case_edit") {
      // Acknowledge the button press without changing the message yet
      await interaction.deferUpdate();

      // Show the original command format as a prompt
      const originalCmd = `-${liveEntry.type} <@${liveEntry.userId}> ${liveEntry.reason}`;
      const prompt = await message.channel.send(
        `\`${originalCmd}\`\nyou're in edit mode. send how you'd like it edited.`
      );

      // Wait for the admin to send the replacement command
      const msgCollector = message.channel.createMessageCollector({
        filter: (m) => m.author.id === message.author.id,
        max: 1,
        time: EDIT_TIMEOUT_MS,
      });

      msgCollector.on("collect", async (editMsg) => {
        // Expected format: `-<type> <@userId | rawId> <new reason...>`
        // We only update the reason — everything after the first two tokens.
        const parts = editMsg.content.trim().split(/\s+/);
        const newReason = parts.slice(2).join(" ").trim();

        if (!newReason) {
          await message.channel.send("❌ No reason detected. Edit cancelled.");
          await prompt.delete().catch(() => null);
          await editMsg.delete().catch(() => null);
          return;
        }

        const updated = updateCaseReason(caseId, newReason);
        if (!updated) {
          await message.channel.send("❌ Case no longer exists.");
          await prompt.delete().catch(() => null);
          await editMsg.delete().catch(() => null);
          return;
        }

        liveEntry = updated;

        await reply.edit({
          embeds: [buildCaseEmbed(liveEntry, moderator, inflicted)],
          components: buildCaseComponents(),
        });

        await prompt.delete().catch(() => null);
        await editMsg.delete().catch(() => null);

        const confirm = await message.channel.send(`✅ Case #${caseId} reason updated.`);
        setTimeout(() => confirm.delete().catch(() => null), 3_000);
      });

      msgCollector.on("end", (_, reason) => {
        if (reason === "time") {
          prompt.delete().catch(() => null);
          message.channel
            .send("⏰ Edit timed out.")
            .then((m) => setTimeout(() => m.delete().catch(() => null), 3_000));
        }
      });
    }
  });

  collector.on("end", async (_, reason) => {
    if (reason !== "deleted") {
      await reply.edit({ components: buildCaseComponents(true) }).catch(() => null);
    }
  });
}
