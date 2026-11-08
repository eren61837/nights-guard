const axios = require('axios');

async function getCuratedEmojis() {
  const res = await axios.get('https://emoji.gg/api', { headers: { 'User-Agent': 'Mozilla/5.0' } });
  const all = res.data;

  // Let's filter out inappropriate / NSFW names
  const blocked = ['nsfw', 'porn', 'thot', 'loli', 'lewd', 'boob', 'dick', 'sex', 'gay', 'kill'];
  
  const clean = all.filter(e => {
    if (!e.title || !e.image) return false;
    const nameLower = e.title.toLowerCase();
    return !blocked.some(b => nameLower.includes(b));
  });

  // Sort by favorites descending
  clean.sort((a, b) => (b.faves || 0) - (a.faves || 0));

  const staticEmojis = clean.filter(e => e.image.endsWith('.png'));
  const animatedEmojis = clean.filter(e => e.image.endsWith('.gif'));

  console.log('Clean static count:', staticEmojis.length);
  console.log('Clean animated count:', animatedEmojis.length);

  console.log('\nTop 10 Static:');
  staticEmojis.slice(0, 10).forEach(e => console.log(`  - ${e.title} (${e.faves} faves): ${e.image}`));

  console.log('\nTop 10 Animated:');
  animatedEmojis.slice(0, 10).forEach(e => console.log(`  - ${e.title} (${e.faves} faves): ${e.image}`));
}

getCuratedEmojis().catch(console.error);
