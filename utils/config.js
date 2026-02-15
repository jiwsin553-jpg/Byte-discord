const fs = require("fs");
const path = require("path");

const CONFIG_PATH = path.join(__dirname, "..", "config.json");

function loadConfig() {
  const raw = fs.readFileSync(CONFIG_PATH, "utf8");
  const data = JSON.parse(raw);
  validateConfig(data);
  return data;
}

function validateConfig(config) {
  const required = ["botName", "colors", "limits", "keywords", "products", "payment"];
  for (const key of required) {
    if (!Object.prototype.hasOwnProperty.call(config, key)) {
      throw new Error(`config.json invalido: campo ausente ${key}`);
    }
  }

  if (!config.limits.ticketCooldownMinutes || !config.limits.maxOpenTicketsPerGuild) {
    throw new Error("config.json invalido: limites obrigatorios ausentes");
  }

  if (!Array.isArray(config.products) || config.products.length === 0) {
    throw new Error("config.json invalido: products deve conter itens");
  }

  if (!config.payment.pix || !config.payment.bank || !config.payment.beneficiary) {
    throw new Error("config.json invalido: payment incompleto");
  }
}

module.exports = {
  loadConfig,
  validateConfig
};
