const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("adicionar-emoji")
    .setDescription("Clona um emoji de outro servidor para este")
    .addStringOption((opt) =>
      opt
        .setName("emoji")
        .setDescription("Cole o emoji aqui (ex: :nome: ou ID)")
        .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuildExpressions),
  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });

    const input = interaction.options.getString("emoji");
    const emojiMatch = input.match(/<?(a)?:(\w+):(\d+)>?/);

    if (!emojiMatch) {
      return interaction.editReply({
        content: "❌ Formato invalido. Cole um emoji ou use o ID (ex: `<:nome:123456>`)."
      });
    }

    const animated = emojiMatch[1] === "a";
    const name = emojiMatch[2];
    const id = emojiMatch[3];
    const extension = animated ? "gif" : "png";
    const url = `https://cdn.discordapp.com/emojis/${id}.${extension}`;

    try {
      const emoji = await interaction.guild.emojis.create({
        attachment: url,
        name: name
      });

      return interaction.editReply({
        content: `✅ Emoji ${emoji} adicionado com sucesso! Nome: \`${name}\``
      });
    } catch (error) {
      console.error("Erro ao adicionar emoji:", error);
      return interaction.editReply({
        content: `❌ Erro ao adicionar emoji. Verifique se o servidor tem espaco para mais emojis.`
      });
    }
  }
};
