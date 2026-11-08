"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LogoStudio = void 0;
const axios_1 = __importDefault(require("axios"));
const openai_1 = __importDefault(require("openai"));
const zlib_1 = __importDefault(require("zlib"));
const config_1 = require("../../config");
class LogoStudio {
    openai;
    constructor() {
        if (config_1.config.openaiApiKey) {
            this.openai = new openai_1.default({ apiKey: config_1.config.openaiApiKey });
        }
    }
    async generateIcon(prompt, forceProcedural = false) {
        if (forceProcedural) {
            return this.generateProceduralLogo(prompt);
        }
        const refinedPrompt = `${prompt}, high quality 512x512 app icon, discord server logo, vector emblem, clean centered, vibrant colors, aesthetic graphic design`;
        // 1. Try OpenAI DALL-E 3 if requested and available
        if (config_1.config.imageProvider === 'openai' && this.openai) {
            try {
                const response = await this.openai.images.generate({
                    model: 'dall-e-3',
                    prompt: refinedPrompt,
                    n: 1,
                    size: '1024x1024',
                    response_format: 'b64_json',
                });
                const b64 = response?.data?.[0]?.b64_json;
                if (b64) {
                    const buffer = Buffer.from(b64, 'base64');
                    return {
                        buffer,
                        dataUri: `data:image/png;base64,${b64}`,
                        source: 'openai',
                    };
                }
            }
            catch (err) {
                console.warn('[LogoStudio] OpenAI DALL-E hatası, Pollinations servisine geçiliyor:', err);
            }
        }
        // 2. Default to Pollinations AI (Zero setup, high-res Flux/SDXL)
        try {
            const encoded = encodeURIComponent(refinedPrompt);
            const url = `https://image.pollinations.ai/prompt/${encoded}?width=512&height=512&nologo=true&seed=${Math.floor(Math.random() * 100000)}`;
            const response = await axios_1.default.get(url, {
                responseType: 'arraybuffer',
                timeout: 10000,
                headers: {
                    'User-Agent': 'Discord-AI-Architect/1.0',
                },
            });
            const buffer = Buffer.from(response.data);
            const b64 = buffer.toString('base64');
            return {
                buffer,
                dataUri: `data:image/jpeg;base64,${b64}`,
                source: 'pollinations',
                url,
            };
        }
        catch (err) {
            console.warn('[LogoStudio] Pollinations API ulaşılamadı, akıllı dahili 512x512 PNG oluşturucu devreye giriyor:', err.message);
            return this.generateProceduralLogo(prompt);
        }
    }
    /**
     * Generates a 100% valid, high-aesthetic 512x512 PNG server emblem
     * using pure Node.js and zlib (no external dependencies, zero network required).
     */
    generateProceduralLogo(titleOrTheme = 'Discord Server') {
        const width = 512;
        const height = 512;
        const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
        const makeChunk = (type, data) => {
            const len = Buffer.alloc(4);
            len.writeUInt32BE(data.length, 0);
            const typeBuf = Buffer.from(type, 'ascii');
            const toCrc = Buffer.concat([typeBuf, data]);
            const crc = Buffer.alloc(4);
            crc.writeUInt32BE(zlib_1.default.crc32(toCrc), 0);
            return Buffer.concat([len, typeBuf, data, crc]);
        };
        // IHDR Chunk
        const ihdr = Buffer.alloc(13);
        ihdr.writeUInt32BE(width, 0);
        ihdr.writeUInt32BE(height, 4);
        ihdr[8] = 8; // 8 bit per channel
        ihdr[9] = 6; // RGBA
        ihdr[10] = 0; // Deflate
        ihdr[11] = 0; // Filter none
        ihdr[12] = 0; // Non-interlaced
        const ihdrChunk = makeChunk('IHDR', ihdr);
        // Color palette based on theme keywords
        const lower = titleOrTheme.toLowerCase();
        let themeColor = { r: 88, g: 101, b: 242 }; // Discord Blurple
        let secondaryColor = { r: 59, g: 165, b: 93 }; // Green
        let accentColor = { r: 235, g: 69, b: 158 }; // Fuchsia
        if (lower.includes('oyun') || lower.includes('gaming') || lower.includes('espor') || lower.includes('valorant')) {
            themeColor = { r: 235, g: 45, b: 85 }; // Crimson Red / Coral
            secondaryColor = { r: 15, g: 25, b: 35 }; // Dark Slate
            accentColor = { r: 255, g: 215, b: 0 }; // Gold
        }
        else if (lower.includes('anime') || lower.includes('rp') || lower.includes('manga')) {
            themeColor = { r: 168, g: 85, b: 247 }; // Purple
            secondaryColor = { r: 236, g: 72, b: 153 }; // Pink
            accentColor = { r: 255, g: 255, b: 255 }; // White
        }
        else if (lower.includes('kod') || lower.includes('code') || lower.includes('yazilim') || lower.includes('dev')) {
            themeColor = { r: 14, g: 165, b: 233 }; // Cyan
            secondaryColor = { r: 15, g: 23, b: 42 }; // Midnight Blue
            accentColor = { r: 34, g: 197, b: 94 }; // Emerald Green
        }
        else if (lower.includes('kurumsal') || lower.includes('pro')) {
            themeColor = { r: 59, g: 130, b: 246 }; // Royal Blue
            secondaryColor = { r: 30, g: 41, b: 59 }; // Slate
            accentColor = { r: 245, g: 158, b: 11 }; // Amber Gold
        }
        const rowSize = 1 + width * 4;
        const rawData = Buffer.alloc(rowSize * height);
        const centerX = 256;
        const centerY = 256;
        const maxRadius = 240;
        for (let y = 0; y < height; y++) {
            const rowOffset = y * rowSize;
            rawData[rowOffset] = 0; // Filter 0: None
            for (let x = 0; x < width; x++) {
                const pxOffset = rowOffset + 1 + x * 4;
                const dx = x - centerX;
                const dy = y - centerY;
                const dist = Math.sqrt(dx * dx + dy * dy);
                let r = 18;
                let g = 20;
                let b = 30;
                let a = 255;
                // Background Radial Gradient
                const radialRatio = Math.min(1, dist / 360);
                r = Math.floor(themeColor.r * 0.15 * (1 - radialRatio) + secondaryColor.r * radialRatio);
                g = Math.floor(themeColor.g * 0.15 * (1 - radialRatio) + secondaryColor.g * radialRatio);
                b = Math.floor(themeColor.b * 0.25 * (1 - radialRatio) + secondaryColor.b * radialRatio);
                // Circular Outer Shield
                if (dist <= maxRadius) {
                    // Circular Border Ring
                    if (dist >= maxRadius - 12) {
                        r = accentColor.r;
                        g = accentColor.g;
                        b = accentColor.b;
                    }
                    else if (dist >= maxRadius - 20) {
                        r = themeColor.r;
                        g = themeColor.g;
                        b = themeColor.b;
                    }
                    else {
                        // Inside Shield - Gradient fill
                        const innerGrad = (y / height);
                        r = Math.floor(themeColor.r * (1 - innerGrad * 0.5));
                        g = Math.floor(themeColor.g * (1 - innerGrad * 0.5));
                        b = Math.floor(themeColor.b * (1 - innerGrad * 0.4));
                        // Central Emblem: Geometric Diamond / Crest
                        const absDx = Math.abs(dx);
                        const absDy = Math.abs(dy);
                        const diamondDist = absDx + absDy;
                        if (diamondDist < 120) {
                            if (diamondDist < 30 || (diamondDist >= 80 && diamondDist <= 110)) {
                                // Bright Emblem Outline & Core
                                r = accentColor.r;
                                g = accentColor.g;
                                b = accentColor.b;
                            }
                            else {
                                // Inner Emblem Shade
                                r = 255;
                                g = 255;
                                b = 255;
                            }
                        }
                        // Sleek Light Reflection Arc across top half
                        if (dy < -20 && Math.abs(dx) < 180 && dist > 140 && dist < 210) {
                            r = Math.min(255, r + 45);
                            g = Math.min(255, g + 45);
                            b = Math.min(255, b + 60);
                        }
                    }
                }
                rawData[pxOffset] = r;
                rawData[pxOffset + 1] = g;
                rawData[pxOffset + 2] = b;
                rawData[pxOffset + 3] = a;
            }
        }
        const compressed = zlib_1.default.deflateSync(rawData, { level: 6 });
        const idatChunk = makeChunk('IDAT', compressed);
        const iendChunk = makeChunk('IEND', Buffer.alloc(0));
        const buffer = Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
        const b64 = buffer.toString('base64');
        return {
            buffer,
            dataUri: `data:image/png;base64,${b64}`,
            source: 'procedural',
        };
    }
    async applyIconToGuild(guild, imageBuffer) {
        const me = guild.members.me;
        if (!me?.permissions.has('ManageGuild')) {
            throw new Error("Bot 'Sunucuyu Yönet' (ManageGuild) yetkisine sahip değil!");
        }
        await guild.setIcon(imageBuffer, 'AI Architect: Otomatik logo güncellemesi');
    }
}
exports.LogoStudio = LogoStudio;
