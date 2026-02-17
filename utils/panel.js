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
      "<a:25801:1411565345696911430> *Vendas Delux* - **Nossa otimização mais completa e avançada.**",
      "<a:blue_raiocr:1465906040574050387> *Vendas Edge* - **Recomendada para usuários que querem desempenho sem alterações profundas.**",
      "<a:blue_ferramenta:1472985090207518831> *Suporte* - **Diagnostico e resolucao tecnica**",
      "",
      "Clique abaixo e o ticket sera criado automaticamente."
    ].join("\n")
  );
  embed
    .setThumbnail("https://media.discordapp.net/attachments/1469055845902979288/1472679352737988836/Latency.png?ex=69937306&is=69922186&hm=4bcda46468ae5ec48d2af7f85457495f9fe41564aef8b8fb0686ded084cd4891&=&format=webp&quality=lossless&width=256&height=256")
    .setImage("https://media.discordapp.net/attachments/1469055845902979288/1472679869371383952/Logo1.png?ex=69937381&is=69922201&hm=9da28719a54a306d4e8e2804ed39b02f1b9ec7a44e6c60d94d562637d8dfc62e&=&format=webp&quality=lossless&width=681&height=681")
    .setFooter({ text: "Byte Support • Atendimento" });

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("ticket_open_sales_delux")
      .setLabel("Vendas Delux")
      .setEmoji("1411565345696911430")
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId("ticket_open_sales_edge")
      .setLabel("Vendas Edge")
      .setEmoji("1465906040574050387")
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId("ticket_open_support")
      .setLabel("Suporte")
      .setEmoji("472985090207518831")
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
