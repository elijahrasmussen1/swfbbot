// DEPRECATED: This module has been superseded by src/utils/modlog.js which
// supports all action types and global case IDs. Kept for reference only.
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, "../../data");
const WARNINGS_FILE = join(DATA_DIR, "warnings.json");

/**
 * @typedef {{ reason: string, moderatorId: string, timestamp: string }} Warning
 * @typedef {Record<string, Warning[]>} WarningsStore
 */

/** @returns {WarningsStore} */
function load() {
  if (!existsSync(WARNINGS_FILE)) return {};
  try {
    return JSON.parse(readFileSync(WARNINGS_FILE, "utf8"));
  } catch {
    return {};
  }
}

/** @param {WarningsStore} data */
function save(data) {
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
  writeFileSync(WARNINGS_FILE, JSON.stringify(data, null, 2), "utf8");
}

/**
 * Add a warning for a user.
 * @param {string} userId
 * @param {string} reason
 * @param {string} moderatorId
 * @returns {Warning[]} updated list of warnings for that user
 */
export function addWarning(userId, reason, moderatorId) {
  const data = load();
  if (!data[userId]) data[userId] = [];
  const warning = { reason, moderatorId, timestamp: new Date().toISOString() };
  data[userId].push(warning);
  save(data);
  return data[userId];
}

/**
 * Get all warnings for a user.
 * @param {string} userId
 * @returns {Warning[]}
 */
export function getWarnings(userId) {
  const data = load();
  return data[userId] ?? [];
}
