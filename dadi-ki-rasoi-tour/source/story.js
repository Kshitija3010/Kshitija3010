// story.js — the single source of truth: tempo grid, voice times, stations, key moments, subtitles
export const BPM = 120, BEAT = 0.5, BAR = 2.0;               // one beat = 12 frames at 24 fps
export const bar = n => n * BAR;
export const DUR = 104;
export const TITLE = [6.0, 8.5];                             // title card
export const STATIONS = ['chulha', 'sil', 'okhli', 'chakki', 'mathani', 'soop', 'matka'];
export const SK = [14, 24, 34, 44, 54, 64, 74];              // station start (walk-in), 2 s walk, then the routine
export const SEND = [24, 34, 44, 54, 64, 74, 86];
export const XK = [900, 1850, 2800, 3750, 4700, 5650, 6600]; // tool x on the long floor
export const LOTU_DX = -270;                                 // Lotu stands left of the tool
export const STING = SK.map((s, i) => s + (i === 6 ? 9.0 : 7.5));   // the gag peak of each station
export const FINALE = [86, 92], END = [92, 104];
export const VO = { L1: 1.0, L2: 8.75, L3: 16.0, L4: 26.0, L5: 36.0, L6: 46.0, L7: 56.0, L8: 66.0, L9: 76.0, L10: 86.5, L11: 93.0, L12: 98.5 };
export const STAGE_X = 7900;
// subtitles: [t0, t1, text]
export function subs(lines, dur) {
  return Object.entries(VO).map(([id, t]) => [t - 0.15, t + dur[id] + 0.5, lines.find(l => l.id === id).sub]);
}
