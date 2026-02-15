const { EmbedBuilder } = require("discord.js");

function baseEmbed(color, title, description) {
  const embed = new EmbedBuilder().setColor(color).setTimestamp();
  if (title) embed.setTitle(title);
  if (description) embed.setDescription(description);
  return embed;
}

function infoEmbed(config, title, description) {
  return baseEmbed(config.colors.primary, title, description);
}

function successEmbed(config, title, description) {
  return baseEmbed(config.colors.success, title, description);
}

function warningEmbed(config, title, description) {
  return baseEmbed(config.colors.warning, title, description);
}

function dangerEmbed(config, title, description) {
  return baseEmbed(config.colors.danger, title, description);
}

module.exports = {
  infoEmbed,
  successEmbed,
  warningEmbed,
  dangerEmbed
};
