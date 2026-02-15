const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const { infoEmbed } = require("./embeds");

async function ensureTicketPanel(client, config) {
  const channelId = config.ticketPanelChannelId;
  if (!channelId) return;

  const channel = await client.channels.fetch(channelId).catch(() => null);
  if (!channel || !channel.isTextBased()) return;

  const recent = await channel.messages.fetch({ limit: 20 }).catch(() => null);
  let existingMessage = null;
  if (recent) {
    existingMessage = recent.find(
      (msg) =>
        msg.author?.id === client.user.id &&
        msg.embeds?.[0]?.title?.includes("Central de Atendimento")
    );
  }

  const embed = infoEmbed(
    config,
    "Byte Support | Central de Atendimento",
    [
      "Atendimento rapido e sem complicacao.",
      "",
      "🛒 **Delux** - *experiencia completa de otimizacao.*",
      "⚡ **Edge** - *Nossa otimização mais completa e avançada.*",
      "🛠️ **Suporte** — *Atendimento e dúvidas.*",
      "",
      "Clique no botão correspondente para abrir um ticket."
    ].join("\n")
  );
  embed
    .setThumbnail("https://media.discordapp.net/attachments/1469055845902979288/1472679352737988836/Latency.png?ex=69937306&is=69922186&hm=4bcda46468ae5ec48d2af7f85457495f9fe41564aef8b8fb0686ded084cd4891&=&format=webp&quality=lossless&width=256&height=256")
    .setFooter({ text: "Byte Support • Atendimento" });

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("ticket_open_sales_delux")
      .setLabel("Vendas Delux")
      .setEmoji("🛒")
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId("ticket_open_sales_edge")
      .setLabel("Vendas Edge")
      .setEmoji("⚡")
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId("ticket_open_support")
      .setLabel("Suporte")
      .setEmoji("🛠️")
      .setStyle(ButtonStyle.Secondary)
  );

  if (existingMessage) {
    await existingMessage.edit({ embeds: [embed], components: [row] });
    return;
  }

  await channel.send({ embeds: [embed], components: [row] });
}

module.exports = {
  ensureTicketPanel
};
