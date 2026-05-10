import { MongoClient } from "mongodb";

const DB_NAME = "sffbverify";
const COLLECTION_NAME = "users";

/** @type {MongoClient | null} */
let _client = null;

/**
 * Connect to MongoDB Atlas (singleton — safe to call multiple times).
 * Reads MONGODB_URI from environment.
 * @returns {Promise<MongoClient>}
 */
export async function connectMongo() {
  if (_client) return _client;

  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI is not set in environment variables.");

  const client = new MongoClient(uri, {
    serverSelectionTimeoutMS: 10_000,
    connectTimeoutMS: 10_000,
  });

  await client.connect();
  _client = client;
  console.log("[MongoDB] Connected to Atlas.");
  return _client;
}

/**
 * Return the users collection from the sffbverify database.
 * Throws if connectMongo() has not been called yet.
 * @returns {import("mongodb").Collection}
 */
function usersCollection() {
  if (!_client) throw new Error("[MongoDB] Not connected. Call connectMongo() first.");
  return _client.db(DB_NAME).collection(COLLECTION_NAME);
}

/**
 * Fetch the full verification document for a Discord user.
 * Returns null if the user is not found.
 * @param {string} discordId
 * @returns {Promise<object | null>}
 */
export async function getVerifiedUser(discordId) {
  try {
    return await usersCollection().findOne({ discordId });
  } catch (err) {
    console.error("[MongoDB] getVerifiedUser error:", err);
    return null;
  }
}

/**
 * Check whether a Discord user has a verified account.
 * @param {string} discordId
 * @returns {Promise<boolean>}
 */
export async function isVerified(discordId) {
  const user = await getVerifiedUser(discordId);
  return user !== null;
}

/**
 * Return the Roblox username (or user ID) linked to a Discord user.
 * Returns null if not found or if no robloxUsername field exists.
 * @param {string} discordId
 * @returns {Promise<string | null>}
 */
export async function getRobloxAccount(discordId) {
  const user = await getVerifiedUser(discordId);
  return user?.robloxUsername ?? user?.robloxId ?? null;
}

/**
 * Fetch the full verification document for a Roblox username.
 * Returns null if the user is not found.
 * @param {string} robloxUsername
 * @returns {Promise<object | null>}
 */
export async function getVerifiedUserByRobloxUsername(robloxUsername) {
  try {
    return await usersCollection().findOne({ robloxUsername });
  } catch (err) {
    console.error("[MongoDB] getVerifiedUserByRobloxUsername error:", err);
    return null;
  }
}
