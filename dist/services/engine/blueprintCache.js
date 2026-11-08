"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BlueprintCache = void 0;
class BlueprintCache {
    static cache = new Map();
    static set(pending) {
        this.cache.set(pending.id, pending);
        // Auto-expire after 15 minutes
        const timer = setTimeout(() => {
            this.cache.delete(pending.id);
        }, 15 * 60 * 1000);
        if (timer && typeof timer.unref === 'function') {
            timer.unref();
        }
    }
    static get(id) {
        return this.cache.get(id);
    }
    static getAll() {
        return Array.from(this.cache.values());
    }
    static getLatestByGuild(guildId) {
        let latest;
        for (const item of this.cache.values()) {
            if (item.guildId === guildId) {
                if (!latest || item.createdAt > latest.createdAt) {
                    latest = item;
                }
            }
        }
        return latest;
    }
    static delete(id) {
        return this.cache.delete(id);
    }
}
exports.BlueprintCache = BlueprintCache;
