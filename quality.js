// Choosing the best audio SoundCloud will give us, and recognising original uploads.

// Higher = better. Bitrate first (HQ AAC 256 > AAC 160 > MP3 128 > Opus 64); on a tie prefer mp3 (no re-encode)
// and a single progressive file over HLS segments.
globalThis.scdlStreamScore = (t) => {
  const mime = t.format?.mime_type || '';
  const preset = t.preset || '';
  const kbps = Number(preset.match(/(\d+)k/)?.[1])
    || (t.quality === 'hq' ? 256 : 0)
    || (mime.startsWith('audio/mpeg') ? 128 : mime.includes('opus') ? 64 : mime.startsWith('audio/mp4') ? 160 : 0);
  return kbps * 10 + (mime.startsWith('audio/mpeg') ? 2 : 0) + (t.format?.protocol === 'progressive' ? 1 : 0);
};

// File type of an original upload from its first bytes; null when it isn't audio we recognise.
globalThis.scdlSniffAudio = (b) => {
  const at = (o, s) => [...s].every((c, i) => b[o + i] === c.charCodeAt(0));
  if (at(0, 'fLaC')) return 'flac';
  if (at(0, 'RIFF') && at(8, 'WAVE')) return 'wav';
  if (at(0, 'FORM') && (at(8, 'AIFF') || at(8, 'AIFC'))) return 'aiff';
  if (at(0, 'OggS')) return 'ogg';
  if (at(4, 'ftyp')) return 'm4a';
  if (at(0, 'ID3') || (b[0] === 0xff && (b[1] & 0xe0) === 0xe0)) return 'mp3';
  return null;
};

// Drops an existing ID3v2 tag so ours is the only one.
globalThis.scdlStripId3 = (b) => {
  if (!(b[0] === 0x49 && b[1] === 0x44 && b[2] === 0x33)) return b; // "ID3"
  const size = ((b[6] & 0x7f) << 21) | ((b[7] & 0x7f) << 14) | ((b[8] & 0x7f) << 7) | (b[9] & 0x7f);
  const footer = b[5] & 0x10 ? 10 : 0;
  return b.subarray(10 + size + footer);
};
