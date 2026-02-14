import fs from "fs/promises";
import config from "./config.js";

/**
 * Send error/info message to admin.
 * Works both in WhatsApp runtime and CLI test mode.
 */
async function messageAdmin(sock, errString) {
  // ✅ CLI / test mode (no WhatsApp socket)
  if (!sock) {
    console.error("ADMIN MESSAGE:", errString);
    return errString;
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

/**
 * Clears reminder file if exists
 */
async function checkFileAndDelete() {
  try {
    await fs.stat(config.paths.reminderFile);
    await fs.unlink(config.paths.reminderFile);
    return true;
  } catch (err) {
    if (err.code === "ENOENT") {
      // file doesn't exist → not an error
      return true;
    }
    console.error("Something went wrong:", err);
    return false;
  }
}

/**
 * Sleep helper
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export { messageAdmin, checkFileAndDelete, sleep };
