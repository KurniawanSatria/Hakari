const {
  TextDisplayBuilder,
  SectionBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  ContainerBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  MediaGalleryBuilder,
  MessageFlags,
} = require('discord.js');
const { getEmoji, EMOJIS } = require('./emojis');

// Constants
const ACCENT_COLOR = 0xE7B88B;
const HELP_ACCENT = 0xE7B88B;
const FALLBACK_THUMB = 'https://files.catbox.moe/fnlch5.jpg';
const NOW_PLAYING_GIF = 'https://i.ibb.co.com/ksXKzFg1/Now-Playing.gif';

// Playback buttons (reusable)
function playbackButtons() {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('stop').setStyle(ButtonStyle.Danger).setEmoji(EMOJIS.music.stop),
    new ButtonBuilder().setCustomId('previous').setStyle(ButtonStyle.Secondary).setEmoji(EMOJIS.music.previous),
    new ButtonBuilder().setCustomId('pause_resume').setStyle(ButtonStyle.Secondary).setEmoji(EMOJIS.music.pause),
    new ButtonBuilder().setCustomId('skip').setStyle(ButtonStyle.Secondary).setEmoji(EMOJIS.music.skip),
    new ButtonBuilder().setCustomId('queue').setStyle(ButtonStyle.Secondary).setEmoji(EMOJIS.music.queue),
  );
}

/**
 * Simple container with text content. No accent color.
 * Replaces Pattern 1 (pause, resume, stop, skip, shuffle, loop, autoplay, lang).
 */
function hakariMessage(content) {
  const container = new ContainerBuilder()
    .setAccentColor(ACCENT_COLOR)
    .addTextDisplayComponents(td => td.setContent(`**${EMOJIS.bot.hakari} Hakari Music**`))
    .addSeparatorComponents(sep => sep.setDivider(true).setSpacing(SeparatorSpacingSize.Small))
    .addTextDisplayComponents(td => td.setContent(content));

  return { components: [container], flags: MessageFlags.IsComponentsV2 };
}


/**
 * Container with accent color, Section (text + thumbnail accessory).
 * Replaces Pattern 2 (queue, lyrics).
 */
function hakariCard({ content, thumbnailURL = FALLBACK_THUMB, accentColor = ACCENT_COLOR } = {}) {
  const container = new ContainerBuilder()
    .setAccentColor(accentColor)
    .addSectionComponents(section =>
      section
        .addTextDisplayComponents(td => td.setContent(content))
        .setThumbnailAccessory(thumb => thumb.setURL(thumbnailURL).setDescription('Album thumbnail'))
    );

  return { components: [container], flags: MessageFlags.IsComponentsV2 };
}

/**
 * Full player card with Section + thumbnail, separator, body text, and playback buttons.
 * Replaces Pattern 3 (trackStart, playerUpdate, lyricsFound, lyricsLine).
 */
function hakariPlayerCard({ sectionContent, bodyContent, thumbnailURL = FALLBACK_THUMB, accentColor = null } = {}) {
  const container = new ContainerBuilder()
    .setAccentColor(accentColor)
    .addSectionComponents(section =>
      section
        .addTextDisplayComponents(td => td.setContent(sectionContent))
        .setThumbnailAccessory(thumb => thumb.setURL(thumbnailURL))
    )
    .addSeparatorComponents(sep => sep.setDivider(true).setSpacing(SeparatorSpacingSize.Small))
    .addTextDisplayComponents(td => td.setContent(bodyContent))
    .addSeparatorComponents(sep => sep.setDivider(true).setSpacing(SeparatorSpacingSize.Small))
    .addActionRowComponents(playbackButtons());

  return { components: [container], flags: 36864 };
}

/**
 * Container with Hakari header, separator, and rejection text. Uses accent color.
 * Replaces Pattern 4 (interactionCreate, messageCreate).
 */
function rejectMessage(content) {
  const container = new ContainerBuilder()
    .setAccentColor(ACCENT_COLOR)
    .addTextDisplayComponents(td => td.setContent(`**${EMOJIS.bot.hakari} Hakari Music**`))
    .addSeparatorComponents(sep => sep.setDivider(true).setSpacing(SeparatorSpacingSize.Small))
    .addTextDisplayComponents(td => td.setContent(content));

  return { components: [container], flags: MessageFlags.IsComponentsV2 };
}

/**
 * Help card — Section with thumbnail, separator, body text, optional media gallery.
 * For help.js.
 */
function hakariHelpCard({ headerContent, bodyContent, thumbnailURL = FALLBACK_THUMB, galleryURLs, accentColor = HELP_ACCENT } = {}) {
  const container = new ContainerBuilder()
    .setAccentColor(accentColor)
    .addSectionComponents(section =>
      section
        .addTextDisplayComponents(td => td.setContent(headerContent))
        .setThumbnailAccessory(thumb => thumb.setURL(thumbnailURL).setDescription('Hakari'))
    )
    .addSeparatorComponents(sep => sep.setDivider(true).setSpacing(SeparatorSpacingSize.Small))
    .addTextDisplayComponents(td => td.setContent(bodyContent));

  if (galleryURLs && galleryURLs.length > 0) {
    container.addMediaGalleryComponents(gallery => {
      for (const url of galleryURLs) {
        gallery.addItems(item => item.setURL(url).setDescription('Help image'));
      }
      return gallery;
    });
  }

  return { components: [container], flags: MessageFlags.IsComponentsV2 };
}

module.exports = {
  hakariMessage,
  hakariCard,
  hakariPlayerCard,
  rejectMessage,
  hakariHelpCard,
  playbackButtons,
  ACCENT_COLOR,
  HELP_ACCENT,
  FALLBACK_THUMB,
  NOW_PLAYING_GIF,
  MessageFlags,
};
