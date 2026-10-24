// Whether Leo is in the air right now, worked out when the site is built. A scheduled
// GitHub job rebuilds the site when a flight takes off and again when it lands.
// Only the current leg's two airports ever reach the public page: never the schedule,
// flight numbers or times.
import { existsSync, readFileSync } from 'node:fs';
// @ts-ignore - plain JavaScript module shared with the scheduled job
import { ENCRYPTED_FILE, decrypt, parseSchedule, siteState } from '../../scripts/upcoming-lib.mjs';

export type NowState = { flying: false } | { flying: true; from: string; to: string };

let cached: NowState | undefined;

export function getNow(): NowState {
  if (cached) return cached;
  const key = process.env.UPCOMING_FLIGHTS_KEY;
  if (!key || !existsSync(ENCRYPTED_FILE)) return (cached = { flying: false });
  const now = process.env.NOW_OVERRIDE ? Date.parse(process.env.NOW_OVERRIDE) : Date.now();
  const legs = parseSchedule(decrypt(readFileSync(ENCRYPTED_FILE, 'utf8'), key));
  return (cached = siteState(legs, now) as NowState);
}
