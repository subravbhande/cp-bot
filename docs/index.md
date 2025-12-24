# Contest-Reminder-WhatsApp-Bot

## Overview

**Contest-Reminder-WhatsApp-Bot** is an automated WhatsApp notification system designed to keep competitive programmers updated about upcoming coding contests from major platforms like CodeChef, Codeforces, LeetCode, and AtCoder. The bot sends daily contest schedules and automated reminders, ensuring you never miss an important competition.

## Why This Project?

### The Problem

As a competitive programmer, I found it challenging to keep track of contests across multiple platforms. Missing contests due to timezone confusion or simply forgetting about them was frustrating. Checking multiple websites daily for contest schedules was time-consuming and inefficient.

### The Solution

Contest-Reminder-WhatsApp-Bot automates this entire process by:

- **Centralizing Information**: Aggregates contest data from multiple platforms in one place
- **Proactive Notifications**: Sends daily updates directly to WhatsApp groups
- **Smart Reminders**: Sets automated reminders 30 minutes before each contest starts
- **Always Active**: Unlike social media platforms that users check occasionally, WhatsApp is continuously active on users' devices, ensuring timely notification delivery
- **Community Building**: Keeps coding communities informed and engaged

### Personal Motivation

This project was born from my passion for competitive programming and my desire to help fellow coders. I wanted to create a tool that:

1. **Saves Time**: No more manual checking of contest schedules
2. **Builds Community**: Keeps group members engaged and informed
3. **Improves Participation**: Increases contest participation rates
4. **Learns Technology**: Explore WhatsApp automation and scheduling systems
5. **Solves Real Problems**: Address a genuine pain point in the competitive programming community

## Key Features

### Automated Daily Notifications

- Sends contest schedules every day at 5:00 AM IST
- Includes today's and tomorrow's contests

### Smart Reminder System

- Automatic reminders 30 minutes before contest start time
- Checks every 30 minutes for upcoming contests

### Multi-Platform Support

Currently supports:

- **CodeChef**
- **Codeforces**
- **LeetCode**
- **AtCoder**

Can be easily extended to include more platforms.

## Quick Start

### Prerequisites

- Node.js v14 or newer
- npm v6 or newer
- WhatsApp account

### Installation

1. Clone the repository:

    ```bash
    git clone https://github.com/Vishal490404/Contest-Reminder-WhatsApp-Bot.git
    cd Contest-Reminder-WhatsApp-Bot
    ```

2. Install dependencies:

    ```bash
    npm install
    ```

3. Create `.env` file:

    ```env
    CLIST_USERNAME=your_username
    CLIST_API_KEY=your_api_key
    CLIST_API_URL=https://clist.by
    HELP_NUMBER=919876543210@s.whatsapp.net 
    # HELP_NUMBER is for sending error logs 
    ```

4. Start the service:

    ```bash
    npm start
    ```

5. Scan the QR code with WhatsApp to authenticate

## How It Works

1. **Scheduled Jobs**: Uses `node-schedule` to run tasks at specific times
2. **Contest Fetching**: Retrieves contest data from Clist API
3. **Message Formatting**: Creates messages with contest details
4. **WhatsApp Integration**: Uses Baileys library to send messages
5. **Reminder Management**: Stores and monitors upcoming contest reminders

### Daily Notification Format

```text
✨ Hello Chefs! 👨‍🍳 ✨

Today (Monday, 15/01/2024):

🏆 Codeforces Round #800
⏰ Time: 20:05
⏳ Duration: 2h
🔗 https://codeforces.com/contest/...

────────────────

Tomorrow (Tuesday, 16/01/2024):

💻 LeetCode Weekly Contest 350
⏰ Time: 08:00
⏳ Duration: 1h 30m
🔗 https://leetcode.com/contest/...

────────────────
Happy Coding and may your submissions be Accepted!😉
```

### Reminder Format

```text
🏆 Codeforces Round #800
⏰ Time: 20:05
⏳ Duration: 2h
🔗 https://codeforces.com/contest/...
```

## Technologies Used

- **Node.js**: Runtime environment
- **Baileys**: WhatsApp Web API library
- **node-schedule**: Job scheduling
- **Axios**: HTTP client for API calls
- **Pino**: Logging library

## Support

For issues, questions, or contributions, please visit the [GitHub repository](https://github.com/Vishal490404/Contest-Reminder-WhatsApp-Bot).

## Documentation Links

- [Baileys GitHub](https://github.com/WhiskeySockets/Baileys)
- [Node-Schedule Documentation](https://github.com/node-schedule/node-schedule)
- [Clist API Documentation](https://clist.by/api/v2/doc/)

---

**Built with passion for the competitive programming community**
