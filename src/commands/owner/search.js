import {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  ComponentType,
} from "discord.js";
import { getCases } from "../../utils/modlog.js";

export const name = "search";
export const ownerOnly = true;
export const description = "Searches a user's modlog cases by Discord user ID.";

const CASES_PER_PAGE = 5;
const COLLECTOR_TIMEOUT_MS = 5 * 60 * 1_000; // 5 minutes

/**
 * Filter option definitions.
 * `types: null` means show all cases.
 * `disabled: true` marks options that are reserved for future use.
 */
const FILTER_OPTIONS = [
  { label: "Modlogs",      value: "all",       description: "All cases",                 types: null },
  { label: "Warns",        value: "warn",      description: "Warnings only",             types: ["warn"] },
  { label: "Mutes",        value: "mute",      description: "Mutes only",                types: ["mute"] },
  { label: "Kicks",        value: "kick",      description: "Kicks only",                types: ["kick"] },
  { label: "Bans",         value: "ban",       description: "Bans and permanent bans",   types: ["ban", "permban"] },
  { label: "Wipes",        value: "wipe",      description: "Coming soon",               types: ["wipe"],      disabled: true },
  { label: "Demotions",    value: "demotion",  description: "Coming soon",               types: ["demotion"],  disabled: true },
  { label: "Promotions",   value: "promotion", description: "Coming soon",               types: ["promotion"], disabled: true },
  { label: "Staff Warns",  value: "staffwarn", description: "Coming soon",               types: ["staffwarn"], disabled: true },
];

/**
 * Filter an array of cases by the current filter value.
 * @param {import("../../utils/modlog.js").CaseEntry[]} cases
 * @param {string} filter
 */
function applyFilter(cases, filter) {
  if (filter === "all") return cases;
  const opt = FILTER_OPTIONS.find((o) => o.value === filter);
  if (!opt?.types) return cases;
  return cases.filter((c) => opt.types.includes(c.type));
}

/**
 * Build the search embed for a given page/filter state.
 * @param {import("discord.js").User} user
 * @param {import("../../utils/modlog.js").CaseEntry[]} allCases
 * @param {number} page       1-indexed
 * @param {string} filter
 * @returns {{ embed: EmbedBuilder, totalPages: number, actualPage: number }}
 */
function buildEmbed(user, allCases, page, filter) {
  const filtered = applyFilter(allCases, filter);
  const totalPages = Math.max(1, Math.ceil(filtered.length / CASES_PER_PAGE));
  const actualPage = Math.min(Math.max(1, page), totalPages);
  const start = (actualPage - 1) * CASES_PER_PAGE;
  const pageCases = filtered.slice(start, start + CASES_PER_PAGE);

  const embed = new EmbedBuilder()
    .setColor(0xf7140f)
    .setAuthor({ name: user.username, iconURL: user.displayAvatarURL({ size: 64 }) })
    .setThumbnail(user.displayAvatarURL({ size: 256 }));

  if (filtered.length === 0) {
    embed.setDescription("No modlogs found for this user.");
  } else {
    const lines = pageCases.map(
      (c) => `**Case #${c.caseId}** - ${c.type}\n${c.reason}`
    );
    embed
      .setDescription(lines.join("\n\n"))
      .setFooter({ text: `Page ${actualPage}/${totalPages} | Results: ${filtered.length}` });
  }

  return { embed, totalPages, actualPage };
}

/**
 * Build the two component rows (buttons + filter select menu).
 * @param {number} page        current page (1-indexed)
 * @param {number} totalPages
 * @param {boolean} disabled   when true, disable all components (e.g. after timeout)
 */
function buildComponents(page, totalPages, disabled = false) {
  const buttonRow = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("search_prev")
      .setLabel("Previous")
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(disabled || page <= 1),
    new ButtonBuilder()
      .setCustomId("search_next")
      .setLabel("Next")
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(disabled || page >= totalPages),
    new ButtonBuilder()
      .setCustomId("search_last")
      .setLabel("Last Page")
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(disabled || totalPages <= 1),
  );

  const filterMenu = new StringSelectMenuBuilder()
    .setCustomId("search_filter")
    .setPlaceholder("(Filter)")
    .setMinValues(1)
    .setMaxValues(1)
    .addOptions(
      FILTER_OPTIONS.map((opt) =>
        new StringSelectMenuOptionBuilder()
          .setLabel(opt.label)
          .setValue(opt.value)
          .setDescription(opt.description)
      )
    );

  const filterRow = new ActionRowBuilder().addComponents(filterMenu);
  return [buttonRow, filterRow];
}

/**
 * @param {import("discord.js").Message} message
 * @param {string[]} args
 */
export async function execute(message, args) {
  const userId = args[0]?.replace(/\D/g, "");

  if (!userId) {
    await message.reply({
      embeds: [
        new EmbedBuilder()
          .setColor(0xf7140f)
          .setTitle("Correct Usage")
          .setDescription("`-search <userId>`"),
      ],
    });
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

  const allCases = getCases(userId);

  let currentPage = 1;
  let currentFilter = "all";

  const { embed, totalPages, actualPage } = buildEmbed(user, allCases, currentPage, currentFilter);
  currentPage = actualPage;

  const reply = await message.channel.send({
    embeds: [embed],
    components: buildComponents(currentPage, totalPages),
  });

  // Collect button clicks and select menu interactions from the invoking moderator only
  const collector = reply.createMessageComponentCollector({
    filter: (i) => i.user.id === message.author.id,
    time: COLLECTOR_TIMEOUT_MS,
  });

  collector.on("collect", async (interaction) => {
    if (interaction.componentType === ComponentType.Button) {
      const { totalPages: tp } = buildEmbed(user, allCases, currentPage, currentFilter);

      if (interaction.customId === "search_prev") {
        currentPage = Math.max(1, currentPage - 1);
      } else if (interaction.customId === "search_next") {
        currentPage = Math.min(tp, currentPage + 1);
      } else if (interaction.customId === "search_last") {
        currentPage = tp;
      }
    } else if (interaction.componentType === ComponentType.StringSelect) {
      currentFilter = interaction.values[0];
      currentPage = 1;
    }

    const { embed: newEmbed, totalPages: newTotal, actualPage: newPage } =
      buildEmbed(user, allCases, currentPage, currentFilter);
    currentPage = newPage;

    await interaction.update({
      embeds: [newEmbed],
      components: buildComponents(currentPage, newTotal),
    });
  });

  collector.on("end", async () => {
    // Disable all controls after timeout
    const { embed: finalEmbed, totalPages: finalTotal } =
      buildEmbed(user, allCases, currentPage, currentFilter);
    await reply.edit({
      embeds: [finalEmbed],
      components: buildComponents(currentPage, finalTotal, true),
    }).catch(() => null);
  });
}
