import { EmbedBuilder } from "discord.js";
import { getGameStats } from "../../roblox/games.js";

export const name = "playercount";
export const ownerOnly = true;
export const description = "Displays the current live player count for Survive Floods for Brainrots.";

/**
 * @param {import("discord.js").Message} message
 * @param {string[]} _args
 */
export async function execute(message, _args) {
  const universeId = process.env.ROBLOX_UNIVERSE_ID;
  const placeId = process.env.ROBLOX_PLACE_ID;

  if (!universeId || !placeId) {
    await message.reply("Roblox universe or place ID is not configured.");
    return;
  }

  let game;
  try {
    game = await getGameStats(universeId);
  } catch (error) {
    console.error("[playercount] Failed to retrieve game stats:", error);
    await message.reply("Failed to retrieve game data from Roblox. Please try again later.");
    return;
  }

  const playing = game.playing?.toLocaleString() ?? "N/A";
  const visits = game.visits?.toLocaleString() ?? "N/A";
  const favoritedCount = game.favoritedCount?.toLocaleString() ?? "N/A";
  const maxPlayers = game.maxPlayers ?? "N/A";
  const gameUrl = `https://www.roblox.com/games/${placeId}`;

  const embed = new EmbedBuilder()
    .setColor(0x0a84ff)
    .setTitle(game.name ?? "Survive Floods for Brainrots")
    .setURL(gameUrl)
    .setDescription("Live game statistics pulled directly from the Roblox platform.")
    .addFields(
      {
        name: "Players Online",
        value: playing,
        inline: true,
      },
      {
        name: "Max Players Per Server",
        value: String(maxPlayers),
        inline: true,
      },
      {
        name: "Total Visits",
        value: visits,
        inline: true,
      },
      {
        name: "Favorites",
        value: favoritedCount,
        inline: true,
      }
    )
    .setFooter({ text: "Survive Floods for Brainrots  |  Data from Roblox" })
    .setTimestamp();

  await message.channel.send({ embeds: [embed] });
}
