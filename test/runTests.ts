import { resolvePermission, resolvePermissionList } from '../src/services/engine/permissionMapper';
import { SmartBlueprintGenerator } from '../src/services/ai/smartFallback';
import { RateLimitQueue, QueueTask } from '../src/services/engine/rateLimitQueue';
import { BlueprintCache } from '../src/services/engine/blueprintCache';
import { DashboardServer } from '../src/services/web/dashboardServer';
import { renderProgressBar, formatProgressStatus } from '../src/services/engine/deployer';
import { LogoStudio } from '../src/services/image/logoStudio';
import { ServerDiagnostics } from '../src/services/engine/diagnostics';
import { validateDiscordToken, validateClientId } from '../src/setup';
import { PermissionFlagsBits, Collection } from 'discord.js';
import http from 'http';

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function assert(condition: boolean, testName: string) {
  totalTests++;
  if (condition) {
    console.log(`  ✅ PASS: ${testName}`);
    passedTests++;
  } else {
    console.error(`  ❌ FAIL: ${testName}`);
    failedTests++;
  }
}

function fetchHttp(url: string): Promise<{ statusCode?: number; headers: http.IncomingHttpHeaders; body: Buffer }> {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      const chunks: Buffer[] = [];
      res.on('data', (chunk) => chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)));
      res.on('end', () => resolve({ statusCode: res.statusCode, headers: res.headers, body: Buffer.concat(chunks) }));
      res.on('error', reject);
    }).on('error', reject);
  });
}

async function runTestSuite() {
  console.log('🧪 ========================================================');
  console.log('🧪 DISCORD AI ARCHITECT & PEAKBOT - INTEGRATION SUITE');
  console.log('🧪 ========================================================\n');

  // 1. Permission Mapper Tests
  console.log('🔹 1. Permission Mapper Testleri:');
  const adminBit = resolvePermission('Administrator');
  assert(adminBit === PermissionFlagsBits.Administrator, 'Administrator permission correctly maps to bitfield');

  const viewChannelBit = resolvePermission('viewchannel');
  assert(viewChannelBit === PermissionFlagsBits.ViewChannel, 'viewchannel case-insensitive mapping works');

  const useAppCommandsBit = resolvePermission('useapplicationcommands');
  assert(useAppCommandsBit === PermissionFlagsBits.UseApplicationCommands, 'useapplicationcommands maps to PermissionFlagsBits');

  const useVadBit = resolvePermission('usevad');
  assert(useVadBit === PermissionFlagsBits.UseVAD, 'usevad maps to PermissionFlagsBits.UseVAD');

  const sendVoiceBit = resolvePermission('sendvoicemessages');
  assert(sendVoiceBit === PermissionFlagsBits.SendVoiceMessages, 'sendvoicemessages maps to PermissionFlagsBits');

  const combined = resolvePermissionList(['ManageGuild', 'KickMembers', 'BanMembers']);
  const expectedCombined = PermissionFlagsBits.ManageGuild | PermissionFlagsBits.KickMembers | PermissionFlagsBits.BanMembers;
  assert(combined === expectedCombined, 'resolvePermissionList correctly calculates bitfield bitwise OR');

  const invalidPerm = resolvePermission('NonExistentPermissionXYZ');
  assert(invalidPerm === null, 'Invalid permission returns null gracefully');

  // 2. Smart Blueprint Generator Tests
  console.log('\n🔹 2. Smart Blueprint Generator Testleri:');
  const gamingBlueprint = SmartBlueprintGenerator.generate({
    prompt: 'Valorant ve Espor takımı için turnuva sunucusu',
    style: 'gaming',
    locale: 'tr',
  });

  assert(typeof gamingBlueprint.serverName === 'string' && gamingBlueprint.serverName.length > 0, 'Gaming serverName is generated');
  assert(gamingBlueprint.roles.length >= 5, 'Gaming blueprint has at least 5 roles in hierarchy');
  assert(gamingBlueprint.categories.length >= 3, 'Gaming blueprint has at least 3 categories');
  
  const hasVoiceLobby = gamingBlueprint.categories.some((cat) =>
    cat.channels.some((ch) => ch.name.includes('Oda Oluştur'))
  );
  assert(hasVoiceLobby, 'Gaming blueprint includes Join-to-Create voice lobby channel');

  const hasRulesEmbed = gamingBlueprint.richEmbeds?.some((emb) => emb.channelName.includes('kurallar'));
  assert(hasRulesEmbed === true, 'Gaming blueprint includes rich rules embed');

  const animeBlueprint = SmartBlueprintGenerator.generate({
    prompt: 'Anime roleplay and manga community',
    style: 'anime',
    locale: 'en',
  });
  assert(animeBlueprint.locale === 'en', 'English locale is correctly set on English preset');
  assert(animeBlueprint.categories.some((c) => c.name.includes('INFORMATION')), 'English categories use uppercase English labels');

  const codingBlueprint = SmartBlueprintGenerator.generate({
    prompt: 'Python ve JavaScript yazılımcı topluluğu bot geliştirme',
    style: 'modern',
    locale: 'tr',
  });
  assert(codingBlueprint.serverName.includes('DevHub') || codingBlueprint.theme.includes('CODING'), 'Coding theme correctly detected from prompt');

  // 3. RateLimitQueue Tests
  console.log('\n🔹 3. RateLimitQueue Testleri:');
  const queue = new RateLimitQueue(10, 3); // fast delay for unit testing
  let counter = 0;
  let t3Attempts = 0;
  const mockTasks: QueueTask<number>[] = [
    { id: 't1', description: 'Task 1', execute: async () => ++counter },
    { id: 't2', description: 'Task 2', execute: async () => ++counter },
    {
      id: 't3',
      description: 'Task 3 with transient retry',
      execute: async () => {
        t3Attempts++;
        if (t3Attempts < 2) {
          throw new Error('Temporary glitch');
        }
        return ++counter;
      },
    },
  ];

  const results = await queue.processAll(mockTasks);
  assert(results.length === 3, 'RateLimitQueue successfully processed all 3 tasks');
  assert(counter === 3, 'Tasks executed sequentially with retry handling');

  // 4. Blueprint Cache Tests
  console.log('\n🔹 4. Blueprint Cache Testleri:');
  BlueprintCache.set({
    id: 'test-id-123',
    userId: 'user-456',
    guildId: 'guild-789',
    blueprint: gamingBlueprint,
    cleanSlate: true,
    applyLogo: true,
    createdAt: Date.now(),
  });

  const cached = BlueprintCache.get('test-id-123');
  assert(cached !== undefined, 'BlueprintCache successfully stores pending build');
  assert(cached?.userId === 'user-456', 'BlueprintCache preserves user id');
  assert(cached?.cleanSlate === true, 'BlueprintCache preserves clean slate flag');

  const allCached = BlueprintCache.getAll();
  assert(allCached.length >= 1, 'BlueprintCache.getAll() returns all active pending builds');

  const latest = BlueprintCache.getLatestByGuild('guild-789');
  assert(latest?.id === 'test-id-123', 'BlueprintCache.getLatestByGuild() returns latest item');

  // 5. PeakBot Web Dashboard Server Tests
  console.log('\n🔹 5. PeakBot Web Dashboard Testleri:');
  const testPort = 3456;
  const dashboard = new DashboardServer(testPort);
  await dashboard.start();

  try {
    const mainPage = await fetchHttp(`http://localhost:${testPort}/`);
    assert(mainPage.statusCode === 200, 'Main dashboard page returns 200 OK');
    const mainBody = mainPage.body.toString('utf-8');
    assert(mainBody.includes('PeakBot'), 'Main dashboard contains PeakBot branding');

    const blueprintPage = await fetchHttp(`http://localhost:${testPort}/blueprint/test-id-123`);
    assert(blueprintPage.statusCode === 200, 'Blueprint view page returns 200 OK');
    const bpBody = blueprintPage.body.toString('utf-8');
    assert(bpBody.includes(gamingBlueprint.serverName), 'Blueprint view renders server name');

    const apiBlueprints = await fetchHttp(`http://localhost:${testPort}/api/blueprints`);
    assert(apiBlueprints.statusCode === 200, 'API /api/blueprints returns 200 OK');
    const parsedApi = JSON.parse(apiBlueprints.body.toString('utf-8'));
    assert(Array.isArray(parsedApi) && parsedApi.length >= 1, 'API returns array of cached blueprints');

    const apiSingle = await fetchHttp(`http://localhost:${testPort}/api/blueprint/test-id-123`);
    assert(apiSingle.statusCode === 200, 'API /api/blueprint/:id returns 200 OK');
    const parsedSingle = JSON.parse(apiSingle.body.toString('utf-8'));
    assert(parsedSingle.serverName === gamingBlueprint.serverName, 'API returns matching blueprint JSON');
  } finally {
    await dashboard.stop();
  }

  const deleted = BlueprintCache.delete('test-id-123');
  assert(deleted === true, 'BlueprintCache successfully deletes item');
  assert(BlueprintCache.get('test-id-123') === undefined, 'Deleted item is no longer in cache');

  // 6. Progress Bar Visual Formatter Tests
  console.log('\n🔹 6. Live Progress Bar Formatter Testleri:');
  const bar0 = renderProgressBar(0, 10);
  assert(bar0 === '[░░░░░░░░░░] 0%', 'Progress bar 0% renders all empty slots');

  const bar40 = renderProgressBar(40, 10);
  assert(bar40 === '[████░░░░░░] 40%', 'Progress bar 40% renders 4 filled and 6 empty slots');

  const bar80 = renderProgressBar(80, 10);
  assert(bar80 === '[████████░░] 80%', 'Progress bar 80% renders 8 filled and 2 empty slots');

  const bar100 = renderProgressBar(100, 10);
  assert(bar100 === '[██████████] 100%', 'Progress bar 100% renders all filled slots');

  const line40 = formatProgressStatus(40, 'Roller inşa ediliyor... (3/7)', 10);
  assert(line40 === '[████░░░░░░] 40% Roller inşa ediliyor... (3/7)', 'formatProgressStatus matches requested 40% format');

  const line80 = formatProgressStatus(80, 'İzinler ve kanallar yapılandırılıyor... (12/15)', 10);
  assert(line80 === '[████████░░] 80% İzinler ve kanallar yapılandırılıyor... (12/15)', 'formatProgressStatus matches requested 80% format');

  const line100 = formatProgressStatus(100, 'Logo yüklendi & AutoMod kuralları aktif edildi!', 10);
  assert(line100 === '[██████████] 100% Logo yüklendi & AutoMod kuralları aktif edildi!', 'formatProgressStatus matches requested 100% format');

  // Edge cases: negative, overflow, NaN
  const barNegative = renderProgressBar(-25, 10);
  assert(barNegative === '[░░░░░░░░░░] 0%', 'Negative percentage clamps gracefully to 0%');

  const barOverflow = renderProgressBar(140, 10);
  assert(barOverflow === '[██████████] 100%', 'Over 100 percentage clamps gracefully to 100%');

  const barNaN = renderProgressBar(NaN as any, 10);
  assert(barNaN === '[░░░░░░░░░░] 0%', 'NaN percentage handled without RangeError or throwing');

  // 7. Pure-Node Procedural 512x512 PNG Engine Tests
  console.log('\n🔹 7. Pure-Node 512x512 Procedural PNG Logo Motoru Testleri:');
  const logoStudio = new LogoStudio();
  const proceduralLogo = logoStudio.generateProceduralLogo('Gaming Valorant Esports');
  assert(Buffer.isBuffer(proceduralLogo.buffer), 'generateProceduralLogo returns valid Node Buffer');
  assert(proceduralLogo.buffer.length > 5000, `Generated PNG buffer has reasonable size (${proceduralLogo.buffer.length} bytes)`);

  // Verify PNG signature (first 8 bytes: 89 50 4E 47 0D 0A 1A 0A)
  const magic = proceduralLogo.buffer.subarray(0, 8).toString('hex');
  assert(magic === '89504e470d0a1a0a', 'PNG signature matches standard PNG specification');

  // Verify IHDR width and height are 512x512
  const width = proceduralLogo.buffer.readUInt32BE(16);
  const height = proceduralLogo.buffer.readUInt32BE(20);
  assert(width === 512 && height === 512, `PNG dimensions are exactly 512x512 (width=${width}, height=${height})`);
  assert(proceduralLogo.dataUri.startsWith('data:image/png;base64,'), 'dataUri has valid base64 data URI format');

  // 8. Resilient Self-Diagnostics Tests
  console.log('\n🔹 8. Self-Diagnostics ve Hata Kurtarma Testleri:');
  // Mock guild with missing permissions
  const mockGuildNoAdmin: any = {
    name: 'Test Gaming Guild',
    id: 'guild-111',
    members: {
      me: {
        permissions: {
          has: (perm: bigint) => perm !== PermissionFlagsBits.Administrator,
        },
        roles: {
          highest: { position: 3, name: 'AI Bot' },
        },
      },
    },
    roles: {
      cache: new Collection<string, any>([
        ['role-1', { id: 'role-1', name: 'Kurucu', position: 10, managed: false }],
        ['role-2', { id: 'role-2', name: 'Yonetici', position: 8, managed: false }],
        ['role-bot', { id: 'role-bot', name: 'AI Bot', position: 3, managed: true }],
      ]),
    },
  };

  const diagResult = ServerDiagnostics.check(mockGuildNoAdmin);
  assert(diagResult.healthy === false, 'Diagnostic flags guild as unhealthy when Administrator is missing and hierarchy is low');
  assert(diagResult.rolesAboveBot.includes('Kurucu'), 'Diagnostic accurately detects unmanaged roles above bot position');
  assert(diagResult.missingPermissions.some((p) => p.includes('Administrator')), 'Diagnostic identifies missing Administrator permission');
  assert(diagResult.troubleshootingEmbed !== undefined, 'Diagnostic builds formatted troubleshooting embed in Turkish');

  // Mock guild with ideal permissions
  const mockGuildHealthy: any = {
    name: 'Perfect Guild',
    id: 'guild-222',
    members: {
      me: {
        permissions: {
          has: () => true, // Full Administrator
        },
        roles: {
          highest: { position: 100, name: 'AI Bot Admin' },
        },
      },
    },
    roles: {
      cache: new Collection<string, any>([
        ['r-bot', { id: 'r-bot', name: 'AI Bot Admin', position: 100, managed: true }],
        ['r-member', { id: 'r-member', name: 'Üye', position: 1, managed: false }],
      ]),
    },
  };

  const healthyResult = ServerDiagnostics.check(mockGuildHealthy);
  assert(healthyResult.healthy === true, 'Diagnostic confirms healthy status for properly configured bot');
  assert(healthyResult.canDeploy === true, 'canDeploy is true for healthy guild');
  assert(healthyResult.issues.length === 0, 'No diagnostic issues found on healthy guild');

  // 9. Interactive Setup Wizard Validator Tests
  console.log('\n🔹 9. Setup Wizard CLI Doğrulama Testleri:');
  const validTokenRes = validateDiscordToken('ValidTestTokenStringForUnitTestingLongEnough12345');
  assert(validTokenRes.valid === true, 'Realistic Discord bot token passes validation');

  const emptyTokenRes = validateDiscordToken('');
  assert(emptyTokenRes.valid === false, 'Empty token is rejected');

  const placeholderTokenRes = validateDiscordToken('BURAYA_BOT_TOKENINI_YAZIN');
  assert(placeholderTokenRes.valid === false, 'Placeholder template token is rejected');

  const exitTokenRes = validateDiscordToken('q');
  assert(exitTokenRes.valid === false && exitTokenRes.isExit === true, 'Exit trigger "q" returns isExit flag');

  const demoTokenRes = validateDiscordToken('demo');
  assert(demoTokenRes.valid === false && demoTokenRes.isDemo === true, 'Demo trigger "demo" returns isDemo flag');

  const validClientId = validateClientId('123456789012345678');
  assert(validClientId.valid === true, '18-digit numeric snowflake client ID passes validation');

  const invalidClientId = validateClientId('abc_invalid_id');
  assert(invalidClientId.valid === false, 'Non-numeric client ID is rejected');

  // 10. Demo Cache & Logo HTTP Serving Tests
  console.log('\n🔹 10. Demo Sandbox & Logo HTTP Servis Testleri:');
  const demoPort = 3556;
  const demoDashboard = new DashboardServer(demoPort);
  await demoDashboard.start();

  try {
    BlueprintCache.set({
      id: 'demo-test',
      userId: 'demo-user',
      guildId: 'demo-guild',
      blueprint: gamingBlueprint,
      cleanSlate: true,
      applyLogo: true,
      createdAt: Date.now(),
      logoBuffer: proceduralLogo.buffer,
      logoDataUri: proceduralLogo.dataUri,
      isDemo: true,
    });

    const logoRes = await fetchHttp(`http://localhost:${demoPort}/api/logo/demo-test`);
    assert(logoRes.statusCode === 200, 'Endpoint /api/logo/:id returns 200 OK');
    assert(logoRes.headers['content-type'] === 'image/png', 'Logo response header is image/png');
    assert(logoRes.body.length === proceduralLogo.buffer.length, 'Logo binary response matches original buffer size');

    const downloadRes = await fetchHttp(`http://localhost:${demoPort}/api/logo/demo-test?download=1`);
    assert(downloadRes.statusCode === 200, 'Endpoint /api/logo/:id?download=1 returns 200 OK');
    assert(Boolean(downloadRes.headers['content-disposition']?.includes('attachment')), 'Download parameter sets attachment header');

    const demoPage = await fetchHttp(`http://localhost:${demoPort}/blueprint/demo-test`);
    assert(demoPage.statusCode === 200, 'Demo blueprint page returns 200 OK');
    const demoHtml = demoPage.body.toString('utf-8');
    assert(demoHtml.includes('SANDBOX DEMO MODU'), 'Demo page includes prominent Sandbox Demo banner');
    assert(demoHtml.includes('/api/logo/demo-test'), 'Demo page references 512x512 logo API endpoint');

    // Test unseeded /blueprint/demo auto-seeding
    BlueprintCache.delete('demo');
    const directDemoPage = await fetchHttp(`http://localhost:${demoPort}/blueprint/demo`);
    assert(directDemoPage.statusCode === 200, 'Direct unseeded /blueprint/demo auto-seeds and returns 200 OK');
    const directDemoHtml = directDemoPage.body.toString('utf-8');
    assert(directDemoHtml.includes('SANDBOX DEMO MODU'), 'Direct demo page contains SANDBOX DEMO banner');
    assert(directDemoHtml.includes('/api/logo/demo'), 'Direct demo references /api/logo/demo');
  } finally {
    await demoDashboard.stop();
    BlueprintCache.delete('demo-test');
    BlueprintCache.delete('demo');
  }

  // 11. Port Fallback ve EADDRINUSE Kurtarma Testleri
  console.log('\n🔹 11. Port Çakışması ve Otomatik Kurtarma Testleri:');
  const occupyPort = 3680;
  const blockerServer = http.createServer((_, res) => {
    res.writeHead(200);
    res.end('occupied');
  });

  await new Promise<void>((resolve) => blockerServer.listen(occupyPort, () => resolve()));

  const fallbackDashboard = new DashboardServer(occupyPort);
  const actualAssignedPort = await fallbackDashboard.start();

  try {
    assert(actualAssignedPort === occupyPort + 1, `DashboardServer automatically fell back to port ${occupyPort + 1} (attempted ${occupyPort})`);
    assert(fallbackDashboard.getPort() === occupyPort + 1, 'fallbackDashboard.getPort() reflects active fallback port');
    assert(DashboardServer.getActivePort() === occupyPort + 1, 'DashboardServer.getActivePort() reflects active fallback port');

    const testFallbackHttp = await fetchHttp(`http://localhost:${actualAssignedPort}/api/blueprints`);
    assert(testFallbackHttp.statusCode === 200, 'Fallback port serves 200 OK on /api/blueprints');
  } finally {
    await fallbackDashboard.stop();
    await new Promise<void>((resolve) => blockerServer.close(() => resolve()));
  }

  // Test Results Summary
  console.log('\n========================================================');
  console.log(`TEST SONUCU: ${passedTests}/${totalTests} BAŞARILI, ${failedTests} BAŞARISIZ`);
  console.log('========================================================');

  if (failedTests > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTestSuite().catch((err) => {
  console.error('Test süreci kritik hata:', err);
  process.exit(1);
});
