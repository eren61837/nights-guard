import axios from 'axios';

const CANDIDATES = [
  { name: 'Loki_Crown', url: 'https://raw.githubusercontent.com/katerberg/emojis/master/loki.png', tag: '👑' },
  { name: 'Loki_Mischief', url: 'https://cdn3.emoji.gg/emojis/37963-loki-smile.png', tag: '😈' },
  { name: 'Loki_Marvel', url: 'https://cdn3.emoji.gg/emojis/73524-loki-marvelrivals.png', tag: '💚' },
  { name: 'Loki_Cheers', url: 'https://cdn3.emoji.gg/emojis/92731-lokicheers.png', tag: '🥂' },
  { name: 'Lokitty', url: 'https://cdn3.emoji.gg/emojis/8080-lokitty.png', tag: '🐱' },
  { name: 'Pepe_Wine', url: 'https://cdn3.emoji.gg/emojis/868020-pepewine.png', tag: '🍷' },
  { name: 'Pepe_Happy', url: 'https://cdn3.emoji.gg/emojis/943635-pepehappy.png', tag: '😊' },
  { name: 'Pepe_Stare', url: 'https://cdn3.emoji.gg/emojis/689168-pepestare.png', tag: '👀' },
  { name: 'Vegeta_Power', url: 'https://cdn.stickers.gg/stickers/59491-vegeta.png', tag: '⚡' },
  { name: 'Rigby_Gaming', url: 'https://cdn.stickers.gg/stickers/64387-rigby.png', tag: '🎮' },
  { name: 'Deadly_Kirby', url: 'https://cdn.stickers.gg/stickers/9917-deadlycurby.png', tag: '💥' },
  { name: 'Cute_Cat', url: 'https://cdn.stickers.gg/stickers/5312-cute-cat-4.png', tag: '❤️' },
  { name: 'Nitro_Booster', url: 'https://cdn3.emoji.gg/emojis/526202-booster.png', tag: '🚀' },
];

async function main() {
  for (const s of CANDIDATES) {
    try {
      const res = await axios.get(s.url, {
        responseType: 'arraybuffer',
        timeout: 5000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        },
      });
      const sizeKb = Math.round(res.data.byteLength / 1024);
      const isOk = sizeKb <= 512;
      console.log(`[${isOk ? 'VALID' : 'TOO BIG'}] ${s.name}: ${res.headers['content-type']} (${sizeKb} KB)`);
    } catch (e: any) {
      console.log(`[FAIL] ${s.name}: ${e.message}`);
    }
  }
}
main();
