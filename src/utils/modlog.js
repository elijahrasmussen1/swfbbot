import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, "../../data");
const MODLOG_FILE = join(DATA_DIR, "modlog.json");

/**
 * @typedef {"warn"|"ban"|"mute"|"unmute"|"kick"|"permban"|"unban"} ActionType
 *
 * @typedef {{
 *   caseId: number,
 *   userId: string,
 *   moderatorId: string,
 *   type: ActionType,
 *   reason: string,
 *   timestamp: string
 * }} CaseEntry
 *
 * @typedef {{ nextCaseId: number, cases: CaseEntry[] }} ModlogStore
 */

/** @returns {ModlogStore} */
function load() {
  if (!existsSync(MODLOG_FILE)) return { nextCaseId: 1, cases: [] };
  try {
    return JSON.parse(readFileSync(MODLOG_FILE, "utf8"));
  } catch {
    return { nextCaseId: 1, cases: [] };
  }
}

/** @param {ModlogStore} data */
function save(data) {
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
  writeFileSync(MODLOG_FILE, JSON.stringify(data, null, 2), "utf8");
}

/**
 * Record a new moderation case.
 * @param {string} userId
 * @param {ActionType} type
 * @param {string} reason
 * @param {string} moderatorId
 * @returns {CaseEntry}
 */
export function addCase(userId, type, reason, moderatorId) {
  const data = load();
  const entry = {
    caseId: data.nextCaseId,
    userId,
    moderatorId,
    type,
    reason,
    timestamp: new Date().toISOString(),
  };
  data.cases.push(entry);
  data.nextCaseId += 1;
  save(data);
  return entry;
}

/**
 * Get all cases for a specific user.
 * @param {string} userId
 * @returns {CaseEntry[]}
 */
export function getCases(userId) {
  const { cases } = load();
  return cases.filter((c) => c.userId === userId);
}

/**
 * Get a single case by its numeric ID.
 * @param {number} caseId
 * @returns {CaseEntry | null}
 */
export function getCaseById(caseId) {
  const { cases } = load();
  return cases.find((c) => c.caseId === caseId) ?? null;
}

/**
 * Update only the reason of an existing case.
 * @param {number} caseId
 * @param {string} newReason
 * @returns {CaseEntry | null}
 */
export function updateCaseReason(caseId, newReason) {
  const data = load();
  const entry = data.cases.find((c) => c.caseId === caseId);
  if (!entry) return null;
  entry.reason = newReason;
  save(data);
  return entry;
}

/**
 * Delete a case by its numeric ID.
 * @param {number} caseId
 * @returns {boolean} true if a case was removed
 */
export function deleteCase(caseId) {
  const data = load();
  const before = data.cases.length;
  data.cases = data.cases.filter((c) => c.caseId !== caseId);
  if (data.cases.length === before) return false;
  save(data);
  return true;
}
