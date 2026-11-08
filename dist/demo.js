"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runDemo = runDemo;
const smartFallback_1 = require("./services/ai/smartFallback");
const logoStudio_1 = require("./services/image/logoStudio");
const blueprintCache_1 = require("./services/engine/blueprintCache");
const dashboardServer_1 = require("./services/web/dashboardServer");
const child_process_1 = require("child_process");
async function runDemo() {
    console.log('\n================================================================');
    console.log('  🚀 DISCORD AI ARCHITECT - İNTERAKTİF SANDBOX & DEMO MODU');
    console.log('  ⚡ Token veya API Key Olmadan Anında 1-Tıkla Test Deneyimi');
    console.log('================================================================\n');
    console.log('🧠 [1/4] Akıllı AI Motoru ile Profesyonel Sunucu Mimarisi Hesaplanıyor...');
    const blueprint = smartFallback_1.SmartBlueprintGenerator.generate({
        prompt: 'Valorant & Espor Championship Turnuva ve Yayın Topluluğu',
        style: 'gaming',
        locale: 'tr',
    });
    let totalChannels = 0;
    for (const cat of blueprint.categories) {
        totalChannels += cat.channels?.length || 0;
    }
    console.log(`  ✅ Mimari Üretildi: "${blueprint.serverName}"`);
    console.log(`     • ${blueprint.roles.length} Hiyerarşik Rol (Yetkileriyle birlikte)`);
    console.log(`     • ${blueprint.categories.length} Kategori & ${totalChannels} Kanal (Özel izinlerle)`);
    console.log(`     • ${blueprint.automodRules?.length || 0} AutoMod Güvenlik Kuralı`);
    console.log(`     • ${blueprint.richEmbeds?.length || 0} Zengin Bilgi/Kural Embedi`);
    console.log('\n🎨 [2/4] 512x512 Yüksek Çözünürlüklü Vektör AI Sunucu Logosu Üretiliyor...');
    const logoStudio = new logoStudio_1.LogoStudio();
    // Generate logo (uses built-in procedural PNG engine for guaranteed offline instant result)
    const logoResult = await logoStudio.generateIcon(blueprint.iconPrompt || 'Gaming Esports Shield Emblem', true);
    console.log(`  ✅ 512x512 PNG Logo Başarıyla Üretildi! (Boyut: ${Math.round(logoResult.buffer.length / 1024)} KB)`);
    console.log('\n💾 [3/4] Mimari Şablonu ve Görsel Önbelleğe Yükleniyor...');
    const demoId = 'demo';
    blueprintCache_1.BlueprintCache.set({
        id: demoId,
        userId: 'demo-sandbox-user',
        guildId: 'demo-sandbox-guild',
        blueprint,
        cleanSlate: true,
        applyLogo: true,
        createdAt: Date.now(),
        logoBuffer: logoResult.buffer,
        logoDataUri: logoResult.dataUri,
        isDemo: true,
    });
    console.log('\n🌐 [4/4] Web Companion Dashboard Başlatılıyor...');
    const requestedPort = parseInt(process.env.PORT || '3000', 10);
    const dashboard = new dashboardServer_1.DashboardServer(requestedPort);
    const actualPort = await dashboard.start();
    const demoUrl = `http://localhost:${actualPort}/blueprint/${demoId}`;
    console.log('\n================================================================');
    console.log(`🎉 DEMO MODU BAŞARIYLA AKTİF EDİLDİ!`);
    console.log(`🔗 Dashboard Bağlantısı: ${demoUrl}`);
    console.log(`📥 512x512 Logo İndirme : http://localhost:${actualPort}/api/logo/${demoId}?download=1`);
    console.log('================================================================\n');
    // Automatically open browser
    try {
        if (process.platform === 'win32') {
            (0, child_process_1.exec)(`start "" "${demoUrl}"`);
        }
        else if (process.platform === 'darwin') {
            (0, child_process_1.exec)(`open "${demoUrl}"`);
        }
        else {
            (0, child_process_1.exec)(`xdg-open "${demoUrl}"`);
        }
        console.log('🖥️ Web tarayıcınız otomatik olarak açıldı. Kanalları, rolleri ve logoyu inceleyebilirsiniz.');
    }
    catch (err) {
        console.log(`ℹ️ Tarayıcınızı açıp şu adrese gidin: ${demoUrl}`);
    }
    console.log('\n💡 Sandbox sunucusu çalışıyor. Çıkmak için konsolda Ctrl+C tuşlarına basabilirsiniz.\n');
    process.on('SIGINT', async () => {
        console.log('\n🛑 Demo sunucusu kapatılıyor...');
        await dashboard.stop();
        process.exit(0);
    });
}
if (require.main === module) {
    runDemo().catch((err) => {
        console.error('Demo çalıştırma hatası:', err);
        process.exit(1);
    });
}
