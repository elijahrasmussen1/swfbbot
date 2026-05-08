import { SlashCommandBuilder } from "discord.js";

export const data = new SlashCommandBuilder()
  .setName("ping")
  .setDescription("Checks the bot response time.");

/**
 * @param {import("discord.js").ChatInputCommandInteraction} interaction
 */
export async function execute(interaction) {
  const sent = await interaction.reply({
    content: "Pinging...",
    fetchReply: true,
  });

  const roundtrip = sent.createdTimestamp - interaction.createdTimestamp;
  const heartbeat = Math.round(interaction.client.ws.ping);

  await interaction.editReply(
    `Pong! Roundtrip: ${roundtrip}ms | WebSocket heartbeat: ${heartbeat}ms`
  );
}
