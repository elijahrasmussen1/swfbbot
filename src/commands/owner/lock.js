import { EmbedBuilder } from "discord.js";

export const name = "lock";
export const ownerOnly = true;
export const description = "Locks all channels in the server except the exempt channel. Only the owner can speak.";

const EXEMPT_CHANNEL_ID = process.env.LOCK_EXEMPT_CHANNEL ?? "1445901340214689932";
const OWNER_IDS = (process.env.OWNER_IDS ?? "1182265710248996874")
  .split(",")
  .map((id) => id.trim())
  .filter(Boolean);

/**
 * @param {import("discord.js").Message} message
 * @param {string[]} _args
 */
export async function execute(message, _args) {
  const guild = message.guild;

  if (!guild) {
    await message.reply({
      embeds: [
        new EmbedBuilder()
          .setColor(0xf7140f)
          .setDescription("❌ This command must be run inside a server."),
      ],
    });
    return;
  }

  const channels = await guild.channels.fetch();
  const textChannels = channels.filter(
    (ch) =>
      ch &&
      ch.id !== EXEMPT_CHANNEL_ID &&
      ch.isTextBased() &&
      !ch.isThread()
  );

  let locked = 0;
  let failed = 0;

  for (const [, channel] of textChannels) {
    try {
      // Deny @everyone from sending messages
      await channel.permissionOverwrites.edit(guild.roles.everyone, {
        SendMessages: false,
      });

      // Allow each owner to still send messages
      for (const ownerId of OWNER_IDS) {
        await channel.permissionOverwrites.edit(ownerId, {
          SendMessages: true,
        });
      }

      locked++;
    } catch {
      failed++;
    }
  }

  await message.reply({
    embeds: [
      new EmbedBuilder()
        .setColor(0xf7140f)
        .setTitle("🔒 Server Locked")
        .setDescription(
          `All channels have been locked.\n` +
          `**Locked:** ${locked} channel${locked !== 1 ? "s" : ""}\n` +
          (failed > 0 ? `**Failed:** ${failed} channel${failed !== 1 ? "s" : ""} (missing permissions)\n` : "") +
          `\n<#${EXEMPT_CHANNEL_ID}> was left unlocked.`
        )
        .setTimestamp(),
    ],
  });
}
