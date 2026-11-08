import axios from 'axios';

const EMOJIS = [
  { name: 'Loki_Smile', url: 'https://cdn3.emoji.gg/emojis/37963-loki-smile.png' },
  { name: 'Loki_Marvel', url: 'https://cdn3.emoji.gg/emojis/73524-loki-marvelrivals.png' },
  { name: 'Loki_Heart', url: 'https://cdn3.emoji.gg/emojis/14479-lokiheart.png' },
  { name: 'Loki_Wink', url: 'https://cdn3.emoji.gg/emojis/35992-lokiwink.png' },
  { name: 'Loki_Cheers', url: 'https://cdn3.emoji.gg/emojis/92731-lokicheers.png' },
  { name: 'Loki_Laugh', url: 'https://cdn3.emoji.gg/emojis/33937-lokilaugh.png' },
  { name: 'Loki_ThumbsUp', url: 'https://cdn3.emoji.gg/emojis/23480-lokithumbsup.png' },
  { name: 'Loki_Wave', url: 'https://cdn3.emoji.gg/emojis/41156-lokiwave.png' },
  { name: 'Loki_Popcorn', url: 'https://cdn3.emoji.gg/emojis/63244-lokipopcorn.png' },
  { name: 'Loki_Stab', url: 'https://cdn3.emoji.gg/emojis/7566-lokistab.png' },
  { name: 'Loki_Vanish', url: 'https://cdn3.emoji.gg/emojis/9355-lokivanish.gif' },
  { name: 'Lokitty', url: 'https://cdn3.emoji.gg/emojis/8080-lokitty.png' },
  { name: 'Loki_Helmet', url: 'https://raw.githubusercontent.com/jmeridth/emojis/master/loki.png' },
  { name: 'Loki_Crown', url: 'https://raw.githubusercontent.com/katerberg/emojis/master/loki.png' },
  { name: 'Pepe_Wine', url: 'https://cdn3.emoji.gg/emojis/868020-pepewine.png' },
  { name: 'Pepe_Happy', url: 'https://cdn3.emoji.gg/emojis/943635-pepehappy.png' },
  { name: 'Pepe_Eat', url: 'https://cdn3.emoji.gg/emojis/985242-pepeeat.png' },
  { name: 'Pepe_Stare', url: 'https://cdn3.emoji.gg/emojis/689168-pepestare.png' },
  { name: 'Pepe_Stop', url: 'https://cdn3.emoji.gg/emojis/23615-pepestop.png' },
  { name: 'Discord_Nitro', url: 'https://cdn3.emoji.gg/emojis/330960-nitro.png' },
  { name: 'Nitro_Boost', url: 'https://cdn3.emoji.gg/emojis/526202-booster.png' },
  { name: 'Diamond_Pickaxe', url: 'https://cdn3.emoji.gg/emojis/137353-diamondpickaxe.gif' },
  { name: 'Diamond_Axe', url: 'https://cdn3.emoji.gg/emojis/223627-diamondaxe.gif' },
  { name: 'Magic_Potion', url: 'https://cdn3.emoji.gg/emojis/25903-potion.gif' },
  { name: 'Kitty_HeartEyes', url: 'https://cdn3.emoji.gg/emojis/27453-pinkkittyhearteyes.gif' },
  { name: 'Kitty_Money', url: 'https://cdn3.emoji.gg/emojis/868374-pinkkittymoneyeyes.gif' },
  { name: 'Delcatty_Dance', url: 'https://cdn3.emoji.gg/emojis/413937-delcatty.gif' },
  { name: 'DBZ_Logo', url: 'https://cdn3.emoji.gg/emojis/698180-dbzdragonballanimelogo.gif' },
];

async function main() {
  let ok = 0;
  for (const e of EMOJIS) {
    try {
      const res = await axios.get(e.url, {
        responseType: 'arraybuffer',
        timeout: 5000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        },
      });
      const kb = Math.round(res.data.byteLength / 1024);
      if (kb <= 256) {
        console.log(`[VALID] ${e.name} (${kb} KB, ${res.headers['content-type']})`);
        ok++;
      } else {
        console.log(`[TOO BIG] ${e.name} (${kb} KB)`);
      }
    } catch (err: any) {
      console.log(`[FAIL] ${e.name}: ${err.message}`);
    }
  }
  console.log(`\nValid emojis: ${ok}/${EMOJIS.length}`);
}
main();
