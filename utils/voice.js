const {
  joinVoiceChannel,
  VoiceConnectionStatus,
  entersState
} = require("@discordjs/voice");

let voiceConnection = null;
let reconnectTimer = null;

async function joinConfiguredVoice(client, config) {
  const channelId = config.voiceChannelId;
  if (!channelId) return null;

  const channel = await client.channels.fetch(channelId).catch(() => null);
  if (!channel || !channel.isVoiceBased()) {
    console.log("❌ Canal de voz configurado nao encontrado ou invalido.");
    return null;
  }

  try {
    voiceConnection = joinVoiceChannel({
      channelId: channel.id,
      guildId: channel.guild.id,
      adapterCreator: channel.guild.voiceAdapterCreator,
      selfDeaf: true,
      selfMute: false
    });

    console.log(`🔊 Bot conectado ao canal de voz: ${channel.name}`);

    // Reconexão automática em caso de desconexão
    voiceConnection.on(VoiceConnectionStatus.Disconnected, async () => {
      console.log("⚠️ Bot desconectado do canal de voz, tentando reconectar...");
      try {
        await Promise.race([
          entersState(voiceConnection, VoiceConnectionStatus.Signalling, 5000),
          entersState(voiceConnection, VoiceConnectionStatus.Connecting, 5000)
        ]);
        console.log("✅ Reconexao bem-sucedida!");
      } catch {
        console.log("❌ Falha na reconexao, tentando novamente em 5s...");
        voiceConnection.destroy();
        
        // Tentar reconectar após 5 segundos
        if (reconnectTimer) clearTimeout(reconnectTimer);
        reconnectTimer = setTimeout(() => {
          joinConfiguredVoice(client, config);
        }, 5000);
      }
    });

    // Monitorar estado de erro
    voiceConnection.on(VoiceConnectionStatus.Destroyed, () => {
      console.log("💀 Conexao de voz destruida, reconectando em 3s...");
      if (reconnectTimer) clearTimeout(reconnectTimer);
      reconnectTimer = setTimeout(() => {
        joinConfiguredVoice(client, config);
      }, 3000);
    });

    return voiceConnection;
  } catch (error) {
    console.error("❌ Erro ao conectar no canal de voz:", error.message);
    
    // Tentar novamente em 10 segundos
    if (reconnectTimer) clearTimeout(reconnectTimer);
    reconnectTimer = setTimeout(() => {
      joinConfiguredVoice(client, config);
    }, 10000);
    
    return null;
  }
}

// Verificar e manter conexão ativa
function keepAlive(client, config) {
  setInterval(async () => {
    if (!voiceConnection || voiceConnection.state.status === VoiceConnectionStatus.Destroyed) {
      console.log("🔄 Verificacao periodica: reconectando ao canal de voz...");
      await joinConfiguredVoice(client, config);
    }
  }, 30 * 60 * 1000); // Verificar a cada 30 minutos
}

module.exports = {
  joinConfiguredVoice,
  keepAlive
};
