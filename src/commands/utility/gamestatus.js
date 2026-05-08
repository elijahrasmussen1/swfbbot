import { SlashCommandBuilder, EmbedBuilder } from "discord.js";
import { getUniverse } from "../../roblox/api.js";

export const data = new SlashCommandBuilder()
  .setName("gamestatus")
  .setDescription("Displays the current status of Survive Floods for Brainrots.");

/**
 * @param {import("discord.js").ChatInputCommandInteraction} interaction
 */
export async function execute(interaction) {
  await interaction.deferReply();

  let universe;
  try {
    universe = await getUniverse();
  } catch (error) {
    console.error("[gamestatus] Failed to fetch universe data:", error);
    await interaction.editReply(
      "Failed to retrieve game data from Roblox. Please try again later."
    );
    return;
  }

  const embed = new EmbedBuilder()
    .setTitle("Survive Floods for Brainrots")
    .setURL(
      `https://www.roblox.com/games/${process.env.ROBLOX_PLACE_ID}`
    )
    .addFields(
      {
        name: "Display Name",
        value: universe.displayName ?? universe.id,
        inline: true,
      },
      {
        name: "Visibility",
        value: universe.visibility ?? "Unknown",
        inline: true,
      },
      {
        name: "Description",
        value: universe.description || "No description provided.",
        inline: false,
      }
    )
    .setTimestamp()
    .setFooter({ text: "Data provided by Roblox Open Cloud" });

  await interaction.editReply({ embeds: [embed] });
}
