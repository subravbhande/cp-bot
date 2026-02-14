import Parser from "rss-parser";
import cheerio from "cheerio";
import { setReminder } from "./reminderService.js";
import { checkFileAndDelete, messageAdmin } from "./utility.js";
import config from "./config.js";

const rssParser = new Parser();

function normalizeContest({ name, start, duration, url, host }) {
    return {
        event: name,
        start,
        duration,
        href: url,
        host
    };
}

/* ---------------- CODEFORCES ---------------- */
async function fetchCodeforces() {
    const res = await fetch("https://codeforces.com/api/contest.list");
    const data = await res.json();

    return data.result
        .filter(c => c.phase === "BEFORE")
        .map(c =>
            normalizeContest({
                name: c.name,
                start: new Date(c.startTimeSeconds * 1000).toISOString(),
                duration: c.durationSeconds,
                url: `https://codeforces.com/contests/${c.id}`,
                host: "codeforces.com"
            })
        );
}

/* ---------------- CODECHEF ---------------- */
async function fetchCodeChef() {
    const feed = await rssParser.parseURL("https://www.codechef.com/events/feed");
    return feed.items.map(item =>
        normalizeContest({
            name: item.title,
            start: new Date(item.isoDate).toISOString(),
            duration: 3 * 60 * 60,
            url: item.link,
            host: "codechef.com"
        })
    );
}

/* ---------------- LEETCODE ---------------- */
async function fetchLeetCode() {
    const res = await fetch("https://leetcode.com/graphql", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            query: `
            query {
              contestUpcomingContests {
                title
                startTime
                duration
                titleSlug
              }
            }`
        })
    });

    const json = await res.json();
    return json.data.contestUpcomingContests.map(c =>
        normalizeContest({
            name: c.title,
            start: new Date(c.startTime * 1000).toISOString(),
            duration: c.duration,
            url: `https://leetcode.com/contest/${c.titleSlug}`,
            host: "leetcode.com"
        })
    );
}

/* ---------------- ATCODER ---------------- */
async function fetchAtCoder() {
    const res = await fetch("https://atcoder.jp/contests/");
    const html = await res.text();
    const $ = cheerio.load(html);

    const contests = [];
    $("#contest-table-upcoming tbody tr").each((_, el) => {
        const cols = $(el).find("td");
        const name = $(cols[1]).text().trim();
        const url = "https://atcoder.jp" + $(cols[1]).find("a").attr("href");
        const start = new Date($(cols[0]).text().trim()).toISOString();
        const durationText = $(cols[2]).text().trim();
        const [h, m] = durationText.split(":").map(Number);

        contests.push(
            normalizeContest({
                name,
                start,
                duration: h * 3600 + m * 60,
                url,
                host: "atcoder.jp"
            })
        );
    });

    return contests;
}

/* ---------------- MAIN FUNCTION ---------------- */
export async function fetchData(sock) {
    try {
        const contests = [
            ...(await fetchCodeforces()),
            ...(await fetchCodeChef()),
            ...(await fetchLeetCode()),
            ...(await fetchAtCoder())
        ];

        const now = new Date();
        const twoDaysLater = new Date();
        twoDaysLater.setDate(now.getDate() + 2);

        const filtered = contests.filter(c => {
            const start = new Date(c.start);
            return start >= now && start <= twoDaysLater;
        });

        if (await checkFileAndDelete()) {
            return filtered.length ? createMessage(filtered) : createMessage([]);
        }

        return messageAdmin(sock, "Failed to clear reminder file");
    } catch (err) {
        return messageAdmin(sock, `Contest fetch error: ${err.message}`);
    }
}
