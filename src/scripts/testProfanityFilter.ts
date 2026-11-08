export function isProfane(rawContent: string): boolean {
  if (!rawContent) return false;

  const lower = rawContent.toLowerCase();

  // 1. Türkçe karakterleri ve leetspeak normalizasyonu
  const normalized = lower
    .replace(/ı/g, 'i')
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c')
    .replace(/0/g, 'o')
    .replace(/1/g, 'i')
    .replace(/3/g, 'e')
    .replace(/4/g, 'a')
    .replace(/@/g, 'a')
    .replace(/\$/g, 's')
    .replace(/!/g, 'i');

  // Harf dışındaki her şeyi sil ve ardışık tekrarları (örn: "aaaaammmmkkkk" -> "amk") sıkıştır
  const collapsed = normalized.replace(/[^a-z]/g, '').replace(/(.)\1{2,}/g, '$1$1');
  const fullyCollapsed = normalized.replace(/[^a-z]/g, '').replace(/(.)\1+/g, '$1');

  // 2. Amcık / Amcuk / Amcük / Amck / Amcq her türlü varyasyonu:
  // "amc" kökünden sonra 'a' (amca / amcamlar) hariç 'i', 'u', 'o', 'k', 'g', 'q' gelmesi kesinlikle küfürdür.
  if (/amc([iuo]|[kgq])/i.test(normalized) || /amc([iuo]|[kgq])/i.test(collapsed) || /amc([iuo]|[kgq])/i.test(fullyCollapsed)) {
    return true;
  }

  // 3. Orospu / Oruspu / Orosbu / Orozbu / Orspu varyasyonları
  if (/or[ou]?[sz][pb][ou]/i.test(normalized) || /or[ou]?[sz][pb][ou]/i.test(collapsed) || /or[ou]?[sz][pb][ou]/i.test(fullyCollapsed)) {
    return true;
  }

  // 4. Asla masum olmayan mutlak küfür kökleri (Substring olarak aranır)
  const absoluteRoots = [
    'siktir',
    'sikeyim',
    'sikerim',
    'siktim',
    'sikis',
    'sikik',
    'sikerler',
    'siktigim',
    'amguard',
    'aminakoy',
    'amkoy',
    'aminak',
    'amkoyim',
    'amkoyayim',
    'yarrak',
    'yarram',
    'yarrag',
    'dalyarak',
    'pezevenk',
    'pezeveng',
    'kahpe',
    'kahbe',
    'gotveren',
    'gotlek',
    'gotos',
    'götoş',
    'sikkafali',
    'sik kafali',
    'amferyad',
    'am feryadi',
    'ambiti',
    'am biti',
    'tassak',
    'dassak',
    'ananisik',
    'anaskm',
    'anani sikerim',
    'ananin ami',
    'bacinisi',
    'sulalenisi'
  ];

  for (const root of absoluteRoots) {
    if (normalized.includes(root) || collapsed.includes(root) || fullyCollapsed.includes(root)) {
      return true;
    }
  }

  // 5. Kelime bazlı tam eşleşmeler (Boşluk/noktalama ile ayrılmış kelimeler)
  const words = normalized
    .replace(/[^a-z0-9]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);

  const exactBadWords = new Set([
    'amk',
    'amq',
    'aq',
    'awk',
    'oc',
    'pic',
    'pust',
    'sik',
    'ibne',
    'ipne',
    'yarak',
    'amina',
    'amguard',
    'tasak',
    'dasak'
  ]);

  for (const w of words) {
    const dedup = w.replace(/(.)\1+/g, '$1');
    if (exactBadWords.has(w) || exactBadWords.has(dedup)) {
      return true;
    }
    // "sik" ile başlayan küfür fiilleri: sikim, sikem, siksin, sike, siktir
    if (/^sik(im|em|sin|e|er|ti|me|mis|sen|ko)?$/.test(w) || /^sik(im|em|sin|e|er|ti|me|mis|sen|ko)?$/.test(dedup)) {
      return true;
    }
    // "oç" veya "oc"
    if (w === 'oc' || dedup === 'oc') return true;
    // "göt" (özellikle Türkçe ö harfiyle yazılmışsa)
    if (w === 'got' && lower.includes('göt')) return true;
    // "yarak" veya "yarrak"
    if (/^yarra?[kg]$/.test(w) || /^yarra?[kg]$/.test(dedup)) return true;
  }

  // 6. Noktalı veya boşluklu gizlenmiş küfürler: "o.ç", "o ç", "a.m.k", "a m k", "p.i.ç", "s.i.k", "a m c u k"
  if (/\b(o\s*[\.\,\_\*\-\s]\s*c|a\s*[\.\,\_\*\-\s]\s*m\s*[\.\,\_\*\-\s]\s*k|p\s*[\.\,\_\*\-\s]\s*i\s*[\.\,\_\*\-\s]\s*c|s\s*[\.\,\_\*\-\s]\s*i\s*[\.\,\_\*\-\s]\s*k)\b/i.test(normalized)) {
    return true;
  }

  return false;
}

// Test Suite
const tests = [
  // User's specific cases: "amcuk" ve her ihtimali
  { text: 'amcuk', expected: true },
  { text: 'amcukkk', expected: true },
  { text: 'amcuklar', expected: true },
  { text: 'amcugunu', expected: true },
  { text: 'a m c u k', expected: true },
  { text: 'amcük', expected: true },
  { text: 'amcık', expected: true },
  { text: 'amcik', expected: true },
  { text: 'amcok', expected: true },
  { text: 'amcığı', expected: true },
  { text: 'amck', expected: true },
  { text: 'amcq', expected: true },
  { text: 'am feryadı', expected: true },
  { text: 'ambiti', expected: true },
  { text: 'sik kafalı', expected: true },
  { text: 'götoş', expected: true },

  // Masum "amca" kelimesi (ASLA engellenmemeli!)
  { text: 'amcam geldi', expected: false },
  { text: 'amca nasılsın', expected: false },
  { text: 'amcamlar bize oturmaya geldi', expected: false },

  // Diğer küfürler
  { text: 'amk', expected: true },
  { text: 'amkkkk', expected: true },
  { text: 'aq', expected: true },
  { text: 'a.m.k', expected: true },
  { text: 'a m k', expected: true },
  { text: 'orospu', expected: true },
  { text: 'oruspu', expected: true },
  { text: 'orosbu', expected: true },
  { text: 'orozbu', expected: true },
  { text: 'orospu çocuğu', expected: true },
  { text: 'oç', expected: true },
  { text: 'o ç', expected: true },
  { text: 'o.ç', expected: true },
  { text: 'piç', expected: true },
  { text: 'siktir git', expected: true },
  { text: 'sikeyim', expected: true },
  { text: 'yarrak', expected: true },
  { text: 'yarak', expected: true },
  { text: 'kahpe', expected: true },
  { text: 'pezevenk', expected: true },
  { text: 'ananı sikeyim', expected: true },
  { text: 'amına koyayım', expected: true },
  { text: 'sikik', expected: true },
  { text: 'ibne', expected: true },
  { text: 'göt', expected: true },
  { text: 'taşşak', expected: true },

  // Masum Cümleler (Hepsi false dönmeli)
  { text: 'merhaba nasılsın', expected: false },
  { text: 'yemek yiyorum', expected: false },
  { text: 'dakika kaç oldu', expected: false },
  { text: 'ekmek aldım', expected: false },
  { text: 'şarkıyı çalsana', expected: false },
  { text: 'odaya gelin', expected: false },
  { text: 'resim çizdim', expected: false },
  { text: 'hakkında bilgi verir misin', expected: false },
  { text: 'merak ettim', expected: false },
  { text: 'I got it', expected: false }
];

let failed = 0;
for (const t of tests) {
  const res = isProfane(t.text);
  if (res !== t.expected) {
    console.error(`❌ FAILED for "${t.text}": got ${res}, expected ${t.expected}`);
    failed++;
  } else {
    console.log(`✅ PASS: "${t.text}" => ${res}`);
  }
}

if (failed === 0) {
  console.log(`\n🎉 ALL ${tests.length} TESTS PASSED PERFECTLY!`);
} else {
  console.log(`\n❌ ${failed} TESTS FAILED.`);
  process.exit(1);
}
