import axios from "axios";

const BASE_URL = "https://apis.roblox.com/cloud/v2";

/**
 * Returns an axios instance pre-configured with the Roblox Open Cloud API key
 * and base URL.
 *
 * @returns {import("axios").AxiosInstance}
 */
function createClient() {
  if (!process.env.ROBLOX_API_KEY) {
    throw new Error("ROBLOX_API_KEY is not set in the environment.");
  }

  return axios.create({
    baseURL: BASE_URL,
    headers: {
      "x-api-key": process.env.ROBLOX_API_KEY,
    },
  });
}

/**
 * Fetches details for the configured Roblox universe.
 *
 * @returns {Promise<object>} The universe resource object from the Open Cloud API.
 */
export async function getUniverse() {
  const universeId = process.env.ROBLOX_UNIVERSE_ID;
  if (!universeId) throw new Error("ROBLOX_UNIVERSE_ID is not set.");

  const client = createClient();
  const { data } = await client.get(`/universes/${universeId}`);
  return data;
}

/**
 * Retrieves live server statistics for the configured place.
 *
 * @returns {Promise<object>} Place details including active server counts.
 */
export async function getPlaceDetails() {
  const universeId = process.env.ROBLOX_UNIVERSE_ID;
  const placeId = process.env.ROBLOX_PLACE_ID;
  if (!universeId) throw new Error("ROBLOX_UNIVERSE_ID is not set.");
  if (!placeId) throw new Error("ROBLOX_PLACE_ID is not set.");

  const client = createClient();
  const { data } = await client.get(
    `/universes/${universeId}/places/${placeId}`
  );
  return data;
}

/**
 * Publishes a message to all active game servers via the Roblox
 * MessagingService (requires Open Cloud "Publish to Topic" permission).
 *
 * @param {string} topic   The MessagingService topic subscribers listen on.
 * @param {object} payload The JSON-serializable payload to broadcast.
 * @returns {Promise<void>}
 */
export async function publishMessage(topic, payload) {
  const universeId = process.env.ROBLOX_UNIVERSE_ID;
  if (!universeId) throw new Error("ROBLOX_UNIVERSE_ID is not set.");

  const client = createClient();
  await client.post(`/universes/${universeId}/topics/${topic}`, {
    message: JSON.stringify(payload),
  });
}

/**
 * Game-bans a Roblox user from the configured universe via the Open Cloud v2
 * user-restrictions API. The ban is permanent (no expiry).
 *
 * Requires the API key to have "Manage User Restrictions" permission.
 *
 * @param {string|number} robloxUserId  The numeric Roblox user ID to ban.
 * @param {string}        reason        Reason shown to the player and stored privately.
 * @returns {Promise<object>}           The user-restriction resource returned by the API.
 */
export async function gameBanUser(robloxUserId, reason) {
  const universeId = process.env.ROBLOX_UNIVERSE_ID;
  if (!universeId) throw new Error("ROBLOX_UNIVERSE_ID is not set.");

  const client = createClient();
  const { data } = await client.patch(
    `/universes/${universeId}/user-restrictions/${robloxUserId}`,
    {
      gameJoinRestriction: {
        active: true,
        privateReason: reason,
        displayReason: reason,
      },
    },
    { params: { updateMask: "gameJoinRestriction" } }
  );
  return data;
}

/**
 * Removes a game-ban (unbans) a Roblox user from the configured universe via
 * the Open Cloud v2 user-restrictions API.
 *
 * Requires the API key to have "Manage User Restrictions" permission.
 *
 * @param {string|number} robloxUserId  The numeric Roblox user ID to unban.
 * @param {string}        reason        Reason for the unban.
 * @returns {Promise<object>}           The user-restriction resource returned by the API.
 */
export async function gameUnbanUser(robloxUserId, reason) {
  const universeId = process.env.ROBLOX_UNIVERSE_ID;
  if (!universeId) throw new Error("ROBLOX_UNIVERSE_ID is not set.");

  const client = createClient();
  const { data } = await client.patch(
    `/universes/${universeId}/user-restrictions/${robloxUserId}`,
    {
      gameJoinRestriction: {
        active: false,
        privateReason: reason,
        displayReason: reason,
      },
    },
    { params: { updateMask: "gameJoinRestriction" } }
  );
  return data;
}
