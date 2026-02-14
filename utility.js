import fs from "fs/promises";
import config from "./config.js";

async function messageAdmin(sock, errString) {
  if (!sock) {
    // CLI / test mode
    console.error("ADMIN ERROR:", errString);
    return;
  }

  try {
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

export { messageAdmin, checkFileAndDelete };
