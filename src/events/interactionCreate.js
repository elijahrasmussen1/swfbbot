import { Events } from "discord.js";

export const name = Events.InteractionCreate;
export const once = false;

/**
 * Routes every incoming interaction to its registered command handler.
 *
 * @param {import("discord.js").Interaction} interaction
 */
export async function execute(interaction) {
  if (!interaction.isChatInputCommand()) return;

  const command = interaction.client.commands.get(interaction.commandName);

  if (!command) {
    console.error(`[Interaction] Unknown command: ${interaction.commandName}`);
    return;
  }

  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(
      `[Interaction] Error executing ${interaction.commandName}:`,
      error
    );

    const errorMessage = {
      content: "An error occurred while executing this command.",
      ephemeral: true,
    };

    if (interaction.replied || interaction.deferred) {
      await interaction.followUp(errorMessage);
    } else {
      await interaction.reply(errorMessage);
    }
  }
}
