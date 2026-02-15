const {
  joinVoiceChannel,
  VoiceConnectionStatus,
  entersState
} = require("@discordjs/voice");

async function joinConfiguredVoice(client, config) {
  const channelId = config.voiceChannelId;
  if (!channelId) return null;

  const channel = await client.channels.fetch(channelId).catch(() => null);
  if (!channel || !channel.isVoiceBased()) {
    console.log("Canal de voz configurado nao encontrado ou invalido.");
    return null;
  }

  const connection = joinVoiceChannel({
    channelId: channel.id,
    guildId: channel.guild.id,
    adapterCreator: channel.guild.voiceAdapterCreator,
    selfDeaf: true
  });

  connection.on(VoiceConnectionStatus.Disconnected, async () => {
    try {
      await Promise.race([
        entersState(connection, VoiceConnectionStatus.Signalling, 5000),
        entersState(connection, VoiceConnectionStatus.Connecting, 5000)
      ]);
    } catch {
      connection.destroy();
    }
  });

  return connection;
}

module.exports = {
  joinConfiguredVoice
};
