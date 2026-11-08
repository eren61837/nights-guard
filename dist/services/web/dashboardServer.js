"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DashboardServer = void 0;
const http_1 = __importDefault(require("http"));
const blueprintCache_1 = require("../engine/blueprintCache");
const logoStudio_1 = require("../image/logoStudio");
const smartFallback_1 = require("../ai/smartFallback");
class DashboardServer {
    static _activePort = 3000;
    server;
    port;
    logoStudio;
    static getActivePort() {
        return DashboardServer._activePort;
    }
    getPort() {
        return this.port;
    }
    constructor(port = 3000) {
        this.port = port;
        this.logoStudio = new logoStudio_1.LogoStudio();
    }
    ensureDemoBlueprint() {
        let cached = blueprintCache_1.BlueprintCache.get('demo');
        if (!cached) {
            const demoBp = smartFallback_1.SmartBlueprintGenerator.generate({
                prompt: 'Valorant & Espor Championship Turnuva ve Yayın Topluluğu',
                style: 'gaming',
                locale: 'tr',
            });
            const logoRes = this.logoStudio.generateProceduralLogo(demoBp.iconPrompt || 'Esports Gaming Logo');
            cached = {
                id: 'demo',
                userId: 'demo-sandbox-user',
                guildId: 'demo-sandbox-guild',
                blueprint: demoBp,
                cleanSlate: true,
                applyLogo: true,
                createdAt: Date.now(),
                logoBuffer: logoRes.buffer,
                logoDataUri: logoRes.dataUri,
                isDemo: true,
            };
            blueprintCache_1.BlueprintCache.set(cached);
        }
        return cached;
    }
    start() {
        return new Promise((resolve, reject) => {
            const tryListen = (attemptPort, remainingAttempts) => {
                const srv = http_1.default.createServer((req, res) => {
                    const parsedUrl = new URL(req.url || '/', `http://localhost:${attemptPort}`);
                    const pathname = parsedUrl.pathname;
                    // 1. API: List active blueprints
                    if (pathname === '/api/blueprints') {
                        res.writeHead(200, { 'Content-Type': 'application/json' });
                        const all = blueprintCache_1.BlueprintCache.getAll ? blueprintCache_1.BlueprintCache.getAll() : [];
                        res.end(JSON.stringify(all));
                        return;
                    }
                    // 2. API: Get blueprint by ID
                    if (pathname.startsWith('/api/blueprint/')) {
                        const id = pathname.split('/')[3];
                        let cached = blueprintCache_1.BlueprintCache.get(id);
                        if (!cached && (id === 'demo' || id === '')) {
                            cached = this.ensureDemoBlueprint();
                        }
                        if (cached) {
                            res.writeHead(200, { 'Content-Type': 'application/json' });
                            res.end(JSON.stringify(cached.blueprint, null, 2));
                        }
                        else {
                            res.writeHead(404, { 'Content-Type': 'application/json' });
                            res.end(JSON.stringify({ error: 'Blueprint not found or expired' }));
                        }
                        return;
                    }
                    // 3. API: Serve Logo PNG (/api/logo/:id)
                    if (pathname.startsWith('/api/logo/')) {
                        const id = pathname.split('/')[3];
                        let cached = blueprintCache_1.BlueprintCache.get(id);
                        if (!cached && (id === 'demo' || id === '')) {
                            cached = this.ensureDemoBlueprint();
                        }
                        let logoBuf = cached?.logoBuffer;
                        if (!logoBuf) {
                            // Generate procedural logo on the fly
                            const result = this.logoStudio.generateProceduralLogo(cached?.blueprint?.serverName || 'Discord AI Server');
                            logoBuf = result.buffer;
                            if (cached) {
                                cached.logoBuffer = logoBuf;
                                cached.logoDataUri = result.dataUri;
                            }
                        }
                        const isDownload = parsedUrl.searchParams.get('download') === '1';
                        const filename = `${(cached?.blueprint?.serverName || 'server').replace(/[^a-zA-Z0-9_-]/g, '_')}_logo.png`;
                        const headers = {
                            'Content-Type': 'image/png',
                            'Content-Length': logoBuf.length,
                            'Cache-Control': 'public, max-age=3600',
                        };
                        if (isDownload) {
                            headers['Content-Disposition'] = `attachment; filename="${filename}"`;
                        }
                        res.writeHead(200, headers);
                        res.end(logoBuf);
                        return;
                    }
                    // 4. HTML: Single Blueprint Viewer (/blueprint/:id)
                    if (pathname.startsWith('/blueprint/')) {
                        const id = pathname.split('/')[2];
                        let cached = blueprintCache_1.BlueprintCache.get(id);
                        if (!cached && (id === 'demo' || id === '')) {
                            cached = this.ensureDemoBlueprint();
                        }
                        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
                        res.end(this.renderHtmlPage(cached ? cached.blueprint : null, id || 'demo', cached));
                        return;
                    }
                    // 5. HTML: Main Dashboard
                    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
                    res.end(this.renderHtmlPage(null));
                });
                srv.on('error', (err) => {
                    if (err.code === 'EADDRINUSE') {
                        if (remainingAttempts > 0) {
                            console.warn(`⚠️ [Web Dashboard] Port ${attemptPort} kullanımda, ${attemptPort + 1} portu deneniyor...`);
                            tryListen(attemptPort + 1, remainingAttempts - 1);
                        }
                        else {
                            console.warn(`⚠️ [Web Dashboard] Belirlenen port aralığındaki tüm portlar kullanımda, web dashboard atlanıyor.`);
                            this.port = attemptPort;
                            DashboardServer._activePort = attemptPort;
                            resolve(attemptPort);
                        }
                    }
                    else {
                        console.error('[Web Dashboard] Sunucu hatası:', err);
                        reject(err);
                    }
                });
                srv.listen(attemptPort, () => {
                    this.server = srv;
                    this.port = attemptPort;
                    DashboardServer._activePort = attemptPort;
                    console.log(`🌐 [Web Dashboard] Nights Guard Studio aktif: http://localhost:${attemptPort}`);
                    resolve(attemptPort);
                });
            };
            tryListen(this.port, 10);
        });
    }
    stop() {
        return new Promise((resolve) => {
            if (this.server) {
                this.server.close(() => resolve());
            }
            else {
                resolve();
            }
        });
    }
    renderHtmlPage(blueprint, blueprintId, pendingBuild) {
        const title = blueprint
            ? `Nights Guard Studio - ${blueprint.serverName}`
            : 'Nights Guard Web Studio • Made by erencix';
        let contentHtml = '';
        if (blueprint && blueprintId) {
            const isDemo = pendingBuild?.isDemo ?? (blueprintId === 'demo' || blueprintId.includes('demo'));
            const roleBadges = blueprint.roles
                .map((r) => `<span class="badge" style="border-left: 4px solid ${r.color || '#5865F2'};">${r.name} <small>(${r.permissions?.length || 0} yetki)</small></span>`)
                .join(' ');
            const categoryBlocks = blueprint.categories
                .map((cat) => {
                const channels = (cat.channels || [])
                    .map((ch) => {
                    const icon = ch.type === 'GUILD_VOICE' ? '🔊' : ch.type === 'GUILD_ANNOUNCEMENT' ? '📢' : '💬';
                    const overwrites = (ch.permissionOverwrites || [])
                        .map((o) => `<span class="perm-tag">${o.roleName}: ${o.allow?.length || 0} izin</span>`)
                        .join(' ');
                    return `<li class="channel-item"><span class="ch-icon">${icon}</span> <strong>${ch.name}</strong> <span class="ch-topic">${ch.topic || ''}</span><div class="overwrites">${overwrites}</div></li>`;
                })
                    .join('');
                return `
            <div class="category-card">
              <div class="category-header">📁 ${cat.name} <span class="count">${cat.channels?.length || 0} kanal</span></div>
              <ul class="channel-list">${channels}</ul>
            </div>
          `;
            })
                .join('');
            let automodHtml = '';
            if (blueprint.automodRules && blueprint.automodRules.length > 0) {
                const rulesList = blueprint.automodRules
                    .map((r) => `<div class="automod-item">🛡️ <strong>${r.name}</strong> <span class="tag">${r.triggerType}</span> ${r.keywordFilter ? `<small>Kelimeler: ${r.keywordFilter.slice(0, 5).join(', ')}</small>` : ''}</div>`)
                    .join('');
                automodHtml = `
          <div class="card">
            <h3>🤖 AutoMod Güvenlik Korumaları (${blueprint.automodRules.length} Kural)</h3>
            <div class="automod-grid">${rulesList}</div>
          </div>
        `;
            }
            contentHtml = `
        ${isDemo
                ? `<div class="demo-banner">🎮 <strong>İNTERAKTİF SANDBOX DEMO MODU:</strong> Discord Token veya API Anahtarı olmadan PeakBot Akıllı Şablon Motoru tarafından anında oluşturuldu. Tüm mimariyi, izinleri ve logoyu canlı inceleyebilirsiniz!</div>`
                : ''}

        <div class="blueprint-view">
          <div class="card header-card">
            <div class="header-main">
              <div class="logo-preview-box">
                <img src="/api/logo/${blueprintId}" alt="Server Logo" class="server-logo-img" />
                <a href="/api/logo/${blueprintId}?download=1" class="btn btn-download">📥 512x512 PNG Logoyu İndir</a>
              </div>
              <div class="header-details">
                <span class="badge-tag">${blueprint.theme.toUpperCase()}</span>
                <h2>🏛️ ${blueprint.serverName}</h2>
                <p class="desc">${blueprint.serverDescription}</p>
                <div class="meta-row">
                  <span class="meta-item">🌐 Dil: <strong>${blueprint.locale?.toUpperCase()}</strong></span>
                  <span class="meta-item">🛡️ Toplam Rol: <strong>${blueprint.roles.length}</strong></span>
                  <span class="meta-item">📁 Kategori: <strong>${blueprint.categories.length}</strong></span>
                  <span class="meta-item">🎫 Ticket: <strong>${blueprint.features?.ticketSystem?.enabled ? 'Aktif' : 'Pasif'}</strong></span>
                  <span class="meta-item">🔊 Ses Lobisi: <strong>${blueprint.features?.joinToCreate?.enabled ? 'Aktif' : 'Pasif'}</strong></span>
                </div>
              </div>
            </div>
          </div>

          <div class="card">
            <h3>🛡️ Rol Hiyerarşisi (${blueprint.roles.length} Rol)</h3>
            <div class="badge-container">${roleBadges}</div>
          </div>

          <div class="card">
            <h3>📁 Kanal Mimarisi ve İzinler (${blueprint.categories.length} Kategori)</h3>
            <div class="categories-grid">${categoryBlocks}</div>
          </div>

          ${automodHtml}

          <div class="card">
            <h3>📋 JSON Şablon Verisi</h3>
            <pre><code>${JSON.stringify(blueprint, null, 2)}</code></pre>
          </div>
        </div>
      `;
        }
        else {
            const allActive = blueprintCache_1.BlueprintCache.getAll();
            let activeBlueprintsHtml = '';
            if (allActive.length > 0) {
                const items = allActive
                    .map((item) => `
          <div class="blueprint-item-row">
            <div class="bp-info">
              <strong>${item.blueprint.serverName}</strong>
              <span>Tema: ${item.blueprint.theme} | ${item.blueprint.roles.length} Rol | ${item.blueprint.categories.length} Kategori</span>
            </div>
            <a href="/blueprint/${item.id}" class="btn btn-primary">İncele ➔</a>
          </div>
        `)
                    .join('');
                activeBlueprintsHtml = `
          <div class="card" style="margin-top: 30px; text-align: left;">
            <h3>📋 Aktif Bellek Şablonları (${allActive.length})</h3>
            <div class="blueprint-list">${items}</div>
          </div>
        `;
            }
            contentHtml = `
        <div class="hero">
          <h1>🛡️ Nights Guard Web Studio</h1>
          <p>Made by erencix • PeakBot Engine Yapay Zeka Destekli Discord Sunucu Mimarisi & Koruma Sistemi</p>
          <div class="stats-grid">
            <div class="stat-box">
              <div class="stat-num">100%</div>
              <div class="stat-lbl">Otomatik İnşaat</div>
            </div>
            <div class="stat-box">
              <div class="stat-num">512x512</div>
              <div class="stat-lbl">PNG Vektör Logo</div>
            </div>
            <div class="stat-box">
              <div class="stat-num">AutoMod</div>
              <div class="stat-lbl">Yerel Güvenlik</div>
            </div>
            <div class="stat-box">
              <div class="stat-num">v1.2.0</div>
              <div class="stat-lbl">Motor Versiyonu</div>
            </div>
          </div>

          <div style="margin-top: 25px;">
            <a href="/blueprint/demo" class="btn btn-large">🎮 Sandbox Demo Mimarisine Git</a>
          </div>

          ${activeBlueprintsHtml}

          <div class="card" style="margin-top: 30px; text-align: left;">
            <h3>⚡ Aktif Slash Komutları</h3>
            <ul>
              <li><code>/ai-kur</code> — Doğal dilde sunucu inşaatı ve onay paneli</li>
              <li><code>/plan</code> — PeakBot mimari planlayıcı ve önizleme stüdyosu</li>
              <li><code>/ai-logo</code> — 512x512 AI sunucu logosu üreticisi</li>
              <li><code>/ai-onizle</code> — Dry-run sunucu şeması ve izin kontrolü</li>
              <li><code>/boost</code> — Sunucu takviye (boost) ödülleri ve karşılama yöneticisi</li>
              <li><code>/teamwork</code> — Yetkili ekibi, ticket sorumluları ve koordinasyon merkezi</li>
              <li><code>/browser</code> — Bu web stüdyosuna hızlı erişim</li>
              <li><code>/sunucu-temizle</code> — Güvenli sunucu sıfırlama (Clean Slate)</li>
            </ul>
          </div>
        </div>
      `;
        }
        return `<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background-color: #0f111a;
      color: #e2e8f0;
      font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, sans-serif;
      line-height: 1.6;
      padding: 30px 20px;
    }
    .container { max-width: 1100px; margin: 0 auto; }
    header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-bottom: 20px;
      border-bottom: 1px solid #1e2235;
      margin-bottom: 24px;
    }
    .logo-area { display: flex; align-items: center; gap: 12px; }
    .logo-icon { font-size: 28px; }
    .logo-title { font-size: 20px; font-weight: 700; color: #5865F2; }
    .nav-links { display: flex; gap: 12px; align-items: center; }
    .nav-links a { color: #94a3b8; text-decoration: none; font-size: 14px; padding: 6px 12px; border-radius: 6px; }
    .nav-links a:hover { background: #1e2235; color: #fff; }
    .badge-status {
      background: #2ecc7122;
      color: #2ecc71;
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 13px;
      border: 1px solid #2ecc7155;
    }
    .demo-banner {
      background: linear-gradient(90deg, #5865F2 0%, #8b5cf6 100%);
      color: #fff;
      padding: 14px 20px;
      border-radius: 10px;
      margin-bottom: 24px;
      font-size: 15px;
      box-shadow: 0 4px 15px rgba(88, 101, 242, 0.4);
    }
    .card {
      background: #181b29;
      border: 1px solid #262a40;
      border-radius: 12px;
      padding: 24px;
      margin-bottom: 24px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.3);
    }
    .header-card { padding: 24px; }
    .header-main { display: flex; gap: 24px; align-items: flex-start; }
    @media (max-width: 768px) {
      .header-main { flex-direction: column; align-items: center; text-align: center; }
      .meta-row { justify-content: center; }
    }
    .logo-preview-box {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 12px;
      min-width: 160px;
    }
    .server-logo-img {
      width: 140px;
      height: 140px;
      border-radius: 24px;
      border: 3px solid #5865F2;
      box-shadow: 0 8px 24px rgba(88, 101, 242, 0.35);
      object-fit: cover;
    }
    .header-details { flex: 1; }
    .badge-tag {
      background: #5865f233;
      color: #5865f2;
      padding: 3px 10px;
      border-radius: 4px;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.5px;
    }
    h1 { font-size: 28px; margin-bottom: 12px; color: #fff; }
    h2 { font-size: 24px; margin: 8px 0; color: #fff; }
    h3 { font-size: 17px; margin-bottom: 16px; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px; }
    .desc { font-size: 15px; color: #94a3b8; margin-bottom: 16px; }
    .meta-row { display: flex; flex-wrap: wrap; gap: 12px; margin-top: 12px; }
    .meta-item { background: #202438; padding: 6px 14px; border-radius: 8px; font-size: 14px; border: 1px solid #2d334d; }
    .badge-container { display: flex; flex-wrap: wrap; gap: 10px; }
    .badge {
      background: #202438;
      padding: 6px 14px;
      border-radius: 8px;
      font-weight: 600;
      font-size: 14px;
      border: 1px solid #2d334d;
    }
    .badge small { color: #94a3b8; font-weight: normal; margin-left: 4px; }
    .categories-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 16px; }
    .category-card { background: #121420; border: 1px solid #262a40; border-radius: 8px; overflow: hidden; }
    .category-header {
      background: #1e2235;
      padding: 10px 16px;
      font-weight: 700;
      font-size: 14px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .category-header .count { font-size: 12px; color: #94a3b8; }
    .channel-list { list-style: none; padding: 10px 16px; }
    .channel-item {
      padding: 8px 0;
      border-bottom: 1px solid #1a1e30;
      font-size: 14px;
    }
    .channel-item:last-child { border-bottom: none; }
    .ch-icon { margin-right: 6px; }
    .ch-topic { font-size: 12px; color: #64748b; margin-left: 8px; display: block; }
    .overwrites { margin-top: 4px; }
    .perm-tag {
      display: inline-block;
      background: #2a2f4a;
      color: #cbd5e1;
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 11px;
      margin-right: 4px;
    }
    .automod-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 12px; }
    .automod-item { background: #121420; padding: 12px 16px; border-radius: 8px; border: 1px solid #262a40; font-size: 14px; }
    .automod-item .tag { background: #eab30822; color: #eab308; font-size: 11px; padding: 2px 6px; border-radius: 4px; font-weight: 600; margin-left: 6px; }
    .automod-item small { display: block; color: #94a3b8; margin-top: 4px; font-size: 12px; }
    pre {
      background: #0d0f17;
      padding: 16px;
      border-radius: 8px;
      overflow-x: auto;
      max-height: 400px;
      font-size: 13px;
      color: #38bdf8;
      border: 1px solid #1e2235;
    }
    .hero { text-align: center; padding: 40px 20px; }
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 16px;
      margin-top: 30px;
    }
    .stat-box {
      background: #181b29;
      border: 1px solid #262a40;
      padding: 20px;
      border-radius: 12px;
      text-align: center;
    }
    .stat-num { font-size: 28px; font-weight: 800; color: #5865F2; margin-bottom: 4px; }
    .stat-lbl { font-size: 13px; color: #94a3b8; }
    .btn {
      display: inline-block;
      padding: 8px 16px;
      border-radius: 8px;
      text-decoration: none;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      border: none;
      transition: all 0.2s;
    }
    .btn-primary { background: #5865F2; color: #fff; }
    .btn-primary:hover { background: #4752c4; }
    .btn-download { background: #2ecc71; color: #fff; font-size: 12px; padding: 6px 12px; border-radius: 6px; }
    .btn-download:hover { background: #27ae60; }
    .btn-large { background: #5865F2; color: #fff; font-size: 16px; padding: 12px 28px; border-radius: 10px; font-weight: 700; box-shadow: 0 4px 15px rgba(88, 101, 242, 0.4); }
    .btn-large:hover { background: #4752c4; }
    .blueprint-list { display: flex; flex-direction: column; gap: 10px; }
    .blueprint-item-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: #121420;
      padding: 14px 18px;
      border-radius: 8px;
      border: 1px solid #262a40;
    }
    .bp-info strong { display: block; font-size: 15px; color: #fff; }
    .bp-info span { font-size: 13px; color: #94a3b8; }
    code { background: #202438; color: #38bdf8; padding: 2px 6px; border-radius: 4px; font-size: 13px; }
    ul { margin-left: 20px; }
    li { margin-bottom: 8px; }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <div class="logo-area">
        <span class="logo-icon">🛡️</span>
        <span class="logo-title">Nights Guard Studio • Made by erencix (PeakBot Engine)</span>
      </div>
      <div class="nav-links">
        <a href="/">Ana Sayfa</a>
        <a href="/blueprint/demo">Demo Mimarisi</a>
        <div class="badge-status">● Sistem Çevrimiçi</div>
      </div>
    </header>
    ${contentHtml}
  </div>
</body>
</html>`;
    }
}
exports.DashboardServer = DashboardServer;
