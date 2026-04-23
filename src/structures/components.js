// src/structures/components.js - ComponentV2 UI helpers

const { 
  ContainerBuilder, SectionBuilder, TextDisplayBuilder, 
  ThumbnailBuilder, SeparatorBuilder, ActionRowBuilder, ButtonBuilder, 
  ButtonStyle, SeparatorSpacingSize, MessageFlags 
} = require('discord.js');

const FALLBACK_THUMB = 'https://files.catbox.moe/fnlch5.jpg';

// Simple text message
function text(content, ephemeral = false) {
  return {
    content,
    flags: ephemeral ? MessageFlags.Ephemeral : 0,
    components: []
  };
}

// Section with text display
function section(title, description, thumb = null, footer = null) {
  const s = new SectionBuilder()
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(`### ${title}\n${description}`)
    );
  
  if (thumb) {
    s.setThumbnailAccessory(new ThumbnailBuilder().setURL(thumb));
  }
  
  const container = new ContainerBuilder()
    .addSectionComponents(s);
  
  const result = { flags: MessageFlags.IsComponentsV2, components: [container] };
  
  if (footer) {
    // Can't add footer to container directly in v2 format
  }
  
  return result;
}

// Row with buttons
function buttons(...buttons) {
  const row = new ActionRowBuilder();
  for (const btn of buttons) {
    row.addComponents(btn);
  }
  return row;
}

// Create button
function button(label, customId, style = 'primary', emoji = null) {
  const btn = new ButtonBuilder()
    .setCustomId(customId)
    .setLabel(label);
  
  if (style === 'danger') btn.setStyle(ButtonStyle.Danger);
  else if (style === 'success') btn.setStyle(ButtonStyle.Success);
  else if (style === 'secondary') btn.setStyle(ButtonStyle.Secondary);
  else btn.setStyle(ButtonStyle.Primary);
  
  if (emoji) btn.setEmoji(emoji);
  
  return btn;
}

// Disabled button
function buttonDisabled(label, customId, style = 'primary') {
  return button(label, customId, style).setDisabled(true);
}

// Now playing embed (Section with thumbnail)
function nowPlaying(track, requester, duration) {
  const section = new SectionBuilder()
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(`### ▶ Now Playing\n**${track.title}**\n${track.author}`),
      new TextDisplayBuilder().setContent(`Duration: \`${duration}\` • Requested by ${requester}`)
    )
    .setThumbnailAccessory(new ThumbnailBuilder().setURL(track.thumbnail || FALLBACK_THUMB));
  
  const row = new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setCustomId('stop')
        .setLabel('Stop')
        .setStyle(ButtonStyle.Danger)
        .setEmoji('⏹'),
      new ButtonBuilder()
        .setCustomId('skip')
        .setLabel('Skip')
        .setStyle(ButtonStyle.Primary)
        .setEmoji('⏭')
    );
  
  return {
    flags: MessageFlags.IsComponentsV2,
    components: [
      new ContainerBuilder().addSectionComponents(section),
      row
    ]
  };
}

// Track added to queue
function trackAdded(track, position, queueSize, duration, isPlaying) {
  const posLabel = isPlaying ? `#${position + 1}` : 'Up next';
  
  const section = new SectionBuilder()
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(`### Added to Queue\n**[${track.title}](${track.uri})**\n${track.author}`),
      new TextDisplayBuilder().setContent(`Duration: \`${duration}\``)
    )
    .setThumbnailAccessory(new ThumbnailBuilder().setURL(track.thumbnail || FALLBACK_THUMB));
  
  const meta = new TextDisplayBuilder().setContent(
    `-# Position: \`${posLabel}\` • Queue: \`${queueSize} tracks\``
  );
  
  return {
    flags: MessageFlags.IsComponentsV2,
    components: [
      new ContainerBuilder()
        .addSectionComponents(section)
        .addTextDisplayComponents(meta)
    ]
  };
}

// Playlist added
function playlistAdded(name, trackCount, duration, thumb) {
  const section = new SectionBuilder()
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(`### 🎵 Playlist Loaded: **${name}**`),
      new TextDisplayBuilder().setContent(`\`${trackCount}\` tracks • \`${duration}\``)
    )
    .setThumbnailAccessory(new ThumbnailBuilder().setURL(thumb || FALLBACK_THUMB));
  
  return {
    flags: MessageFlags.IsComponentsV2,
    components: [new ContainerBuilder().addSectionComponents(section)]
  };
}

// Queue list
function queueList(current, tracks, totalDuration) {
  let desc = current 
    ? `**▶ Playing:** [${current.title}](${current.uri})\n${current.author}\n`
    : '';
  
  desc += `**Up Next:**\n`;
  desc += tracks.slice(0, 10).map((t, i) => 
    `${i + 1}. ${t.title} - ${t.author}`
  ).join('\n');
  
  if (tracks.length > 10) {
    desc += `\n... and ${tracks.length - 10} more`;
  }
  
  const section = new SectionBuilder()
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent('### 📋 Music Queue'),
      new TextDisplayBuilder().setContent(desc)
    )
    .setThumbnailAccessory(new ThumbnailBuilder().setURL(current?.thumbnail || FALLBACK_THUMB));
  
  const meta = new TextDisplayBuilder().setContent(
    `-# Total: ${tracks.length} tracks • ${totalDuration}`
  );
  
  return {
    flags: MessageFlags.IsComponentsV2,
    components: [
      new ContainerBuilder()
        .addSectionComponents(section)
        .addTextDisplayComponents(meta)
    ]
  };
}

// Error message
function errorMsg(title, description) {
  const section = new SectionBuilder()
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(`### ❌ ${title}\n${description}`)
    );
  
  return {
    flags: MessageFlags.IsComponentsV2,
    components: [new ContainerBuilder().addSectionComponents(section)]
  };
}

// Success message
function successMsg(description) {
  const section = new SectionBuilder()
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(description)
    );
  
  return {
    flags: MessageFlags.IsComponentsV2,
    components: [new ContainerBuilder().addSectionComponents(section)]
  };
}

module.exports = {
  text,
  section,
  buttons,
  button,
  buttonDisabled,
  nowPlaying,
  trackAdded,
  playlistAdded,
  queueList,
  errorMsg,
  successMsg,
  FALLBACK_THUMB
};