import fs from "fs/promises";
import config from "./config.js";

async function messageAdmin(sock, errString) {
  try {
    // CLI / test mode safety
    if (!sock) {
      console.error("ADMIN MESSAGE:", errString);
      return errString;
    }

    return await sock.sendMessage(
      config.notification.helpNumber,
      { text: errString }
    );
  } catch (err) {
    console.error("Failed to send error message:", err);
  }
}

async function checkFileAndDelete() {
  try {
    await fs.stat(config.paths.reminderFile);
    await fs.unlink(config.paths.reminderFile);
    return true;
  } catch (err) {
    if (err.code === "ENOENT") {
      return true;
    }
    console.error("Reminder file error:", err);
    return false;
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export { messageAdmin, checkFileAndDelete, sleep };
