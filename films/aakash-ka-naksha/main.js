// Page contract: ?a=&b= renders the [a, b) stretch of the film clock; &nocap=1 leaves the subtitles out (poster still).
import { setup, render, texts } from './film.js';
const Q = new URLSearchParams(location.search);
await Promise.all(['500 40px Teko', '600 40px Teko', '700 40px Teko', '500 40px Poppins', '600 40px Poppins'].map(f => Promise.all([document.fonts.load(f, 'आकाश'), document.fonts.load(f, '0123')])));
const cues = await (await fetch('voice/cues.json')).json();
const TL = setup(document.getElementById('c'), { cues, nocap: Q.get('nocap') === '1' });
const A = +(Q.get('a') ?? 0), Bn = +(Q.get('b') ?? TL.dur);
window.DUR = +(Bn - A).toFixed(3);
window.EV = TL.ev.filter(e => e.t >= A - 1e-6 && e.t < Bn).map(e => ({ ...e, t: +(e.t - A).toFixed(3) }));
window.render = t => render(t + A);
window.TEXTS = t => texts(t + A);
window.READY = true;
