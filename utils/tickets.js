const {
  ChannelType,
  PermissionFlagsBits,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} = require("discord.js");
const { all, get, run } = require("../database/db");
const { infoEmbed, successEmbed, warningEmbed } = require("./embeds");

function formatTicketNumber(number) {
  return String(number).padStart(3, "0");
}

async function ensureCounter(guildId, type) {
  const existing = await get(
    "SELECT last_number FROM counters WHERE guild_id = ? AND type = ?",
    [guildId, type]
  );
  if (!existing) {
    await run(
      "INSERT INTO counters (guild_id, type, last_number) VALUES (?, ?, 0)",
      [guildId, type]
    );
    return 0;
  }
  return existing.last_number;
}

async function nextTicketNumber(guildId, type) {
  const last = await ensureCounter(guildId, type);
  const next = last + 1;
  await run(
    "UPDATE counters SET last_number = ? WHERE guild_id = ? AND type = ?",
    [next, guildId, type]
  );
  return next;
}

async function canCreateTicket(guildId, userId, config) {
  const openTickets = await get(
    "SELECT COUNT(*) as total FROM tickets WHERE guild_id = ? AND status = 'open'",
    [guildId]
  );
  if (openTickets.total >= config.limits.maxOpenTicketsPerGuild) {
    return { ok: false, reason: "Limite de tickets simultaneos atingido." };
  }

  const user = await get(
    "SELECT last_ticket_at FROM users WHERE guild_id = ? AND user_id = ?",
    [guildId, userId]
  );
  if (user && user.last_ticket_at) {
    const diffMs = Date.now() - user.last_ticket_at;
    const cooldownMs = config.limits.ticketCooldownMinutes * 60 * 1000;
    if (diffMs < cooldownMs) {
      const remaining = Math.ceil((cooldownMs - diffMs) / 60000);
      return { ok: false, reason: `Aguarde ${remaining} minuto(s) para abrir novo ticket.` };
    }
  }

  return { ok: true };
}

async function createTicket({ guild, member, type, config, settings, productId }) {
  const canCreate = await canCreateTicket(guild.id, member.id, config);
  if (!canCreate.ok) {
    return { error: canCreate.reason };
  }

  const number = await nextTicketNumber(guild.id, type);
  const formatted = formatTicketNumber(number);
  const channelName =
    type === "sales"
      ? productId
        ? `vendas-${productId}-${formatted}`
        : `vendas-${formatted}`
      : `suporte-${formatted}`;
  const categoryId = type === "sales" ? settings.sales_category_id : settings.support_category_id;

  const channel = await guild.channels.create({
    name: channelName,
    type: ChannelType.GuildText,
    parent: categoryId,
    permissionOverwrites: [
      {
        id: guild.roles.everyone,
        deny: [PermissionFlagsBits.ViewChannel]
      },
      {
        id: member.id,
        allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory]
      },
      {
        id: settings.support_role_id,
        allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory]
      }
    ]
  });

  await run(
    "INSERT INTO tickets (guild_id, channel_id, user_id, type, product_id, number, status, created_at) VALUES (?, ?, ?, ?, ?, ?, 'open', ?)",
    [guild.id, channel.id, member.id, type, productId || null, number, Date.now()]
  );

  await run(
    "INSERT INTO users (guild_id, user_id, last_ticket_at) VALUES (?, ?, ?) ON CONFLICT(guild_id, user_id) DO UPDATE SET last_ticket_at = excluded.last_ticket_at",
    [guild.id, member.id, Date.now()]
  );

  const intro = type === "sales"
    ? "Atendimento de vendas iniciado. Em breve um especialista vai responder."
    : "Atendimento de suporte iniciado. Descreva o problema com detalhes.";

  const products = config.products
    .map((p) => `• ${p.name}: de ${p.priceOriginal} por ${p.pricePromo}`)
    .join("\n");

  const selectedProduct = productId
    ? config.products.find((p) => p.id === productId)
    : null;

  const qrCodeText = settings.payment_qr_code ? `\nQR Code: ${settings.payment_qr_code}` : "";
  const payment = `PIX: ${config.payment.pix}\nBanco: ${config.payment.bank}\nBeneficiario: ${config.payment.beneficiary}${qrCodeText}`;

  const titlePrefix = type === "sales" ? "<:Carrinho_RkBots:1472985587106578584> Vendas" : "<a:blue_ferramenta:1472985090207518831> Suporte";
  const embed = infoEmbed(
    config,
    `${config.botName} | ${titlePrefix} • #${formatted}`,
    intro
  );

  if (type === "sales") {
    const productLine = selectedProduct
      ? `**${selectedProduct.name}** (de ${selectedProduct.priceOriginal} por ${selectedProduct.pricePromo})`
      : "Escolha um dos produtos abaixo ou descreva sua necessidade.";

    embed.addFields(
      {
        name: "📌 Produto selecionado",
        value: productLine,
        inline: false
      },
      {
        name: "🧾 Catalogo",
        value: products,
        inline: false
      },
      {
        name: "💳 Pagamento",
        value: payment,
        inline: false
      }
    );
  } else {
    embed.addFields({
      name: "📌 Instrucoes",
      value: "Informe o problema, quando ocorre e o que ja tentou. Se possivel, anexe imagens.",
      inline: false
    });
  }

  embed.setFooter({ text: "Byte Support" });

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("ticket_close")
      .setLabel("Fechar ticket")
      .setStyle(ButtonStyle.Danger)
  );

  await channel.send({
    content: `<@${member.id}>`,
    embeds: [embed],
    components: [row]
  });

  return { channel };
}

async function closeTicket(channel, userId, config) {
  const ticket = await get(
    "SELECT * FROM tickets WHERE channel_id = ? AND status = 'open'",
    [channel.id]
  );

  if (!ticket) {
    return { error: "Ticket nao encontrado ou ja fechado." };
  }

  await run(
    "UPDATE tickets SET status = 'closed', closed_at = ? WHERE id = ?",
    [Date.now(), ticket.id]
  );

  const ratingRow = new ActionRowBuilder().addComponents(
    [1, 2, 3, 4, 5].map((value) =>
      new ButtonBuilder()
        .setCustomId(`ticket_rate_${value}`)
        .setLabel(String(value))
        .setStyle(ButtonStyle.Secondary)
    )
  );

  const closeEmbed = successEmbed(
    config,
    "🔒 Ticket encerrado",
    "Avalie o atendimento de 1 a 5 estrelas para concluir."
  ).setFooter({ text: "Byte Feedback" });

  await channel.send({ embeds: [closeEmbed], components: [ratingRow] });

  return { ticket, requestedBy: userId };
}

async function registerRating(channel, rating, config) {
  const ticket = await get("SELECT * FROM tickets WHERE channel_id = ?", [channel.id]);
  if (!ticket) return { error: "Ticket nao encontrado." };

  await run("UPDATE tickets SET rating = ? WHERE id = ?", [rating, ticket.id]);

  const ratingEmbed = warningEmbed(
    config,
    "⭐ Obrigado!",
    "Sua avaliacao foi registrada. O canal sera encerrado em 5 segundos."
  ).setFooter({ text: "Byte Encerramento" });

  await channel.send({ embeds: [ratingEmbed] });

  setTimeout(() => {
    channel.delete("Ticket encerrado").catch(() => null);
  }, 5000);

  return { ticket };
}

async function countOpenTickets(guildId) {
  const result = await get(
    "SELECT COUNT(*) as total FROM tickets WHERE guild_id = ? AND status = 'open'",
    [guildId]
  );
  return result.total;
}

async function listTicketByChannel(channelId) {
  return get("SELECT * FROM tickets WHERE channel_id = ?", [channelId]);
}

async function listTicketByUser(guildId, userId) {
  return all(
    "SELECT * FROM tickets WHERE guild_id = ? AND user_id = ? ORDER BY created_at DESC",
    [guildId, userId]
  );
}

module.exports = {
  createTicket,
  closeTicket,
  registerRating,
  countOpenTickets,
  listTicketByChannel,
  listTicketByUser
};
