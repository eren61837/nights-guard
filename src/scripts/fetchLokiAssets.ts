import axios from 'axios';

async function checkUrl(url: string) {
  try {
    const res = await axios.head(url);
    console.log(url, 'STATUS:', res.status, res.headers['content-type'], res.headers['content-length']);
    return true;
  } catch (e: any) {
    console.log(url, 'FAILED:', e.message);
    return false;
  }
}

async function main() {
  await checkUrl('https://raw.githubusercontent.com/jmeridth/emojis/master/loki.png');
  await checkUrl('https://raw.githubusercontent.com/katerberg/emojis/master/loki.png');
}
main();
