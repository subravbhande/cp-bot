# Challenges & Solutions

Key challenges encountered during development and how they were solved.

## Development Challenges

### 1. Finding a Free WhatsApp API

**Challenge:** Finding a reliable, free WhatsApp API for automation.

**Solution:** After extensive research, discovered the Baileys library - an open-source WhatsApp Web API that works without official API costs.

### 2. WhatsApp Group Updates

**Challenge:** Bot was failing to send messages to groups consistently due to changes in group metadata.

**Solution:** Implemented a caching mechanism to store and manage group metadate (e.g. new member added).

### 3. Task Scheduling

**Challenge:** Initial approach used Windows Task Scheduler with child processes, which wasn't cross-platform compatible.

**Solution:** Migrated to node-schedule for in-process scheduling. This kept the server running continuously and made the solution OS-independent.

### 4. 24/7 Uptime

**Challenge:** Running the bot 24/7 on a personal laptop required it to stay on constantly.

**Solution:** Deployed to Google Cloud's free tier machine, providing reliable uptime without keeping personal hardware running continuously.

## Current Challenges

### API Reliability

The Clist.by API is occasionally down during scheduled reminder times. Planning to implement fallback mechanisms using individual platform APIs (CodeChef, Codeforces, LeetCode, AtCoder).

### Library Updates

Baileys library undergoes frequent updates that sometimes introduce breaking changes. Requires ongoing attention and bot updates to maintain compatibility.

### Cloud Costs

While using Google Cloud's lifetime free tier, network usage still incurs minimal charges. Keeping costs optimized remains an ongoing consideration.

---

*Have you encountered other challenges? Contributions are welcome!*
