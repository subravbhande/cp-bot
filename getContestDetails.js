import axios from "axios";
import * as cheerio from "cheerio";
import { setReminder } from "./reminderService.js";
import { checkFileAndDelete, messageAdmin } from "./utility.js";
import config from "./config.js";

const IST_OFFSET = 5.5 * 60 * 60 * 1000;

/* ---------- FORMAT ---------- */

function formatContest(c) {
  const time = new Date(c.start).toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const h = Math.floor(c.duration / 3600);
  const m = Math.floor((c.duration % 3600) / 60);
  const dur = h ? `${h}h ${m}m` : `${m}m`;

  const icon =
    config.platforms.icons[c.host] || config.platforms.icons.default;

  return `${icon} *${c.name}*
⏰ ${time}
⏳ ${dur}
🔗 ${c.url}\n\n`;
}

/* ---------- FETCHERS ---------- */

async function fetchCodeforces() {
  const { data } = await axios.get(
    "https://codeforces.com/api/contest.list"
  );

  return data.result
    .filter(c => c.phase === "BEFORE")
    .map(c => ({
      name: c.name,
      start: c.startTimeSeconds * 1000 + IST_OFFSET,
      duration: c.durationSeconds,
      url: `https://codeforces.com/contest/${c.id}`,
      host: "codeforces.com"
    }));
}

async function fetchLeetCode() {
  const { data } = await axios.post(
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

  return data.data.contestV2UpcomingContests.map(c => ({
    name: c.title,
    start: c.startTime * 1000 + IST_OFFSET,
    duration: c.duration,
    url: "https://leetcode.com/contest/",
    host: "leetcode.com"
  }));
}

async function fetchAtCoder() {
  const { data } = await axios.get("https://atcoder.jp/contests/", {
    headers: { "User-Agent": "Mozilla/5.0" }
  });

  const $ = cheerio.load(data);
  const contests = [];

  $("#contest-table-upcoming tbody tr").each((_, el) => {
    const name = $(el).find("td").eq(1).text().trim();
    const url = "https://atcoder.jp" + $(el).find("a").attr("href");

    const start =
      new Date($(el).find("time").attr("datetime")).getTime() +
      IST_OFFSET;

    const [h, m] = $(el)
      .find("td")
      .eq(2)
      .text()
      .trim()
      .split(":")
      .map(Number);

    contests.push({
      name,
      start,
      duration: h * 3600 + m * 60,
      url,
      host: "atcoder.jp"
    });
  });

  return contests;
}

async function fetchCodeChef() {
  const { data } = await axios.get("https://www.codechef.com/contests", {
    headers: { "User-Agent": "Mozilla/5.0" }
  });

  const $ = cheerio.load(data);
  const contests = [];

  $("#future-contests-data tbody tr").each((_, el) => {
    const tds = $(el).find("td");

    const name = tds.eq(1).text().trim();
    const url =
      "https://www.codechef.com" +
      tds.eq(1).find("a").attr("href");

    const start =
      new Date(tds.eq(2).text().trim()).getTime() +
      IST_OFFSET;

    const [h, m] = tds.eq(3).text().trim().split(":").map(Number);

    contests.push({
      name,
      start,
      duration: h * 3600 + m * 60,
      url,
      host: "codechef.com"
    });
  });

  return contests;
}

/* ---------- MAIN ---------- */

export async function fetchData(sock) {
  try {
    const [cf, lc, ac, cc] = await Promise.all([
      fetchCodeforces(),
      fetchLeetCode(),
      fetchAtCoder(),
      fetchCodeChef()
    ]);

    const now = Date.now();
    const twoDaysLater = now + 2 * 24 * 60 * 60 * 1000;

    const contests = [...cf, ...lc, ...ac, ...cc]
      .filter(c => c.start >= now && c.start <= twoDaysLater)
      .sort((a, b) => a.start - b.start);

    let message = "*✨ Upcoming Contests ✨*\n\n";

    for (const c of contests) {
      const m = formatContest(c);
      message += m;
      setReminder(m, c.start).catch(() => {});
    }

    // WhatsApp mode
    if (sock) {
      if (await checkFileAndDelete()) {
        return sock.sendMessage(
          config.notification.helpNumber,
          { text: message }
        );
      }
      return;
    }

    // CLI / test mode
    return message;

  } catch (err) {
    if (sock) {
      return messageAdmin(sock, `Contest fetch failed: ${err.message}`);
    }
    console.error("Contest fetch failed:", err.message);
    return null;
  }
}
