import { VoiceConnection, joinVoiceChannel } from '@discordjs/voice';
import { CommandInteraction, GuildMember } from 'discord.js';

export async function joinVCOfInteraction(interaction: CommandInteraction): Promise<VoiceConnection | null> {
  if (interaction.member instanceof GuildMember && interaction.member.voice.channel) {
    const channel = interaction.member.voice.channel;
    const connection = joinVoiceChannel({
      channelId: channel.id,
      guildId: channel.guild.id,
      selfDeaf: true,
      selfMute: false,
      adapterCreator: channel.guild.voiceAdapterCreator,
    });
    return connection;
  } else {
    return null;
  }
}