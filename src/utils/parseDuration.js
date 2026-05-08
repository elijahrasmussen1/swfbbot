/**
 * Parse a duration string like "30m", "2h", "7d" into milliseconds.
 * Supported units: s (seconds), m (minutes), h (hours), d (days).
 * Maximum duration is 28 days (Discord timeout ceiling).
 *
 * @param {string} str
 * @returns {number|null} milliseconds, or null if the string is not a valid duration
 */
export function parseDuration(str) {
  const match = str.match(/^(\d+)(s|m|h|d)$/i);
  if (!match) return null;
  const value = parseInt(match[1], 10);
  const unit = match[2].toLowerCase();
  const multipliers = { s: 1_000, m: 60_000, h: 3_600_000, d: 86_400_000 };
  const ms = value * multipliers[unit];
  const MAX_MS = 28 * 86_400_000;
  return ms > MAX_MS ? MAX_MS : ms;
}

/**
 * Format a duration in milliseconds to a human-readable string.
 * @param {number} ms
 * @returns {string}
 */
export function formatDuration(ms) {
  const days = Math.floor(ms / 86_400_000);
  const hours = Math.floor((ms % 86_400_000) / 3_600_000);
  const minutes = Math.floor((ms % 3_600_000) / 60_000);
  const seconds = Math.floor((ms % 60_000) / 1_000);
  const parts = [];
  if (days) parts.push(`${days}d`);
  if (hours) parts.push(`${hours}h`);
  if (minutes) parts.push(`${minutes}m`);
  if (seconds && !days && !hours) parts.push(`${seconds}s`);
  return parts.join(" ") || "0s";
}
