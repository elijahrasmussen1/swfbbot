import { EmbedBuilder } from "discord.js";
import { executeModAction } from "../../utils/modAction.js";

export const name = "ub";
export const ownerOnly = true;
export const description = "Unbans a user by ID and records the case.";

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
          .setDescription("`-ub <userId> <reason>`"),
      ],
    });
    return;
  }

  const reason = args.slice(1).join(" ");

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

  // Verify they are actually banned before proceeding
  const banEntry = await message.guild?.bans.fetch(userId).catch(() => null);
  if (!banEntry) {
    await message.reply({
      embeds: [
        new EmbedBuilder()
          .setColor(0xf7140f)
          .setDescription("❌ That user does not appear to be banned from this server."),
      ],
    });
    return;
  }

  // member is always null for banned users; executeModAction handles unban via guild.bans.remove
  await executeModAction({ message, user, member: null, type: "unban", reason });
}
