// main.js — ?f=h|v (16:9 with a 4:3 gate, or 9:16 with a 3:4 gate) · ?thumb=1 the thumbnail card · ?nosub=1
import * as T from './toon.js';
import { makeFilm, post } from './film.js';
import * as SC from './scenes.js';
import * as ST from './story.js';
import { buildEvents } from './events.js';
const Q = new URLSearchParams(location.search), V = Q.get('f') === 'v', THUMB = Q.get('thumb') === '1';
const W = V ? 1080 : 1920, H = V ? 1920 : 1080, GATE = V ? { x: 0, y: 240, w: 1080, h: 1440, r: 28 } : { x: 240, y: 0, w: 1440, h: 1080, r: 28 };
const cv = document.getElementById('c'); cv.width = W; cv.height = H;
for (const f of ['40px "Yatra One"', '40px "Rozha One"', '40px "Tiro Devanagari Hindi"', '40px Limelight']) await document.fonts.load(f, 'दादी Ag');
const lines = await (await fetch('voice/lines.json')).json(), dur = await (await fetch('voice/dur.json')).json();
const logo = new Image(); logo.src = 'logo_src.png'; await logo.decode();
const F = makeFilm(cv, W, H, GATE); T.init(F.scene);
SC.init({ sg: F.sg, F, GATE, v: V, logo, subs: ST.subs(lines, dur) }); SC.setDur(dur);
if (THUMB) {
  window.DUR = 1 / 24; window.EV = [];
  window.render = () => { const g = cv.getContext('2d'); T.init(cv); SC.thumb(g, W, H); const im = g.getImageData(0, 0, W, H); g.filter = 'sepia(0.3) contrast(1.1)'; const tmp = document.createElement('canvas'); tmp.width = W; tmp.height = H; tmp.getContext('2d').putImageData(im, 0, 0); g.setTransform(1, 0, 0, 1, 0, 0); g.drawImage(tmp, 0, 0); g.filter = 'none'; };
} else {
  const nosub = Q.get('nosub') === '1';
  window.DUR = ST.DUR;
  window.render = t => {
    t = Math.min(t, ST.DUR - 1e-4); T.init(F.scene);
    SC.frameAt(t); if (!nosub) SC.subtitles(t);
    const f = Math.round(t * 24), jump = SC.CUTS.some(c => Math.abs(Math.round(c * 24) - f) === 0) ? 3 : 0;
    post(F, t, { jump }); SC.bug(F.g, t);
  };
  window.EV = buildEvents(dur);
}
window.READY = true;
