import axios from "axios";
import cheerio from "cheerio";
import { setReminder } from "./reminderService.js";
import { checkFileAndDelete, messageAdmin } from "./utility.js";
import config from "./config.js";

/* ---------------- HELPERS ---------------- */

function formatContest(contest) {
  const startTime = new Date(contest.start).toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const durationHours = Math.floor(contest.duration / 3600);
  const durationMinutes = Math.floor((contest.duration % 3600) / 60);
  const duration =
    durationHours > 0
      ? `${durationHours}h ${durationMinutes}m`
      : `${durationMinutes}m`;

  const icon =
    config.platforms.icons[contest.host] || config.platforms.icons.default;

  return `${icon} *${contest.name}*
⏰ *Time:* ${startTime}
⏳ *Duration:* ${duration}
🔗 ${contest.url}\n\n`;
}

/* ---------------- FETCHERS ---------------- */

async function fetchCodeforces() {
  const res = await axios.get("https://codeforces.com/api/contest.list");
  return res.data.result
    .filter(c => c.phase === "BEFORE")
    .map(c => ({
      name: c.name,
      start: c.startTimeSeconds * 1000,
      duration: c.durationSeconds,
      url: `https://codeforces.com/contest/${c.id}`,
      host: "codeforces.com"
    }));
}

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
      `
    },
    {
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "Mozilla/5.0",
        "Referer": "https://leetcode.com"
      }
    }
  );

  return res.data.data.contestV2UpcomingContests.map(c => ({
    name: c.title,
    start: c.startTime * 1000,
    duration: c.duration,
    url: "https://leetcode.com/contest/",
    host: "leetcode.com"
  }));
}

async function fetchAtCoder() {
  const html = await axios.get("https://atcoder.jp/contests/", {
    headers: { "User-Agent": "Mozilla/5.0" }
  });

  const $ = cheerio.load(html.data);
  const contests = [];

  $("#contest-table-upcoming tbody tr").each((_, el) => {
    const name = $(el).find("td").eq(1).text().trim();
    const link = "https://atcoder.jp" + $(el).find("a").attr("href");
    const start = new Date($(el).find("time").attr("datetime")).getTime();
    const durationText = $(el).find("td").eq(2).text().trim();
    const [h, m] = durationText.split(":").map(Number);

    contests.push({
      name,
      start,
      duration: h * 3600 + m * 60,
      url: link,
      host: "atcoder.jp"
    });
  });

  return contests;
}

async function fetchCodeChef() {
  const html = await axios.get("https://www.codechef.com/contests", {
    headers: { "User-Agent": "Mozilla/5.0" }
  });

  const $ = cheerio.load(html.data);
  const contests = [];

  $("#future-contests-data tbody tr").each((_, el) => {
    const tds = $(el).find("td");
    const name = tds.eq(1).text().trim();
    const link = "https://www.codechef.com" + tds.eq(1).find("a").attr("href");

    const start = new Date(tds.eq(2).text().trim()).getTime();
    const durationText = tds.eq(3).text().trim();
    const [h, m] = durationText.split(":").map(Number);

    contests.push({
      name,
      start,
      duration: h * 3600 + m * 60,
      url: link,
      host: "codechef.com"
    });
  });

  return contests;
}

/* ---------------- MAIN ---------------- */

export async function fetchData(sock) {
  try {
    const [cf, lc, ac, cc] = await Promise.all([
      fetchCodeforces(),
      fetchLeetCode(),
      fetchAtCoder(),
      fetchCodeChef()
    ]);

    const all = [...cf, ...lc, ...ac, ...cc];

    const now = Date.now();
    const twoDaysLater = now + 2 * 24 * 60 * 60 * 1000;

    const filtered = all.filter(c => c.start >= now && c.start <= twoDaysLater);

    let message = "*✨ Upcoming Contests ✨*\n\n";

    for (const contest of filtered) {
      const msg = formatContest(contest);
      message += msg;
      setReminder(msg, contest.start).catch(() => {});
    }

    if (await checkFileAndDelete()) {
      return sock.sendMessage(config.notification.helpNumber, { text: message });
    }
  } catch (err) {
    return messageAdmin(sock, `Contest fetch failed: ${err.message}`);
  }
}

