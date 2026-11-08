import axios from 'axios';

async function getCategory(term: string): Promise<string[]> {
  try {
    const res = await axios.get(`https://emoji.gg/search?q=${encodeURIComponent(term)}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
      timeout: 8000,
    });
    const html: string = res.data;
    const matches: string[] = html.match(/https:\/\/cdn3?\.emoji\.gg\/emojis\/[^"'\s]+/g) || [];
    const unique = Array.from(new Set(matches)).filter((u: string) => !u.includes('play-store') && !u.includes('annoyed2') && !u.includes('wechat-ok'));
    console.log(`Term "${term}": Found ${unique.length} emojis`);
    return unique;
  } catch (e: any) {
    console.warn(`Term "${term}" failed:`, e.message);
    return [];
  }
}

async function main() {
  const categories = ['pepe', 'cat', 'anime', 'gaming', 'hype', 'nitro'];
  const results: Record<string, string[]> = {};
  for (const cat of categories) {
    results[cat] = await getCategory(cat);
    await new Promise((r) => setTimeout(r, 600));
  }
  for (const [k, v] of Object.entries(results)) {
    console.log(`\n=== Category: ${k} (${v.length}) ===`);
    v.slice(0, 8).forEach((u) => console.log(u));
  }
}
main();
