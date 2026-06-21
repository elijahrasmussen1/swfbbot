import { EmbedBuilder } from "discord.js";

export const name = "leak";
export const ownerOnly = true;
export const description = "Posts a leak (image or video) to the leaks channel with an @everyone ping.";

const LEAK_CHANNEL_ID = "1518059846627229877";

/**
 * @param {import("discord.js").Message} message
 * @param {string[]} _args
 */
export async function execute(message, _args) {
  const attachments = [...message.attachments.values()];

  if (attachments.length === 0) {
    await message.reply({
      embeds: [
        new EmbedBuilder()
          .setColor(0xf7140f)
          .setTitle("Correct Usage")
          .setDescription("Attach a video or image to your `-leak` message."),
      ],
    });
    return;
  }

  let leakChannel;
  try {
    leakChannel = await message.client.channels.fetch(LEAK_CHANNEL_ID);
  } catch {
    await message.reply({
      embeds: [
        new EmbedBuilder()
          .setColor(0xf7140f)
          .setDescription("❌ Could not find the leaks channel."),
      ],
    });
    return;
  }

  if (!leakChannel?.isTextBased()) {
    await message.reply({
      embeds: [
        new EmbedBuilder()
          .setColor(0xf7140f)
          .setDescription("❌ The leaks channel is not a text channel."),
      ],
    });
    return;
  }

  await leakChannel.send({
    content: "@everyone\n\nnew leak posted!",
    files: attachments.map((a) => ({ attachment: a.url, name: a.name })),
  });

  try {
    await message.delete();
  } catch {
    // Missing permissions to delete — silently ignore
  }
}
