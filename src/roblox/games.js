import axios from "axios";

const GAMES_API = "https://games.roblox.com/v1/games";

/**
 * Fetches live game statistics for one or more universe IDs from the public
 * Roblox Games API. No authentication required.
 *
 * @param {string|number} universeId  The Roblox universe ID to query.
 * @returns {Promise<object>} The game data object for the requested universe.
 */
export async function getGameStats(universeId) {
  if (!universeId) throw new Error("universeId is required.");

  const { data } = await axios.get(GAMES_API, {
    params: { universeIds: universeId },
  });

  if (!data.data || data.data.length === 0) {
    throw new Error(`No game data returned for universe ${universeId}.`);
  }

  return data.data[0];
}
