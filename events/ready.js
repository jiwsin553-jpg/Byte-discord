const cron = require("node-cron");
const { initDb, run } = require("../database/db");
const { backupDatabase, pruneBackups } = require("../utils/backup");
const { joinConfiguredVoice, keepAlive } = require("../utils/voice");
const { ensureTicketPanel } = require("../utils/panel");

module.exports = {
  name: "ready",
  once: true,
  async execute(client, config) {
    await initDb();

    cron.schedule("0 3 * * *", async () => {
      backupDatabase();
      pruneBackups(config.limits.logRetentionDays);
    });

    cron.schedule("0 4 * * *", async () => {
      const limit = Date.now() - config.limits.logRetentionDays * 24 * 60 * 60 * 1000;
      await run("DELETE FROM logs WHERE created_at < ?", [limit]);
    });

    await joinConfiguredVoice(client, config);
    keepAlive(client, config); // Manter bot conectado 24/7
    await ensureTicketPanel(client, config);

    console.log(`${config.botName} conectado como ${client.user.tag}`);
  }
};
