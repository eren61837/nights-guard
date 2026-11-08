import axios from 'axios';
import fs from 'fs';
import path from 'path';

async function main() {
  const prompt = 'Nights luxury discord server icon, glowing neon crescent moon and starry night sky with modern letter N emblem, deep midnight blue, purple and cyan neon, ultra sleek minimalist typography';
  const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=512&height=512&nologo=true&seed=99421`;
  console.log('Fetching logo from:', url);
  try {
    const res = await axios.get(url, { responseType: 'arraybuffer', timeout: 20000 });
    console.log('Logo downloaded:', res.headers['content-type'], res.data.byteLength, 'bytes');
    const outPath = path.resolve('assets/nights_logo.jpg');
    fs.writeFileSync(outPath, Buffer.from(res.data));
    console.log('Saved to:', outPath);
  } catch (e: any) {
    console.error('Pollinations failed:', e.message);
  }
}
main();
