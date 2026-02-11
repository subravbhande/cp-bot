import {
    DisconnectReason,
    useMultiFileAuthState,
    makeWASocket,
    fetchLatestBaileysVersion,
    makeCacheableSignalKeyStore
} from '@whiskeysockets/baileys';

import { fetchData } from "./getContestDetails.js";
import { IDS } from "./ids.js";
import pino from 'pino';
import QRCode from 'qrcode';
import config from './config.js';
import { messageAdmin, sleep } from './utility.js';
import NodeCache from "node-cache";
import https from 'https';

const logger = pino({ level: 'silent' });

export const groupCache = new NodeCache({
    stdTTL: 5 * 60,
    useClones: false
});

async function connectionLogic(functionToExecute) {
    try {
        const { state, saveCreds } = await useMultiFileAuthState(config.paths.authInfo);
        const { version } = await fetchLatestBaileysVersion();

        const sock = makeWASocket({
            version,
            auth: {
                creds: state.creds,
                keys: makeCacheableSignalKeyStore(state.keys, logger),
            },
            logger,
            markOnlineOnConnect: true,
            generateHighQualityLinkPreview: true,
            cachedGroupMetadata: async (jid) => groupCache.get(jid),
            options: {
                httpsAgent: new https.Agent({
                    rejectUnauthorized: false
                })
            },
            syncFullHistory: false
        });

        sock.ev.on('connection.update', async (update) => {
            const { connection, lastDisconnect, qr } = update;

            if (qr) {
                await QRCode.toFile(config.paths.qrCodeFile, qr);
                console.log(`QR Code saved to: ${config.paths.qrCodeFile}`);
            }

            if (connection === 'close') {
                const statusCode = lastDisconnect?.error?.output?.statusCode;

                if (statusCode === DisconnectReason.loggedOut) {
                    console.log("Logged out. Please re-authenticate.");
                    return;
                }

                console.log("Connection closed. Reconnecting...");
                connectionLogic(functionToExecute);
            }

            if (connection === 'open') {
                console.log("WhatsApp connected successfully.");

                if (typeof functionToExecute === 'function') {
                    await functionToExecute(sock);
                }
            }
        });

        sock.ev.on('creds.update', saveCreds);

    } catch (error) {
        console.error("Error in connection logic:", error.message);
    }
}

async function moveFurther(sock) {
    try {
        const payload = await fetchData(sock);

        if (!payload || payload.length === 0) {
            console.log("No contests found.");
            return;
        }

        let successCount = 0;

        for (const id of IDS) {
            try {
                if (id.endsWith('@g.us')) {
                    const metadata = await sock.groupMetadata(id);
                    groupCache.set(id, metadata);
                }

                await sock.sendMessage(id, { text: payload });
                await sleep(3000);

                console.log(`Message sent to: ${id}`);
                successCount++;

            } catch (err) {
                console.error(`Failed to send message to ${id}:`, err.message);
            }
        }

        console.log(`Successfully sent to ${successCount} recipients.`);

    } catch (error) {
        console.error("Error while sending messages:", error.message);
        await messageAdmin(sock, `Error: ${error.message}`);
    }
}

export { connectionLogic, moveFurther };
