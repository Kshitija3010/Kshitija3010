// Page contract: ?r=<rashi id>&f=h|v ; &a=&b= a stretch of the film clock; &nocap=1 no subtitles (thumbnails).
import { setup, render, texts } from './film.js';
const Q = new URLSearchParams(location.search);
await Promise.all(['500 40px Teko', '600 40px Teko', '700 40px Teko', '500 40px Poppins', '600 40px Poppins'].map(f => Promise.all([document.fonts.load(f, 'आकाश'), document.fonts.load(f, 'Kathaverse 0123')])));
const all = await (await fetch('rashi.json')).json();
const r = Q.get('r') || 'mesh';
const cues = await (await fetch(`voice/${r}-cues.json`)).json();
const logo = new Image(); logo.src = 'logo_mark.png'; await logo.decode();
const logoFull = new Image(); logoFull.src = 'logo_full.jpg'; await logoFull.decode();
const TL = setup(document.getElementById('c'), { all, r, f: Q.get('f') || 'h', cues, logo, logoFull, thumb: Q.get('thumb') === '1', nocap: Q.get('nocap') === '1' });
const A = +(Q.get('a') ?? 0), Bn = +(Q.get('b') ?? TL.dur);
window.DUR = +(Bn - A).toFixed(3);
window.EV = TL.ev.filter(e => e.t >= A - 1e-6 && e.t < Bn).map(e => ({ ...e, t: +(e.t - A).toFixed(3) }));
window.render = t => render(t + A);
window.TEXTS = t => texts(t + A);
window.READY = true;
