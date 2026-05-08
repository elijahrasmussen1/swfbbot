import {
  ActionRowBuilder,
  AttachmentBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
} from "discord.js";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const IMAGE_PATH = join(__dirname, "../../../../images/sonion.png");
const IMAGE_NAME = "sonion.png";

export const name = "gamelink";
export const ownerOnly = true;
export const description = "Posts the official game link embed with join and rewards buttons.";

/**
 * @param {import("discord.js").Message} message
 * @param {string[]} _args
 */
export async function execute(message, _args) {
  const placeId = process.env.ROBLOX_PLACE_ID;

  // Delete the command message so the channel stays clean
  await message.delete().catch(() => null);

  const gameLinkUrl = `https://www.roblox.com/games/start?placeId=${placeId}`;
  const rewardsUrl = "https://www.roblox.com/communities/410837472/Aqua-Forge-Studios#!/about";

  const attachment = new AttachmentBuilder(IMAGE_PATH, { name: IMAGE_NAME });

  const embed = new EmbedBuilder()
    .setColor(0xff69b4)
    .setTitle("🎮 Game Link 🎮")
    .setDescription("The official Game Link for Survive Floods for Brainrots!")
    .setImage(`attachment://${IMAGE_NAME}`)
    .setFooter({ text: "Survive Floods for Brainrots  |  Aqua Forge Studios" });

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setLabel("🎮  Game Link")
      .setStyle(ButtonStyle.Link)
      .setURL(gameLinkUrl),
    new ButtonBuilder()
      .setLabel("🎁  Rewards")
      .setStyle(ButtonStyle.Link)
      .setURL(rewardsUrl)
  );

  await message.channel.send({
    embeds: [embed],
    files: [attachment],
    components: [row],
  });
}
