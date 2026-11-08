import axios from 'axios';

const urls = [
  'https://media.giphy.com/media/26tn3334mvoVClhos/giphy.gif',
  'https://media.giphy.com/media/EPfV3ijMQVl60/giphy.gif',
  'https://media.giphy.com/media/ErZ8hv5eO92JW/giphy.gif',
  'https://media1.giphy.com/media/v1.Y2lkPTc5MGI3NjExM3ZqOHo0bTJ5eWpkaWZ1Z29reTFrMmtnOGUza2Q1bDJqZ214NnB3dyZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/L1R1tvI9svkIWwpVYr/giphy.gif',
];

async function main() {
  for (const u of urls) {
    try {
      const res = await axios.head(u);
      console.log('STATUS:', res.status, u);
    } catch (e: any) {
      console.log('FAIL:', e.message, u);
    }
  }
}
main();
