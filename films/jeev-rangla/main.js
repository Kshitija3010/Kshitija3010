import { setup, render } from './film.js';
await Promise.all([document.fonts.load('700 40px Kalam', 'जीव रंगला'), document.fonts.load('700 40px Kalam', '— (2009)')]);
const TL = setup(document.getElementById('c'));
window.DUR = TL.dur; window.EV = TL.ev; window.render = render; window.READY = true;
