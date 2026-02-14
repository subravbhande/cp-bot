import fs from "fs/promises";
import config from "./config.js";

async function messageAdmin(sock, errString) {
  // 🚨 HARD GUARD
  if (!sock || typeof sock.sendMessage !== "function") {
    console.error("ADMIN ERROR:", errString);
    return;
  }

  try {
    await sock.sendMessage(
      config.notification.helpNumber,
      { text: errString }
    );
  } catch (err) {
    console.error("Failed to send error message:", err.message);
  }
}

async function checkFileAndDelete() {
  try {
    await fs.stat(config.paths.reminderFile);
    await fs.unlink(config.paths.reminderFile);
    return true;
  } catch (err) {
    if (err.code === "ENOENT") return true;
    console.error("Reminder file error:", err.message);
    return false;
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export { messageAdmin, checkFileAndDelete, sleep };

