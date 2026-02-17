const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const { infoEmbed } = require("./embeds");
const { get, run } = require("../database/db");

async function ensureTicketPanel(client, config) {
  const channelId = config.ticketPanelChannelId;
  if (!channelId) return;

  const channel = await client.channels.fetch(channelId).catch(() => null);
  if (!channel || !channel.isTextBased()) return;

  const guildId = channel.guild.id;
  const settings = await get("SELECT panel_message_id FROM settings WHERE guild_id = ?", [guildId]);
  
  let existingMessage = null;
  if (settings?.panel_message_id) {
    existingMessage = await channel.messages.fetch(settings.panel_message_id).catch(() => null);
  }

  const embed = infoEmbed(
    config,
    "Byte Support | Central de Atendimento",
    [
      "Atendimento rapido e facil.",
      "",
      "<a:az_seta:1342855775021961217> **Vendas Delux** — * Ideal para quem quer máximo desempenho, seja para jogos, trabalho ou uso intenso.*",
      "<a:az_seta:1342855775021961217>**Vendas Edge** — *Recomendada para usuários que querem desempenho sem alterações profundas.*",
      "<a:blue_ferramenta:1472985090207518831> **Suporte** — *Para suporte*",
      "",
      "**Selecione um atendimento abaixo**"
    ].join("\n")
  );
  embed
    .setThumbnail("https://media.discordapp.net/attachments/1469055845902979288/1472679352737988836/Latency.png?ex=69937306&is=69922186&hm=4bcda46468ae5ec48d2af7f85457495f9fe41564aef8b8fb0686ded084cd4891&=&format=webp&quality=lossless&width=256&height=256")
    .setFooter({ text: "Byte Support" });

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("ticket_open_sales_delux")
      .setLabel("Vendas Delux")
      .setEmoji("1342876167652245637")
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId("ticket_open_sales_edge")
      .setLabel("Vendas Edge")
      .setEmoji("1472984934913278173")
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId("ticket_open_support")
      .setLabel("Suporte")
      .setEmoji("1472985090207518831")
      .setStyle(ButtonStyle.Secondary)
  );

  if (existingMessage) {
    await existingMessage.edit({ embeds: [embed], components: [row] });
    return;
  }

 const newMessage = await channel.send({ embeds: [embed], components: [row] });
  await run("UPDATE settings SET panel_message_id = ? WHERE guild_id = ?", [newMessage.id, guildId]);
}

module.exports = {
  ensureTicketPanel
};
