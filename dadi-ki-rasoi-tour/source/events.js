// events.js — the sound events (window.EV → events.json → mix.py); foley follows the material: clay, stone, wood, brass, grain, water
import * as ST from './story.js';
export function buildEvents(dur) {
  const E = [], add = (t, type, o = {}) => E.push({ t: +t.toFixed(4), type, ...o });
  for (const [id, t] of Object.entries(ST.VO)) add(t, 'vo', { id, d: dur[id] });
  add(0.05, 'irisOpen'); add(2.3, 'bowCreak');
  add(ST.TITLE[0], 'cardHit'); add(ST.TITLE[1] - .35, 'shade', { d: .35 });
  // walking: brass steps on each beat
  const walks = [[13, ST.SK[0] + 2], ...ST.SK.slice(1).map(s => [s, s + 2])];
  for (const [a, b] of walks) for (let t = a; t < b - .01; t += ST.BEAT) add(t, 'step');
  ST.SK.forEach((s, i) => {
    const u0 = s + 2, st = ST.STING[i], end = ST.SEND[i];
    add(s + 1.6, 'wake', { i });
    add(st, 'sting', { i });
    const name = ST.STATIONS[i];
    if (name === 'chulha') { for (let t = u0 + 1.5; t < end - .3; t += ST.BEAT) add(t, 'blow'); add(u0, 'fire', { d: end - u0 }); add(st, 'whoosh'); }
    if (name === 'sil') for (let t = u0 + .5; t < end - .3; t += ST.BEAT) add(t, 'grind');
    if (name === 'okhli') for (let t = Math.ceil(u0 + .5); t < end - .3; t += 1) add(t, 'thud');
    if (name === 'chakki') { add(u0 + .3, 'millLoop', { d: end - u0 - .6 }); add(st, 'dizzy'); }
    if (name === 'mathani') { for (let t = u0 + .4; t < end - .3; t += ST.BEAT) add(t, 'churn'); add(st, 'bloop'); }
    if (name === 'soop') { for (let t = u0 + .5; t < end - .3; t += ST.BEAT) add(t, 'toss'); add(st, 'slide'); }
    if (name === 'matka') { add(u0 + 1, 'drips', { d: end - u0 - 1.5 }); add(u0 + 2, 'breeze', { d: end - u0 - 2.5 }); add(st, 'shiver'); }
  });
  add(ST.FINALE[0], 'cardHit');
  for (let t = ST.FINALE[0]; t < ST.FINALE[1] + .6; t += ST.BEAT) add(t, 'hop');
  add(ST.END[0], 'slideCard', { d: .7 }); add(ST.DUR - 1.2, 'irisThunk');
  add(0, 'projector', { d: ST.DUR });
  return E.sort((a, b) => a.t - b.t);
}
