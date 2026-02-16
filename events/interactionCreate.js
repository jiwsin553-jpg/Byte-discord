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

module.exports = {
  name: "interactionCreate",
  async execute(interaction, config) {
    if (interaction.isChatInputCommand()) {
      const command = interaction.client.commands.get(interaction.commandName);
      
      if (!command) return;
      
      try {
        await command.execute(interaction, config);
      } catch (error) {
        console.error("Erro ao executar comando:", error);
        const reply = { 
          content: "Erro ao executar o comando.", 
          ephemeral: true 
        };
        if (interaction.replied || interaction.deferred) {
          await interaction.editReply(reply);
        } else {
          await interaction.reply(reply);
        }
      }
      return;
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
          embeds: [infoEmbed(config, "Confirmacao", "Deseja realmente fechar este ticket?")],
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
        await logToChannel(logChannel, config, "info", `Ticket fechado: ${interaction.channel.name}`);
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
        await logToChannel(logChannel, config, "info", `Ticket criado: ${result.channel.name}`);
      }
    }
  }
};