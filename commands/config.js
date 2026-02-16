const { SlashCommandBuilder, ChannelType, PermissionFlagsBits } = require("discord.js");
const { getSettings, upsertSettings } = require("../utils/settings");
const { isAdmin } = require("../utils/permissions");
const { successEmbed, dangerEmbed } = require("../utils/embeds");
const { logToDb, logToChannel } = require("../utils/logger");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("config")
    .setDescription("Configura o Byte Support")
    .addRoleOption((opt) =>
      opt.setName("admin_role").setDescription("Cargo administrador do bot").setRequired(false)
    )
    .addRoleOption((opt) =>
      opt.setName("support_role").setDescription("Cargo do time de suporte").setRequired(false)
    )
    .addChannelOption((opt) =>
      opt
        .setName("sales_category")
        .setDescription("Categoria para tickets de vendas")
        .addChannelTypes(ChannelType.GuildCategory)
        .setRequired(false)
    )
    .addChannelOption((opt) =>
      opt
        .setName("support_category")
        .setDescription("Categoria para tickets de suporte")
        .addChannelTypes(ChannelType.GuildCategory)
        .setRequired(false)
    )
    .addChannelOption((opt) =>
      opt
        .setName("log_channel")
        .setDescription("Canal para logs do bot")
        .addChannelTypes(ChannelType.GuildText)
        .setRequired(false)
    )
    .addStringOption((opt) =>
      opt
        .setName("qr_code")
        .setDescription("QR Code do PIX (texto ou link)")
        .setRequired(false)
    ),
  async execute(interaction, config) {
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
};
