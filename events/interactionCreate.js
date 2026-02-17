const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  PermissionFlagsBits
} = require("discord.js");
const { infoEmbed, successEmbed, dangerEmbed } = require("../utils/embeds");
const { getSettings, upsertSettings } = require("../utils/settings");
const { isAdmin } = require("../utils/permissions");
const { closeTicket, registerRating, createTicket } = require("../utils/tickets");
const { logToDb, logToChannel } = require("../utils/logger");

function formatDuration(ms) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const parts = [];
  if (hours) parts.push(`${hours}h`);
  if (minutes) parts.push(`${minutes}m`);
  parts.push(`${seconds}s`);
  return parts.join(" ");
}

function formatStars(value) {
  if (!value) return "Pendente";
  return `${"⭐".repeat(value)} (${value}/5)`;
}

module.exports = {
  name: "interactionCreate",
  async execute(interaction, config) {
    if (interaction.isChatInputCommand()) {
      if (interaction.commandName !== "config") return;

      const settings = await getSettings(interaction.guild.id);
      const baseSettings = settings || {};
      const adminRole = interaction.options.getRole("admin_role");
      const supportRole = interaction.options.getRole("support_role");
      const salesCategory = interaction.options.getChannel("sales_category");
      const supportCategory = interaction.options.getChannel("support_category");
      const logChannel = interaction.options.getChannel("log_channel");
      const qrCode = interaction.options.getString("qr_code");

      if (!settings && !adminRole) {
        return interaction.reply({
          embeds: [dangerEmbed(config, "Configuracao incompleta", "Informe o cargo admin para primeira configuracao.")],
          ephemeral: true
        });
      }

      const adminRoleId = adminRole?.id || baseSettings.admin_role_id;
      const hasAdminRole = adminRoleId ? interaction.member.roles.cache.has(adminRoleId) : false;
      const hasAdminPerm = interaction.member.permissions.has(PermissionFlagsBits.Administrator);

      if (!settings && !hasAdminPerm && !hasAdminRole) {
        return interaction.reply({
          embeds: [dangerEmbed(config, "Sem permissao", "Apenas administradores podem usar /config.")],
          ephemeral: true
        });
      }

      if (settings && !isAdmin(interaction.member, settings)) {
        return interaction.reply({
          embeds: [dangerEmbed(config, "Sem permissao", "Apenas administradores podem usar /config.")],
          ephemeral: true
        });
      }

      const data = {
        admin_role_id: adminRole?.id || baseSettings.admin_role_id,
        support_role_id: supportRole?.id || baseSettings.support_role_id,
        sales_category_id: salesCategory?.id || baseSettings.sales_category_id,
        support_category_id: supportCategory?.id || baseSettings.support_category_id,
        log_channel_id: logChannel?.id || baseSettings.log_channel_id,
        payment_qr_code: qrCode || baseSettings.payment_qr_code
      };

      const missing = Object.values(data).some((value) => !value);
      if (missing) {
        return interaction.reply({
          embeds: [dangerEmbed(config, "Configuracao incompleta", "Preencha todos os campos obrigatorios.")],
          ephemeral: true
        });
      }

      await upsertSettings(interaction.guild.id, data);

      await interaction.reply({
        embeds: [successEmbed(config, "Configuracao salva", "Parametros atualizados com sucesso.")],
        ephemeral: true
      });

      await logToDb(interaction.guild.id, "info", "Configuracao atualizada", data);

      if (logChannel) {
        await logToChannel(logChannel, config, "info", "Configuracao do bot atualizada.");
      }
    }

    if (interaction.isButton()) {
      if (interaction.customId === "ticket_close") {
        const row = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId("ticket_close_confirm")
            .setLabel("Confirmar fechamento")
            .setStyle(ButtonStyle.Danger)
        );

        return interaction.reply({
          embeds: [infoEmbed(config, "<a:atencaocc:1472985634678505603> Confirmação <a:atencaocc:1472985634678505603>", "Deseja realmente fechar este ticket?")],
          components: [row],
          ephemeral: true
        });
      }

      if (interaction.customId === "ticket_close_confirm") {
        const result = await closeTicket(interaction.channel, interaction.user.id, config);
        if (result.error) {
          return interaction.reply({
            embeds: [dangerEmbed(config, "Erro", result.error)],
            ephemeral: true
          });
        }

        await interaction.reply({
          embeds: [successEmbed(config, "Fechamento iniciado", "Ticket encerrado. Aguarde a avaliacao.")],
          ephemeral: true
        });

        const settings = await getSettings(interaction.guild.id);
        const logChannel = settings ? interaction.guild.channels.cache.get(settings.log_channel_id) : null;
        await logToDb(interaction.guild.id, "info", "Ticket fechado", {
          channelId: interaction.channel.id,
          userId: interaction.user.id
        });
        const durationText = formatDuration(Date.now() - result.ticket.created_at);
        await logToChannel(logChannel, config, "info", "Ticket encerrado.", {
          title: `${config.botName} | Ticket fechado`,
          fields: [
            { name: "Canal", value: `<#${interaction.channel.id}>`, inline: true },
            { name: "Usuario", value: `<@${result.ticket.user_id}>`, inline: true },
            { name: "Staff", value: `<@${interaction.user.id}>`, inline: true },
            { name: "Duracao", value: durationText, inline: true },
            { name: "Avaliacao", value: "Aguardando usuario", inline: true },
            { name: "Transcript", value: "Nao disponivel", inline: true }
          ],
          footer: "Byte Logs"
        });
      }

      if (interaction.customId.startsWith("ticket_rate_")) {
        const rating = Number(interaction.customId.split("_").pop());
        const result = await registerRating(interaction.channel, rating, config);
        if (result.error) {
          return interaction.reply({
            embeds: [dangerEmbed(config, "Erro", result.error)],
            ephemeral: true
          });
        }

        await interaction.reply({
          embeds: [successEmbed(config, "Avaliacao recebida", `Nota registrada: ${rating} estrelas.`)],
          ephemeral: true
        });

        const settings = await getSettings(interaction.guild.id);
        const logChannel = settings ? interaction.guild.channels.cache.get(settings.log_channel_id) : null;
        await logToDb(interaction.guild.id, "info", "Avaliacao registrada", {
          channelId: interaction.channel.id,
          userId: result.ticket.user_id,
          rating
        });
        await logToChannel(logChannel, config, "info", "Avaliacao recebida.", {
          title: `${config.botName} | Feedback`,
          fields: [
            { name: "Canal", value: `<#${interaction.channel.id}>`, inline: true },
            { name: "Usuario", value: `<@${result.ticket.user_id}>`, inline: true },
            { name: "Nota", value: formatStars(rating), inline: true }
          ],
          footer: "Byte Logs"
        });
      }

      if (interaction.customId.startsWith("ticket_open_")) {
        if (!interaction.guild) return;
        const settings = await getSettings(interaction.guild.id);
        if (!settings) {
          return interaction.reply({
            embeds: [dangerEmbed(config, "Configuracao pendente", "Execute /config antes de abrir tickets.")],
            ephemeral: true
          });
        }

        const parts = interaction.customId.split("_");
        const type = parts[2];
        const productId = parts[3] || null;

        const result = await createTicket({
          guild: interaction.guild,
          member: interaction.member,
          type: type === "support" ? "support" : "sales",
          config,
          settings,
          productId
        });

        if (result.error) {
          return interaction.reply({
            embeds: [dangerEmbed(config, "Ticket nao criado", result.error)],
            ephemeral: true
          });
        }

        await interaction.reply({
          embeds: [successEmbed(config, "Ticket criado", `Canal criado: ${result.channel}`)],
          ephemeral: true
        });

        const logChannel = interaction.guild.channels.cache.get(settings.log_channel_id);
        await logToDb(interaction.guild.id, "info", "Ticket criado via painel", {
          channelId: result.channel.id,
          userId: interaction.user.id,
          type: type === "support" ? "support" : "sales",
          productId
        });
        await logToChannel(logChannel, config, "info", "Novo ticket criado.", {
          title: `${config.botName} | Ticket criado`,
          fields: [
            { name: "Canal", value: `<#${result.channel.id}>`, inline: true },
            { name: "Usuario", value: `<@${interaction.user.id}>`, inline: true },
            { name: "Tipo", value: type === "support" ? "Suporte" : "Vendas", inline: true },
            { name: "Produto", value: productId || "Nao informado", inline: true },
            { name: "Status", value: "Aberto", inline: true }
          ],
          footer: "Byte Logs"
        });
      }
    }
  }
};
