import { setup, render } from './film.js';
await Promise.all(['700 40px Teko', '600 40px Poppins'].map(f => Promise.all([document.fonts.load(f, 'सितारों का शहर'), document.fonts.load(f, 'ASTROVERSE 0123')])));
const all = await (await fetch('rashi.json')).json();
const logo = new Image(); logo.src = 'logo_mark.png'; await logo.decode();
const TL = setup(document.getElementById('c'), { all, logo });
window.DUR = TL.dur; window.EV = TL.ev; window.render = render; window.READY = true;
