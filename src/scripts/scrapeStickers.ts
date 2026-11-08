import axios from 'axios';

async function searchStickers(query: string) {
  try {
    const res = await axios.get(`https://stickers.gg/search?q=${encodeURIComponent(query)}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
      timeout: 8000,
    });
    const html = res.data;
    const matches = html.match(/https:\/\/cdn\.stickers\.gg\/stickers\/[^"'\s]+\.(png|webp|gif)/gi) || [];
    const unique = [...new Set(matches)];
    console.log(`Query "${query}": Found ${unique.length} stickers:`);
    unique.forEach((u) => console.log(`  ${u}`));
    return unique;
  } catch (e: any) {
    console.error(`Query "${query}" failed:`, e.message);
    return [];
  }
}

async function main() {
  await searchStickers('loki');
  await searchStickers('pepe');
  await searchStickers('cat');
  await searchStickers('gaming');
}
main();
