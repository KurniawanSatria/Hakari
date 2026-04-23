// src/commands/lyrics.js - Lyrics command

const { ContainerBuilder, SectionBuilder, TextDisplayBuilder, ThumbnailBuilder, MessageFlags } = require('discord.js');
const { errorMsg, successMsg, FALLBACK_THUMB } = require('../structures/components');

module.exports = {
  name: 'lyrics',
  aliases: ['lyric', 'lrc'],
  execute: async (client, message, args) => {
    try {
      const player = client.manager?.players.get(message.guild.id);
      
      if (!player || !player.current) {
        const section = new SectionBuilder()
          .addTextDisplayComponents(
            new TextDisplayBuilder().setContent('### 🎵 Hakari Music - Lyrics\nNo track currently playing.\n\nUse `.play <song>` to start.')
          );
        
        return message.channel.send({
          flags: MessageFlags.IsComponentsV2,
          components: [new ContainerBuilder().addSectionComponents(section)]
        });
      }
      
      const track = player.current;
      
      if (player.lyricsData) {
        const lines = player.lyricsLines;
        
        if (lines && lines.length > 0) {
          const text = lines.slice(0, 15).map(l => {
            if (typeof l === 'string') return l;
            if (l.segments) return l.segments.map(s => s.text || '').join('');
            return l.text || '';
          }).join('\n');
          
          const section = new SectionBuilder()
            .addTextDisplayComponents(
              new TextDisplayBuilder().setContent(`### 🎤 lyrics: ${track.title}\n${text}`)
            )
            .setThumbnailAccessory(new ThumbnailBuilder().setURL(track.thumbnail || FALLBACK_THUMB));
          
          return message.channel.send({
            flags: MessageFlags.IsComponentsV2,
            components: [new ContainerBuilder().addSectionComponents(section)]
          });
        }
      }
      
      const section = new SectionBuilder()
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent(`### ❌ No lyrics available\n**${track.title}**\nLyrics not found for this track.`)
        )
        .setThumbnailAccessory(new ThumbnailBuilder().setURL(track.thumbnail || FALLBACK_THUMB));
      
      return message.channel.send({
        flags: MessageFlags.IsComponentsV2,
        components: [new ContainerBuilder().addSectionComponents(section)]
      });
      
    } catch (err) {
      message.channel.send(errorMsg('Error', 'Error getting lyrics.'));
    }
  }
};