// Upcoming flights: kept encrypted in private/upcoming.enc.json so the schedule is never
// public. Only the build (and the scheduled check), which hold the key, can read it.
// Shared by the site build (src/lib/now.ts) and the command line tool (scripts/upcoming.mjs).
import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'node:crypto';
import { parse } from 'yaml';

export const ENCRYPTED_FILE = 'private/upcoming.enc.json';

// A flight shows as "in the air" from this long after scheduled departure (taxi time)...
const AIRBORNE_AFTER_MIN = 15;
// ...and a flight goes into the public Logbook this long after scheduled arrival.
const LOG_AFTER_LANDING_MIN = 30;

// Time zones for converting the local departure and arrival times in the schedule.
export const TIMEZONES = {
  PVG: 'Asia/Shanghai', SHA: 'Asia/Shanghai', PEK: 'Asia/Shanghai', PKX: 'Asia/Shanghai', CAN: 'Asia/Shanghai',
  SZX: 'Asia/Shanghai', CTU: 'Asia/Shanghai', TFU: 'Asia/Shanghai', HGH: 'Asia/Shanghai', XMN: 'Asia/Shanghai',
  HKG: 'Asia/Hong_Kong', MFM: 'Asia/Macau', TPE: 'Asia/Taipei',
  HND: 'Asia/Tokyo', NRT: 'Asia/Tokyo', KIX: 'Asia/Tokyo', NGO: 'Asia/Tokyo', CTS: 'Asia/Tokyo', OKA: 'Asia/Tokyo',
  ICN: 'Asia/Seoul', GMP: 'Asia/Seoul',
  SIN: 'Asia/Singapore', KUL: 'Asia/Kuala_Lumpur', BKK: 'Asia/Bangkok', MNL: 'Asia/Manila', DPS: 'Asia/Makassar',
  DOH: 'Asia/Qatar', DXB: 'Asia/Dubai', IST: 'Europe/Istanbul',
  HEL: 'Europe/Helsinki', LHR: 'Europe/London', CDG: 'Europe/Paris', AMS: 'Europe/Amsterdam',
  FRA: 'Europe/Berlin', MUC: 'Europe/Berlin', ZRH: 'Europe/Zurich', FCO: 'Europe/Rome', MAD: 'Europe/Madrid',
  BCN: 'Europe/Madrid', KEF: 'Atlantic/Reykjavik',
  JFK: 'America/New_York', LGA: 'America/New_York', EWR: 'America/New_York', BOS: 'America/New_York',
  IAD: 'America/New_York', DCA: 'America/New_York', PHL: 'America/New_York', PIT: 'America/New_York',
  CLT: 'America/New_York', ATL: 'America/New_York', MIA: 'America/New_York', MCO: 'America/New_York',
  DTW: 'America/Detroit', BDL: 'America/New_York', ISP: 'America/New_York',
  ORD: 'America/Chicago', DFW: 'America/Chicago', IAH: 'America/Chicago', MSP: 'America/Chicago',
  DEN: 'America/Denver', SLC: 'America/Denver', PHX: 'America/Phoenix',
  LAX: 'America/Los_Angeles', SFO: 'America/Los_Angeles', SEA: 'America/Los_Angeles', SAN: 'America/Los_Angeles',
  LAS: 'America/Los_Angeles', YYZ: 'America/Toronto', YVR: 'America/Vancouver', YYC: 'America/Edmonton',
  HNL: 'Pacific/Honolulu', ANC: 'America/Anchorage', SYD: 'Australia/Sydney', MEL: 'Australia/Melbourne',
};

// ---------- Encryption (AES-256-GCM with a key derived from the passphrase) ----------

export function encrypt(plaintext, passphrase) {
  const salt = randomBytes(16);
  const iv = randomBytes(12);
  const key = scryptSync(passphrase, salt, 32);
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  const data = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  return JSON.stringify(
    {
      note: 'Encrypted. Only the site build, which has the key, can read this.',
      v: 1,
      salt: salt.toString('base64'),
      iv: iv.toString('base64'),
      tag: cipher.getAuthTag().toString('base64'),
      data: data.toString('base64'),
    },
    null,
    2,
  );
}

export function decrypt(fileText, passphrase) {
  const f = JSON.parse(fileText);
  const key = scryptSync(passphrase, Buffer.from(f.salt, 'base64'), 32);
  const decipher = createDecipheriv('aes-256-gcm', key, Buffer.from(f.iv, 'base64'));
  decipher.setAuthTag(Buffer.from(f.tag, 'base64'));
  return Buffer.concat([decipher.update(Buffer.from(f.data, 'base64')), decipher.final()]).toString('utf8');
}

// ---------- Times ----------

function offsetMs(utcMs, timeZone) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).formatToParts(new Date(utcMs));
  const p = Object.fromEntries(parts.map((x) => [x.type, Number(x.value)]));
  return Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second) - utcMs;
}

/** "2026-11-20 19:55" at an airport -> milliseconds since epoch (UTC). */
export function localToUtc(local, airport) {
  const timeZone = TIMEZONES[airport];
  if (!timeZone) throw new Error(`No time zone for ${airport}. Add it to TIMEZONES in scripts/upcoming-lib.mjs.`);
  const m = String(local).match(/^(\d{4})-(\d{2})-(\d{2})[ T](\d{1,2}):(\d{2})$/);
  if (!m) throw new Error(`Couldn't read the time "${local}". Write it like 2026-11-20 19:55.`);
  const guess = Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5]);
  let utc = guess - offsetMs(guess, timeZone);
  utc = guess - offsetMs(utc, timeZone); // second pass settles daylight-saving edges
  return utc;
}

// ---------- The schedule ----------

/** Parse the decrypted schedule into legs with UTC times, oldest first. */
export function parseSchedule(yamlText) {
  const list = parse(yamlText) ?? [];
  return list
    .map((l) => ({
      airline: l.airline,
      flight: l.flight,
      from: String(l.from).toUpperCase(),
      to: String(l.to).toUpperCase(),
      departsLocal: String(l.departs),
      departs: localToUtc(l.departs, String(l.from).toUpperCase()),
      arrives: localToUtc(l.arrives, String(l.to).toUpperCase()),
      aircraft: l.aircraft,
      cabin: l.cabin,
      seat: l.seat,
    }))
    .sort((a, b) => a.departs - b.departs);
}

/** The leg in the air at `now`, as cities only: { from, to } airport codes, or null. */
export function inTheAir(legs, now) {
  const leg = legs.find((l) => now >= l.departs + AIRBORNE_AFTER_MIN * 60e3 && now < l.arrives);
  return leg ? { from: leg.from, to: leg.to } : null;
}

/** Legs that have landed by `now` and can go into the public Logbook. */
export function landed(legs, now) {
  return legs.filter((l) => now >= l.arrives + LOG_AFTER_LANDING_MIN * 60e3);
}

export function formatDuration(ms) {
  const min = Math.round(ms / 60e3);
  const h = Math.floor(min / 60);
  const m = min % 60;
  return h ? (m ? `${h}h ${m}m` : `${h}h`) : `${m}m`;
}

/** The state the site should show, as published in /now.json. */
export function siteState(legs, now) {
  const leg = inTheAir(legs, now);
  return leg ? { flying: true, from: leg.from, to: leg.to } : { flying: false };
}
