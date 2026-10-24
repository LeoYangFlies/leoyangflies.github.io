#!/usr/bin/env node
// Command line tool for the encrypted upcoming-flights schedule.
//
//   node scripts/upcoming.mjs encrypt <schedule.yaml>   writes private/upcoming.enc.json
//   node scripts/upcoming.mjs decrypt                    prints the schedule (keep it private!)
//   node scripts/upcoming.mjs check                      used by the scheduled GitHub job
//
// The key comes from the UPCOMING_FLIGHTS_KEY environment variable. Nothing this tool
// prints in "check" mode reveals the schedule, because GitHub job logs are public.
import { appendFileSync, existsSync, readFileSync, writeFileSync } from 'node:fs';
import { parse } from 'yaml';
import { ENCRYPTED_FILE, decrypt, encrypt, formatDuration, landed, parseSchedule, siteState } from './upcoming-lib.mjs';

const SITE = process.env.SITE_URL || 'https://leoyangflies.github.io';
const FLIGHTS = 'src/data/flights.yaml';
const key = process.env.UPCOMING_FLIGHTS_KEY;
const now = process.env.NOW_OVERRIDE ? Date.parse(process.env.NOW_OVERRIDE) : Date.now();
const [command, arg] = process.argv.slice(2);

function output(name, value) {
  if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, `${name}=${value}\n`);
}

if (command === 'encrypt') {
  if (!key) throw new Error('Set UPCOMING_FLIGHTS_KEY first.');
  const text = readFileSync(arg, 'utf8');
  const count = parseSchedule(text).length; // fails early on bad times or airports
  writeFileSync(ENCRYPTED_FILE, encrypt(text, key) + '\n');
  console.log(`Encrypted ${count} flights into ${ENCRYPTED_FILE}.`);
} else if (command === 'decrypt') {
  if (!key) throw new Error('Set UPCOMING_FLIGHTS_KEY first.');
  process.stdout.write(decrypt(readFileSync(ENCRYPTED_FILE, 'utf8'), key));
} else if (command === 'check') {
  // Decide whether the live site needs rebuilding, and log any flights that have landed.
  if (!key || !existsSync(ENCRYPTED_FILE)) {
    console.log('No key or schedule; nothing to check.');
    output('deploy', 'false');
    process.exit(0);
  }
  const legs = parseSchedule(decrypt(readFileSync(ENCRYPTED_FILE, 'utf8'), key));

  // 1. Has the "in the air" state changed compared with what the live site shows?
  const wanted = JSON.stringify(siteState(legs, now));
  let live = '';
  try {
    const res = await fetch(`${SITE}/now.json?t=${now}`, { cache: 'no-store' });
    live = res.ok ? JSON.stringify(await res.json()) : '';
  } catch {
    live = '';
  }
  const stateChanged = wanted !== live;

  // 2. Add landed flights to the public Logbook, unless they're already there.
  const logText = readFileSync(FLIGHTS, 'utf8');
  const logged = (parse(logText) ?? []).map((f) => `${String(f.date).slice(0, 10)}|${f.from}|${f.to}`);
  const fresh = landed(legs, now).filter((l) => !logged.includes(`${l.departsLocal.slice(0, 10)}|${l.from}|${l.to}`));
  if (fresh.length) {
    const lines = fresh.map((l) => {
      const parts = [
        `date: ${l.departsLocal.slice(0, 10)}`,
        `airline: ${l.airline}`,
        l.flight && `flight: ${l.flight}`,
        `from: ${l.from}`,
        `to: ${l.to}`,
        l.aircraft && `aircraft: ${l.aircraft}`,
        l.cabin && `cabin: ${l.cabin}`,
        l.seat && `seat: ${l.seat}`,
        `duration: ${formatDuration(l.arrives - l.departs)}`,
      ].filter(Boolean);
      return `- { ${parts.join(', ')} }`;
    });
    const header = logText.includes('# Added automatically after landing') ? '' : '\n# Added automatically after landing\n';
    writeFileSync(FLIGHTS, logText.replace(/\n*$/, '\n') + header + lines.join('\n') + '\n');
  }

  console.log(`Schedule readable (${legs.length} flights on file). Newly logged: ${fresh.length}.`);
  output('deploy', String(stateChanged || fresh.length > 0));
  output('logged', String(fresh.length > 0));
} else {
  console.log('Usage: node scripts/upcoming.mjs encrypt <file.yaml> | decrypt | check');
  process.exit(1);
}
