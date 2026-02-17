const { SlashCommandBuilder, ChannelType } = require("discord.js");

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
  async execute() {
    return null;
  }
};
