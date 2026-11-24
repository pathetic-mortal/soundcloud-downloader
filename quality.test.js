// Run: node quality.test.js
const assert = require('assert');
require('./quality.js');
require('./id3.js');

const t = (preset, mime, protocol = 'hls', quality = 'sq') => ({ preset, quality, format: { mime_type: mime, protocol } });
const hq = t('aac_256k', 'audio/mp4; codecs="mp4a.40.2"', 'hls', 'hq');
const aac = t('aac_160k', 'audio/mp4; codecs="mp4a.40.2"');
const mp3Prog = t('mp3_1_0', 'audio/mpeg', 'progressive');
const mp3Hls = t('mp3_1_0', 'audio/mpeg');
const opus = t('opus_0_0', 'audio/ogg; codecs="opus"');
const order = [opus, mp3Hls, aac, mp3Prog, hq].sort((a, b) => scdlStreamScore(b) - scdlStreamScore(a));
assert.deepStrictEqual(order, [hq, aac, mp3Prog, mp3Hls, opus], 'best stream first, mp3 file before mp3 HLS');

const bytes = (s, pad = 12) => Uint8Array.from([...s].map((c) => c.charCodeAt(0)).concat(Array(pad).fill(0)));
assert.strictEqual(scdlSniffAudio(bytes('fLaC')), 'flac');
assert.strictEqual(scdlSniffAudio(bytes('RIFF\0\0\0\0WAVE')), 'wav');
assert.strictEqual(scdlSniffAudio(bytes('FORM\0\0\0\0AIFF')), 'aiff');
assert.strictEqual(scdlSniffAudio(bytes('\0\0\0\x20ftypM4A ')), 'm4a');
assert.strictEqual(scdlSniffAudio(Uint8Array.of(0xff, 0xfb, 0x90, 0x00)), 'mp3');
assert.strictEqual(scdlSniffAudio(bytes('<html>')), null, 'an error page is not audio');

const audio = Uint8Array.of(0xff, 0xfb, 1, 2, 3);
const tagged = new Uint8Array([...scdlId3({ title: 'x' }), ...audio]);
assert.strictEqual(scdlSniffAudio(tagged), 'mp3');
assert.deepStrictEqual([...scdlStripId3(tagged)], [...audio], 'old ID3 removed, audio intact');
assert.deepStrictEqual([...scdlStripId3(audio)], [...audio], 'untagged mp3 unchanged');
console.log('quality ok');
