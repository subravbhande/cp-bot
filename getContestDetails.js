import axios from "axios";
import * as cheerio from "cheerio";
import { setReminder } from "./reminderService.js";
import { checkFileAndDelete, messageAdmin } from "./utility.js";
import config from "./config.js";

/* ================= CONSTANTS ================= */

const IST_OFFSET = 5.5 * 60 * 60 * 1000;

/* ================= HELPERS ================= */

function formatContest(contest) {
  const startTime = new Date(contest.start).toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const h = Math.floor(contest.duration / 3600);
  const m = Math.floor((contest.duration % 3600) / 60);
  const duration = h > 0 ? `${h}h ${m}m` : `${m}m`;

  const icon =
    config.platforms.icons[contest.host] || config.platforms.icons.default;

  return `${icon} *${contest.name}*
⏰ *Time:* ${startTime}
⏳ *Duration:* ${duration}
🔗 ${contest.url}\n\n`;
}

async function safeFetch(fn, name) {
  try {
    return await fn();
  } catch (err) {
    console.error(`❌ ${name} failed:`, err.message);
    return [];
  }
}

/* ================= FETCHERS ================= */

/* -------- Codeforces -------- */
async function fetchCodeforces() {
  const res = await axios.get("https://codeforces.com/api/contest.list");

  return res.data.result
    .filter(c => c.phase === "BEFORE")
    .map(c => ({
      name: c.name,
      start: c.startTimeSeconds * 1000 + IST_OFFSET,
      duration: c.durationSeconds,
      url: `https://codeforces.com/contest/${c.id}`,
      host: "codeforces.com",
    }));
}

/* -------- LeetCode -------- */
async function fetchLeetCode() {
  const res = await axios.post(
    "https://leetcode.com/graphql",
    {
      query: `
        query {
          contestV2UpcomingContests {
            title
            startTime
            duration
          }
        }
      `,
    },
    {
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "Mozilla/5.0",
        Referer: "https://leetcode.com",
      },
    }
  );

  return res.data.data.contestV2UpcomingContests.map(c => ({
    name: c.title,
    start: c.startTime * 1000 + IST_OFFSET,
    duration: c.duration,
    url: "https://leetcode.com/contest/",
    host: "leetcode.com",
  }));
}

/* -------- AtCoder -------- */
async function fetchAtCoder() {
  const html = await axios.get("https://atcoder.jp/contests/", {
    headers: { "User-Agent": "Mozilla/5.0" },
  });

  const $ = cheerio.load(html.data);
  const contests = [];

  $("#contest-table-upcoming tbody tr").each((_, el) => {
    const name = $(el).find("td").eq(1).text().trim();
    const href = $(el).find("a").attr("href");
    const time = $(el).find("time").attr("datetime");

    if (!name || !href || !time) return;

    const start = Date.parse(time);
    if (isNaN(start)) return;

    const [h, m] = $(el)
      .find("td")
      .eq(2)
      .text()
      .trim()
      .split(":")
      .map(Number);

    contests.push({
      name,
      start: start + IST_OFFSET,
      duration: h * 3600 + m * 60,
      url: "https://atcoder.jp" + href,
      host: "atcoder.jp",
    });
  });

  return contests;
}

/* -------- CodeChef -------- */
async function fetchCodeChef() {
  const html = await axios.get("https://www.codechef.com/contests", {
    headers: { "User-Agent": "Mozilla/5.0" },
  });

  const $ = cheerio.load(html.data);
  const contests = [];

  $("#future-contests-data tbody tr").each((_, el) => {
    const tds = $(el).find("td");

    const name = tds.eq(1).text().trim();
    const href = tds.eq(1).find("a").attr("href");
    const startText = tds.eq(2).text().trim();
    const durationText = tds.eq(3).text().trim();

    if (!name || !href || !startText || !durationText) return;

    const start = Date.parse(startText);
    if (isNaN(start)) return;

    const [h, m] = durationText.split(":").map(Number);

    contests.push({
      name,
      start: start + IST_OFFSET,
      duration: h * 3600 + m * 60,
      url: "https://www.codechef.com" + href,
      host: "codechef.com",
    });
  });

  return contests;
}

/* ================= MAIN ================= */

export async function fetchData(sock) {
  const cf = await safeFetch(fetchCodeforces, "Codeforces");
  const lc = await safeFetch(fetchLeetCode, "LeetCode");
  const ac = await safeFetch(fetchAtCoder, "AtCoder");
  const cc = await safeFetch(fetchCodeChef, "CodeChef");

  const all = [...cf, ...lc, ...ac, ...cc];

  const now = Date.now();
  const twoDaysLater = now + 2 * 24 * 60 * 60 * 1000;

  const filtered = all.filter(
    c => c.start >= now && c.start <= twoDaysLater
  );

  if (!filtered.length) {
    return "No upcoming contests found in next 48 hours.";
  }

  let message = "*✨ Upcoming Contests ✨*\n\n";

  for (const contest of filtered) {
    const msg = formatContest(contest);
    message += msg;
    setReminder(msg, contest.start).catch(() => {});
  }

  await checkFileAndDelete();

  return message;
}

