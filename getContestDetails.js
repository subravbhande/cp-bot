import axios from "axios";
import { setReminder } from "./reminderService.js";
import { checkFileAndDelete, messageAdmin } from "./utility.js";
import config from "./config.js";

function createMessage(filteredData) {
    const todayDate = new Date();
    const tomorrowDate = new Date(todayDate);
    tomorrowDate.setDate(tomorrowDate.getDate() + 1);

    const formattedDate = todayDate.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric"
    });
    const dayOfWeek = todayDate.toLocaleDateString("en-IN", { weekday: "long" });

    const formattedDateTomo = tomorrowDate.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric"
    });
    const dayOfWeekTomo = tomorrowDate.toLocaleDateString("en-IN", { weekday: "long" });

    const formatContest = (contest) => {
        const startTime = new Date(
            new Date(contest.start).getTime() + config.time.utcOffset
        ).toLocaleTimeString("en-IN", {
            hour: "2-digit",
            minute: "2-digit",
        });

        const durationHours = Math.floor(contest.duration / 3600);
        const durationMinutes = Math.floor((contest.duration % 3600) / 60);
        const durationStr =
            durationHours > 0
                ? `${durationHours}h${durationMinutes > 0 ? ` ${durationMinutes}m` : ""}`
                : `${durationMinutes}m`;

        const platformIcon =
            config.platforms.icons[contest.host] || config.platforms.icons.default;

        return `${platformIcon} *${contest.event}*
⏰ *Time:* ${startTime}
⏳ *Duration:* ${durationStr}
🔗 ${contest.href}\n\n`;
    };

    const todayContests = filteredData.filter((obj) => {
        const contestDate = new Date(obj.start);
        return (
            todayDate.getDate() === contestDate.getDate() &&
            todayDate.getMonth() === contestDate.getMonth() &&
            todayDate.getFullYear() === contestDate.getFullYear()
        );
    });

    const tomorrowContests = filteredData.filter((obj) => {
        const contestDate = new Date(obj.start);
        const tomorrow = new Date(todayDate);
        tomorrow.setDate(todayDate.getDate() + 1);
        return (
            tomorrow.getDate() === contestDate.getDate() &&
            tomorrow.getMonth() === contestDate.getMonth() &&
            tomorrow.getFullYear() === contestDate.getFullYear()
        );
    });

    let messageToSend = `
*✨ Hello Chefs! 👨‍🍳 ✨*

*Today* (${dayOfWeek}, ${formattedDate}):
`;

    if (todayContests.length > 0) {
        todayContests.forEach((contest) => {
            const createdMessage = formatContest(contest);
            setReminder(createdMessage, contest.start).catch((err) =>
                console.error(`Failed to set reminder: ${err.message}`)
            );
            messageToSend += createdMessage;
        });
    } else {
        messageToSend += "No contests today. Rest up! 🍹 And don't forget to practice\n\n";
    }

    messageToSend += "────────────────\n\n";
    messageToSend += `*Tomorrow* (${dayOfWeekTomo}, ${formattedDateTomo}):\n`;

    if (tomorrowContests.length > 0) {
        tomorrowContests.forEach((contest) => {
            messageToSend += formatContest(contest);
        });
    } else {
        messageToSend += "No contests tomorrow. Rest up! 🍬 And don't forget to practice\n";
    }

    messageToSend += "────────────────\n";
    messageToSend += "*Happy Coding and may your submissions be Accepted! 😉*";

    return messageToSend;
}

export async function fetchData(sock) {
    try {
        const start = new Date();
        start.setHours(5, 30, 0, 0); // IST base
        const startString = start.toISOString();

        // ✅ FIXED CLIST API CALL (v4 + Cloudflare safe)
        const response = await axios.get(config.api.clist.baseUrl, {
            headers: {
                Authorization: `ApiKey ${config.api.clist.username}:${config.api.clist.apiKey}`,
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
                Accept: "application/json"
            },
            params: {
                start__gt: startString,
                order_by: "start"
            }
        });

        if (response.data.objects.length > 0) {
            const cleanData = response.data.objects;

            const filteredData = cleanData.filter((obj) => {
                const startDate = new Date(obj.start);
                const today = new Date(start);
                const dayAfterTomorrow = new Date(start);

                today.setHours(0, 0, 0, 0);
                dayAfterTomorrow.setHours(23, 59, 59, 999);
                dayAfterTomorrow.setDate(today.getDate() + 2);

                startDate.setTime(startDate.getTime() + config.time.utcOffset);

                return (
                    config.platforms.hosts.includes(obj.host) &&
                    startDate < dayAfterTomorrow
                );
            });

            if (await checkFileAndDelete()) {
                return createMessage(filteredData);
            } else {
                return messageAdmin(
                    sock,
                    "Error clearing reminder file in getContestDetails.js"
                );
            }
        } else {
            return createMessage([]);
        }
    } catch (error) {
        return messageAdmin(
            sock,
            `Error fetching contest data: ${error.response?.status || error.message}`
        );
    }
}
