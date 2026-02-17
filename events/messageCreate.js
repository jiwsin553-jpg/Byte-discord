const { detectIntent, detectFaq, detectProduct } = require("../utils/keywords");
const { createTicket } = require("../utils/tickets");
const { getSettings } = require("../utils/settings");
const { infoEmbed, warningEmbed } = require("../utils/embeds");
const { logToDb, logToChannel } = require("../utils/logger");

function isTicketChannel(channel) {
  return channel.name?.startsWith("vendas-") || channel.name?.startsWith("suporte-");
}

module.exports = {
  name: "messageCreate",
  async execute(message, config) {
    if (!message.guild || message.author.bot) return;

    const settings = await getSettings(message.guild.id);
    if (!settings) return;

    if (isTicketChannel(message.channel)) return;

    const faq = detectFaq(message.content, config);
    if (faq) {
      await message.reply({
        embeds: [infoEmbed(config, "📚 FAQ", faq).setFooter({ text: "Byte Support • Resposta automática" })]
      });
      return;
    }

    const intent = detectIntent(message.content, config);
    if (!intent) return;

    const productId = intent === "sales" ? detectProduct(message.content, config) : null;

    const result = await createTicket({
      guild: message.guild,
      member: message.member,
      type: intent,
      config,
      settings,
      productId
    });

    if (result.error) {
      await message.reply({
        embeds: [warningEmbed(config, "<a:atencaocc:1472985634678505603> Ticket não criado", result.error)]
      });
      return;
    }

      await message.reply({
        embeds: [
          infoEmbed(
            config,
            "<a:yes:1342867998993551366> Ticket criado",
            `Canal criado: ${result.channel}\n<a:carregando1:1342856167927582720> Aguarde, nossa equipe já está a caminho!`
          ).setFooter({ text: "Byte Support" })
        ]
      });

    const logChannel = message.guild.channels.cache.get(settings.log_channel_id);
    await logToDb(message.guild.id, "info", "Ticket criado via mensagem", {
      channelId: result.channel.id,
      userId: message.author.id,
      type: intent
    });
    await logToChannel(logChannel, config, "info", `Ticket criado: ${result.channel.name}`);
  }
};
