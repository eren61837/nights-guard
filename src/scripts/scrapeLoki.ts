import axios from 'axios';

async function main() {
  try {
    const res = await axios.get('https://emoji.gg/search?q=loki', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
    });
    const html = res.data;
    const matches = html.match(/https:\/\/cdn3?\.emoji\.gg\/emojis\/[^"'\s]+/g) || [];
    const unique = [...new Set(matches)];
    console.log(`Found ${unique.length} CDN image URLs:`);
    unique.forEach((u) => console.log(u));
  } catch (e: any) {
    console.error('Error:', e.message);
  }
}
main();
