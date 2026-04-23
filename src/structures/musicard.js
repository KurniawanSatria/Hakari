// src/structures/musicard.js - Music card generator

const { Bloom, initializeFonts, GlobalFonts } = require('musicard');
const path = require('path');
const fs = require('fs');

let fontsInitialized = false;

async function initFonts() {
  if (fontsInitialized) return;
  try {
    await initializeFonts();
    fontsInitialized = true;
  } catch (e) {
    console.error('Failed to init musicard fonts:', e.message);
  }
}

function msToTime(ms) {
  if (!ms || ms < 0) return '0:00';
  const totalSec = Math.floor(ms / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

async function generateNowPlayingCard(track) {
  try {
    const title = track.title || 'Unknown';
    const author = track.author || 'Unknown';
    const thumb = track.thumbnail || '';
    const duration = msToTime(track.duration);
    const position = track.duration ? Math.floor(((track.position || 0) / track.duration) * 100) : 0;
    
    const card = await Bloom({
      trackName: title,
      artistName: author,
      albumArt: thumb,
      timeAdjust: {
        timeStart: msToTime(track.position || 0),
        timeEnd: duration
      },
      progressBar: position || 10,
      backgroundColor: '#1a1a2e',
      styleConfig: {
        trackStyle: { textColor: '#ffffff' },
        artistStyle: { textColor: '#b8b8b8' },
        progressBarStyle: { barColor: '#6366f1', barColorDuo: true },
        timeStyle: { textColor: '#b8b8b8' }
      }
    });
    
    return card;
  } catch (e) {
    console.error('Musicard error:', e.message);
    return null;
  }
}

module.exports = {
  initFonts,
  generateNowPlayingCard,
  msToTime
};