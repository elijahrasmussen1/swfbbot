import { EmbedBuilder } from "discord.js";
import { executeModAction } from "../../utils/modAction.js";

export const name = "unmute";
export const ownerOnly = true;
export const description = "Removes a timeout (unmutes) a user and records the case.";

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
          .setDescription("`-unmute <@user> [reason]`"),
      ],
    });
    return;
  }

  const reason = args.slice(1).join(" ") || "No reason provided.";

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

  const member = await message.guild?.members.fetch(userId).catch(() => null);

  if (!member) {
    await message.reply({
      embeds: [
        new EmbedBuilder()
          .setColor(0xf7140f)
          .setDescription("❌ That user is not in this server."),
      ],
    });
    return;
  }

  await executeModAction({ message, user, member, type: "unmute", reason });
}
