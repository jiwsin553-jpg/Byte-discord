const { run } = require("../database/db");

async function logToDb(guildId, level, message, meta = null) {
  const createdAt = Date.now();
  const metaText = meta ? JSON.stringify(meta) : null;
  await run(
    "INSERT INTO logs (guild_id, level, message, meta, created_at) VALUES (?, ?, ?, ?, ?)",
    [guildId, level, message, metaText, createdAt]
  );
}

async function logToChannel(channel, config, level, message) {
  if (!channel) return;
  const prefix = level.toUpperCase();
  await channel.send({
    content: `[${config.botName}] ${prefix}: ${message}`
  });
}

module.exports = {
  logToDb,
  logToChannel
};
