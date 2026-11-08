const axios = require('axios');

async function test() {
  const res = await axios.get('https://emoji.gg/api', { headers: { 'User-Agent': 'Mozilla/5.0' } });
  const emojis = res.data;
  console.log('Total emojis:', emojis.length);

  // Filter out any weird names, sanitize emoji name to alphanumeric + underscores
  const valid = emojis.filter(e => e.image && e.title);
  const sorted = valid.sort((a, b) => (b.faves || 0) - (a.faves || 0));

  console.log('Top 20 emojis:');
  sorted.slice(0, 20).forEach(e => {
    console.log(e.title, e.faves, e.image);
  });
}

test().catch(console.error);
