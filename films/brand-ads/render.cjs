// node render.cjs biscuit              → biscuit.mp4 (needs audio-biscuit.wav from: node audio.cjs biscuit)
// node render.cjs biscuit stills 1 5   → still frames at those seconds (STILLS_DIR sets the folder)
const { chromium } = require('playwright');
const { spawn } = require('child_process');
const fs = require('fs'), path = require('path');
const dir = __dirname, film = process.argv[2] || 'biscuit';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 540, height: 960 } });
  page.on('pageerror', e => console.error('page error:', e.message));
  await page.goto('file://' + path.join(dir, 'index.html') + `?film=${film}&render`);
  await page.waitForFunction(() => window.ready);
  await page.evaluate(() => document.fonts.ready);
  const { FPS, DUR } = await page.evaluate(() => ({ FPS: FILM.FPS, DUR: FILM.DUR }));
  const grab = async t => Buffer.from((await page.evaluate(t => FILM.frame(t), t)).split(',')[1], 'base64');

  if (process.argv[3] === 'stills') {
    const out = process.env.STILLS_DIR || dir;
    for (const s of process.argv.slice(4)) fs.writeFileSync(path.join(out, `${film}-${s}.jpg`), await grab(+s));
    await browser.close(); return;
  }
  const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-c:v', 'mjpeg', '-framerate', String(FPS), '-i', '-',
    '-i', path.join(dir, `audio-${film}.wav`), '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '24', '-preset', 'medium',
    '-c:a', 'aac', '-b:a', '192k', '-shortest', '-movflags', '+faststart', path.join(dir, `${film}.mp4`)], { stdio: ['pipe', 'inherit', 'inherit'] });
  const N = Math.round(FPS * DUR);
  for (let i = 0; i < N; i++) {
    if (!ff.stdin.write(await grab(i / FPS))) await new Promise(r => ff.stdin.once('drain', r));
  }
  ff.stdin.end(); await new Promise(r => ff.on('close', r)); await browser.close();
  console.log(film, 'done');
})();
