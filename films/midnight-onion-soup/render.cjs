// node render.cjs            → renders midnight-onion-soup.mp4 (needs audio.wav from audio.cjs)
// node render.cjs stills 1 5 → saves still frames at the given seconds, for checking
const { chromium } = require('playwright');
const { spawn } = require('child_process');
const fs = require('fs'), path = require('path');
const dir = __dirname;

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 540, height: 960 } });
  page.on('pageerror', e => console.error('page error:', e.message));
  await page.goto('file://' + path.join(dir, 'index.html') + '?render');
  await page.waitForFunction(() => window.ready);
  const { FPS, DUR } = await page.evaluate(() => ({ FPS: FILM.FPS, DUR: FILM.DUR }));
  const grab = async t => Buffer.from((await page.evaluate(t => FILM.frame(t), t)).split(',')[1], 'base64');

  if (process.argv[2] === 'stills') {
    const out = process.env.STILLS_DIR || dir;
    for (const s of process.argv.slice(3)) fs.writeFileSync(path.join(out, `still-${s}.jpg`), await grab(+s));
    await browser.close(); return;
  }
  const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-c:v', 'mjpeg', '-framerate', String(FPS), '-i', '-',
    '-i', path.join(dir, 'audio.wav'), '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '20', '-preset', 'medium',
    '-c:a', 'aac', '-b:a', '192k', '-shortest', '-movflags', '+faststart', path.join(dir, 'midnight-onion-soup.mp4')], { stdio: ['pipe', 'inherit', 'inherit'] });
  const N = Math.round(FPS * DUR);
  for (let i = 0; i < N; i++) {
    if (!ff.stdin.write(await grab(i / FPS))) await new Promise(r => ff.stdin.once('drain', r));
    if (i % (FPS * 2) === 0) console.log(`frame ${i}/${N}`);
  }
  ff.stdin.end(); await new Promise(r => ff.on('close', r)); await browser.close();
  console.log('done');
})();
