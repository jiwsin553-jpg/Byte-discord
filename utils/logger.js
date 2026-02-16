const { run } = require("../database/db");
const { EmbedBuilder } = require("discord.js");

async function logToDb(guildId, level, message, meta = null) {
  const createdAt = Date.now();
  const metaText = meta ? JSON.stringify(meta) : null;
  await run(
    "INSERT INTO logs (guild_id, level, message, meta, created_at) VALUES (?, ?, ?, ?, ?)",
    [guildId, level, message, metaText, createdAt]
  );
}

async function logToChannel(channel, config, level, message, details = null) {
  if (!channel) return;
  
  const emojis = {
    info: "<a:carregando1:1342856167927582720>",
    success: "<a:yes:1342867998993551366>",
    warning: "<a:atencaocc:1472985634678505603>",
    error: "<a:no:1342868276035850312>"
  };

  const colors = {
    info: config.colors.primary,
    success: config.colors.success,
    warning: config.colors.warning,
    error: config.colors.danger
  };

  const emoji = emojis[level] || emojis.info;
  const color = colors[level] || colors.info;
  const timestamp = new Date().toLocaleString("pt-BR", { 
    dateStyle: "short", 
    timeStyle: "medium" 
  });

  const embed = new EmbedBuilder()
    .setColor(color)
    .setAuthor({ 
      name: `${config.botName} • Sistema de Logs`,
      iconURL: channel.guild.iconURL()
    })
    .setDescription(`${emoji} **${message}**`)
    .setFooter({ text: `${level.toUpperCase()} • ${timestamp}` })
    .setTimestamp();

  if (details) {
    const detailsText = typeof details === "string" 
      ? details 
      : Object.entries(details)
          .map(([key, value]) => `**${key}:** ${value}`)
          .join("\n");
    embed.addFields({ name: "Detalhes", value: detailsText, inline: false });
  }

  await channel.send({ embeds: [embed] });
}

module.exports = {
  logToDb,
  logToChannel
};
