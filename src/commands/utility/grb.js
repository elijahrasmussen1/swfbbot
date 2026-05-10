import axios from "axios";
import { EmbedBuilder } from "discord.js";
import { getVerifiedUser } from "../../db/mongo.js";

export const name = "grb";
export const description = "Grabs the Roblox information linked to a Discord user.";

const ROBLOX_USERS_API = "https://users.roblox.com/v1/users";
const ROBLOX_THUMBNAILS_API =
  "https://thumbnails.roblox.com/v1/users/avatar-headshot";

/**
 * Fetch public Roblox user data by numeric Roblox user ID.
 * Returns null on failure.
 * @param {string|number} robloxId
 * @returns {Promise<object|null>}
 */
async function fetchRobloxUser(robloxId) {
  try {
    const { data } = await axios.get(`${ROBLOX_USERS_API}/${robloxId}`);
    return data;
  } catch {
    return null;
  }
}

/**
 * Fetch the headshot thumbnail URL for a Roblox user ID.
 * Returns null on failure.
 * @param {string|number} robloxId
 * @returns {Promise<string|null>}
 */
async function fetchAvatarUrl(robloxId) {
  try {
    const { data } = await axios.get(ROBLOX_THUMBNAILS_API, {
      params: { userIds: robloxId, size: "420x420", format: "Png" },
    });
    return data?.data?.[0]?.imageUrl ?? null;
  } catch {
    return null;
  }
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
          .setDescription("`-grb <@user | userId>`"),
      ],
    });
    return;
  }

  let discordUser;
  try {
    discordUser = await message.client.users.fetch(userId);
  } catch {
    await message.reply({
      embeds: [
        new EmbedBuilder()
          .setColor(0xf7140f)
          .setDescription("❌ Could not find a Discord user with that ID."),
      ],
    });
    return;
  }

  const record = await getVerifiedUser(discordUser.id);

  if (!record) {
    await message.reply({
      embeds: [
        new EmbedBuilder()
          .setColor(0xf7140f)
          .setAuthor({
            name: discordUser.username,
            iconURL: discordUser.displayAvatarURL({ size: 64 }),
          })
          .setDescription("❌ This user has no linked Roblox account."),
      ],
    });
    return;
  }

  const robloxId = record.robloxId;
  const robloxUsername = record.robloxUsername;

  const embed = new EmbedBuilder()
    .setColor(0x0a84ff)
    .setAuthor({
      name: discordUser.username,
      iconURL: discordUser.displayAvatarURL({ size: 64 }),
    })
    .setTitle("Roblox Account Info");

  if (robloxUsername) {
    embed.addFields({ name: "Username", value: robloxUsername, inline: true });
  }

  if (robloxId) {
    embed.addFields({ name: "User ID", value: String(robloxId), inline: true });

    const [robloxUser, avatarUrl] = await Promise.all([
      fetchRobloxUser(robloxId),
      fetchAvatarUrl(robloxId),
    ]);

    if (robloxUser) {
      if (robloxUser.displayName && robloxUser.displayName !== robloxUsername) {
        embed.addFields({
          name: "Display Name",
          value: robloxUser.displayName,
          inline: true,
        });
      }

      if (robloxUser.created) {
        const joined = new Date(robloxUser.created).toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        });
        embed.addFields({ name: "Joined Roblox", value: joined, inline: true });
      }

      if (robloxUser.description) {
        embed.addFields({
          name: "Bio",
          value:
            robloxUser.description.length > 256
              ? robloxUser.description.slice(0, 253) + "..."
              : robloxUser.description,
          inline: false,
        });
      }
    }

    embed.setURL(`https://www.roblox.com/users/${robloxId}/profile`);

    if (avatarUrl) {
      embed.setThumbnail(avatarUrl);
    }
  }

  embed
    .setTimestamp()
    .setFooter({ text: "Roblox" });

  await message.channel.send({ embeds: [embed] });
}
