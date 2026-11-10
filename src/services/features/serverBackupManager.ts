import {
  Guild,
  Role,
  ChannelType,
  OverwriteType,
  EmbedBuilder,
  TextChannel,
  User,
  GuildMember,
  PermissionsBitField,
} from 'discord.js';
import fs from 'fs';
import path from 'path';
import { PersistentStore } from '../storage/persistentStore';

export interface SavedOverwrite {
  id: string;
  type: number; // 0: Role, 1: Member
  allow: string;
  deny: string;
}

export interface SavedRole {
  id: string;
  name: string;
  color: number;
  hoist: boolean;
  position: number;
  permissions: string;
  mentionable: boolean;
  managed: boolean;
  isEveryone: boolean;
  members: string[]; // member IDs who hold this role
}

export interface SavedCategory {
  id: string;
  name: string;
  position: number;
  overwrites: SavedOverwrite[];
}

export interface SavedChannel {
  id: string;
  name: string;
  type: number;
  parentId: string | null;
  position: number;
  topic: string | null;
  nsfw: boolean;
  rateLimitPerUser: number;
  bitrate?: number;
  userLimit?: number;
  overwrites: SavedOverwrite[];
}

export interface ServerBackupData {
  version: number;
  backupId: string;
  createdAt: number;
  createdIso: string;
  createdBy: {
    id: string;
    tag: string;
  };
  guild: {
    id: string;
    name: string;
    description: string | null;
    iconURL: string | null;
    bannerURL: string | null;
    verificationLevel: number;
    afkTimeout: number;
    explicitContentFilter: number;
    defaultMessageNotifications: number;
  };
  stats: {
    rolesCount: number;
    categoriesCount: number;
    channelsCount: number;
    membersSavedCount: number;
  };
  roles: SavedRole[];
  categories: SavedCategory[];
  channels: SavedChannel[];
}

export class ServerBackupManager {
  private static backupsDir = path.resolve(process.cwd(), 'data/backups');
  private static OWNER_ID = '1138498666785677492';

  public static isAuthorized(userId: string, guild?: Guild | null): boolean {
    if (userId === this.OWNER_ID) return true;
    if (guild && guild.ownerId === userId) return true;
    return false;
  }

  private static ensureDirs(): void {
    if (!fs.existsSync(this.backupsDir)) {
      fs.mkdirSync(this.backupsDir, { recursive: true });
    }
  }

  /**
   * Sunucunun A'dan Z'ye Her Şeyini Yedekler:
   * Roller (yetkiler, renkler, üyeler), Kategoriler, Kanallar (yetki izinleri), Sunucu Bilgileri
   */
  public static async createBackup(
    guild: Guild,
    executor: User
  ): Promise<{ success: boolean; data?: ServerBackupData; error?: string }> {
    if (!this.isAuthorized(executor.id, guild)) {
      return {
        success: false,
        error: `⛔ **Erişim Engellendi:** Sunucu yedeği alma yetkisi yalnızca <@${this.OWNER_ID}> (erencix) ve sunucu kurucusuna aittir!`,
      };
    }

    try {
      this.ensureDirs();
      console.log(`[ServerBackup] 📦 ${guild.name} için tam sunucu yedeği alma işlemi başlatıldı (Yetkili: ${executor.tag})...`);

      // 1. Üyeleri, Rolleri ve Kanalları Eksiksiz Çek
      await guild.members.fetch();
      const rolesCollection = await guild.roles.fetch();
      const channelsCollection = await guild.channels.fetch();

      const timestamp = Date.now();
      const backupId = `backup_${timestamp}`;

      // 2. Rolleri Serialize Et
      const savedRoles: SavedRole[] = [];
      for (const [_, role] of rolesCollection) {
        if (!role) continue;
        savedRoles.push({
          id: role.id,
          name: role.name,
          color: role.color,
          hoist: role.hoist,
          position: role.position,
          permissions: role.permissions.bitfield.toString(),
          mentionable: role.mentionable,
          managed: role.managed,
          isEveryone: role.id === guild.id,
          members: Array.from(role.members.keys()),
        });
      }

      // Rolleri pozisyona göre sırala (Düşükten yükseğe)
      savedRoles.sort((a, b) => a.position - b.position);

      // 3. Kategorileri Serialize Et
      const savedCategories: SavedCategory[] = [];
      const savedChannels: SavedChannel[] = [];

      for (const [_, channel] of channelsCollection) {
        if (!channel) continue;

        const overwrites: SavedOverwrite[] = channel.permissionOverwrites.cache.map((ow) => ({
          id: ow.id,
          type: ow.type,
          allow: ow.allow.bitfield.toString(),
          deny: ow.deny.bitfield.toString(),
        }));

        if (channel.type === ChannelType.GuildCategory) {
          savedCategories.push({
            id: channel.id,
            name: channel.name,
            position: channel.position,
            overwrites,
          });
        } else {
          const chAny = channel as any;
          savedChannels.push({
            id: channel.id,
            name: channel.name,
            type: channel.type,
            parentId: channel.parentId,
            position: channel.position,
            topic: chAny.topic || null,
            nsfw: Boolean(chAny.nsfw),
            rateLimitPerUser: chAny.rateLimitPerUser || 0,
            bitrate: chAny.bitrate,
            userLimit: chAny.userLimit,
            overwrites,
          });
        }
      }

      // Kategorileri ve Kanalları pozisyona göre sırala
      savedCategories.sort((a, b) => a.position - b.position);
      savedChannels.sort((a, b) => a.position - b.position);

      const backupData: ServerBackupData = {
        version: 2,
        backupId,
        createdAt: timestamp,
        createdIso: new Date(timestamp).toISOString(),
        createdBy: {
          id: executor.id,
          tag: executor.tag,
        },
        guild: {
          id: guild.id,
          name: guild.name,
          description: guild.description,
          iconURL: guild.iconURL({ size: 1024 }),
          bannerURL: guild.bannerURL({ size: 1024 }),
          verificationLevel: guild.verificationLevel,
          afkTimeout: guild.afkTimeout,
          explicitContentFilter: guild.explicitContentFilter,
          defaultMessageNotifications: guild.defaultMessageNotifications,
        },
        stats: {
          rolesCount: savedRoles.length,
          categoriesCount: savedCategories.length,
          channelsCount: savedChannels.length,
          membersSavedCount: guild.memberCount,
        },
        roles: savedRoles,
        categories: savedCategories,
        channels: savedChannels,
      };

      // 4. Dosyalara Güvenli Yaz (Hem en son 'backup_latest.json' hem de zaman damgalı arşiv)
      PersistentStore.atomicSaveJson('backups/backup_latest.json', backupData);
      PersistentStore.atomicSaveJson(`backups/${backupId}.json`, backupData);

      console.log(`[ServerBackup] ✅ Sunucu yedeği başarıyla tamamlandı! Roller: ${savedRoles.length}, Kanallar: ${savedChannels.length}`);
      return { success: true, data: backupData };
    } catch (err: any) {
      console.error('[ServerBackup] Yedek alma hatası:', err);
      return { success: false, error: err.message };
    }
  }

  /**
   * En Son Alınan veya Belirtilen Yedeği Oku
   */
  public static getLatestBackup(): ServerBackupData | null {
    this.ensureDirs();
    const latestPath = path.resolve(this.backupsDir, 'backup_latest.json');
    if (!fs.existsSync(latestPath)) {
      // Arşivdeki en yeni dosyayı ara
      try {
        const files = fs.readdirSync(this.backupsDir).filter((f) => f.startsWith('backup_') && f.endsWith('.json'));
        if (files.length === 0) return null;
        files.sort().reverse();
        const newest = path.resolve(this.backupsDir, files[0]);
        const content = fs.readFileSync(newest, 'utf-8');
        return JSON.parse(content) as ServerBackupData;
      } catch {
        return null;
      }
    }

    try {
      const content = fs.readFileSync(latestPath, 'utf-8');
      return JSON.parse(content) as ServerBackupData;
    } catch (err: any) {
      console.error('[ServerBackup] Yedek okunamadı:', err.message);
      return null;
    }
  }

  /**
   * /yedekgetir: Alınan Yedeği Sunucuya Eksiksiz Geri Yükler
   * Eski hali birebir inşa eder.
   */
  public static async restoreBackup(
    guild: Guild,
    executor: User,
    onProgress?: (status: string) => Promise<void>
  ): Promise<{ success: boolean; restoredStats?: any; error?: string }> {
    if (!this.isAuthorized(executor.id, guild)) {
      return {
        success: false,
        error: `⛔ **Erişim Engellendi:** Sunucu yedeği geri yükleme işlemi son derece kritik bir işlemdir! Yalnızca <@${this.OWNER_ID}> (erencix) tarafından çalıştırılabilir.`,
      };
    }

    const backup = this.getLatestBackup();
    if (!backup) {
      return {
        success: false,
        error: '⚠️ Sunucuya ait kayıtlı bir yedek bulunamadı! Lütfen önce `/yedek-al` komutunu kullanarak tam bir yedek oluşturun.',
      };
    }

    console.log(`[ServerBackup] 🔄 YEDEK GERİ YÜKLEME BAŞLADI: ${guild.name} (${backup.backupId}) - İsteyen: ${executor.tag}`);

    try {
      if (onProgress) await onProgress('⚙️ **Adım 1/5:** Sunucu verileri ve mevcut roller taranıyor...');

      // Haritalar: Eski ID -> Yeni ID
      const roleIdMap = new Map<string, string>();
      const categoryIdMap = new Map<string, string>();

      // @everyone rolünü eşle
      roleIdMap.set(backup.guild.id, guild.id);
      roleIdMap.set(guild.roles.everyone.id, guild.roles.everyone.id);

      // Botun en yüksek rol pozisyonunu al
      const botMember = guild.members.me || (await guild.members.fetch(guild.client.user.id));
      const botHighestPosition = botMember.roles.highest.position;

      // 1. ROLLERİ GERİ YÜKLE / SENKRONİZE ET
      if (onProgress) await onProgress(`🎭 **Adım 2/5:** **${backup.roles.length}** adet rol yapılandırılıyor ve yetkileri kuruluyor...`);

      const currentRoles = await guild.roles.fetch();

      for (const savedRole of backup.roles) {
        try {
          if (savedRole.isEveryone) {
            // @everyone izinlerini güncelle
            await guild.roles.everyone
              .setPermissions(BigInt(savedRole.permissions))
              .catch(() => {});
            roleIdMap.set(savedRole.id, guild.roles.everyone.id);
            continue;
          }

          if (savedRole.managed) {
            // Bot/entegrasyon rollerini Discord API ile doğrudan oluşturamayız, mevcut olanla eşle
            const matchManaged = currentRoles.find((r) => r.managed && r.name === savedRole.name);
            if (matchManaged) {
              roleIdMap.set(savedRole.id, matchManaged.id);
            }
            continue;
          }

          // İsmi eşleşen mevcut rol var mı?
          let targetRole = currentRoles.find((r) => !r.managed && r.name.toLowerCase() === savedRole.name.toLowerCase());

          if (targetRole) {
            // Mevcut rolün ayarlarını güncelle
            if (targetRole.position < botHighestPosition) {
              await targetRole
                .edit({
                  color: savedRole.color,
                  hoist: savedRole.hoist,
                  permissions: BigInt(savedRole.permissions),
                  mentionable: savedRole.mentionable,
                })
                .catch(() => {});
            }
            roleIdMap.set(savedRole.id, targetRole.id);
          } else {
            // Yeni rol oluştur
            const newRole = await guild.roles.create({
              name: savedRole.name,
              color: savedRole.color,
              hoist: savedRole.hoist,
              permissions: BigInt(savedRole.permissions),
              mentionable: savedRole.mentionable,
              reason: 'Nights Guard: /yedekgetir sunucu kurtarma',
            });
            roleIdMap.set(savedRole.id, newRole.id);
            await new Promise((r) => setTimeout(r, 200)); // Rate-limit koruması
          }
        } catch (rErr: any) {
          console.warn(`[ServerBackup] Rol kurtarma uyarısı (${savedRole.name}):`, rErr.message);
        }
      }

      // 2. KATEGORİLERİ GERİ YÜKLE
      if (onProgress) await onProgress(`📁 **Adım 3/5:** **${backup.categories.length}** adet kategori ve özel izinleri inşa ediliyor...`);

      const currentChannels = await guild.channels.fetch();

      for (const savedCat of backup.categories) {
        try {
          // İzinleri yeni rol ID'lerine haritala
          const mappedOverwrites = savedCat.overwrites
            .map((ow) => {
              const mappedId = ow.type === OverwriteType.Role ? roleIdMap.get(ow.id) || ow.id : ow.id;
              return {
                id: mappedId,
                type: ow.type,
                allow: BigInt(ow.allow),
                deny: BigInt(ow.deny),
              };
            })
            .filter((ow) => guild.roles.cache.has(ow.id) || guild.members.cache.has(ow.id) || ow.id === guild.id);

          // Mevcut kategori var mı?
          let existingCat = currentChannels.find(
            (c) => c && c.type === ChannelType.GuildCategory && c.name.toLowerCase() === savedCat.name.toLowerCase()
          );

          if (existingCat) {
            await existingCat
              .edit({
                position: savedCat.position,
                permissionOverwrites: mappedOverwrites,
              })
              .catch(() => {});
            categoryIdMap.set(savedCat.id, existingCat.id);
          } else {
            const newCat = await guild.channels.create({
              name: savedCat.name,
              type: ChannelType.GuildCategory,
              position: savedCat.position,
              permissionOverwrites: mappedOverwrites,
              reason: 'Nights Guard: /yedekgetir kategori kurtarma',
            });
            categoryIdMap.set(savedCat.id, newCat.id);
            await new Promise((r) => setTimeout(r, 250));
          }
        } catch (cErr: any) {
          console.warn(`[ServerBackup] Kategori kurtarma uyarısı (${savedCat.name}):`, cErr.message);
        }
      }

      // 3. KANALLARI (METİN, SES, DUYURU, FORUM) GERİ YÜKLE
      if (onProgress) await onProgress(`🎙️ **Adım 4/5:** **${backup.channels.length}** adet ses ve metin kanalı kuruluyor...`);

      for (const savedCh of backup.channels) {
        try {
          const mappedOverwrites = savedCh.overwrites
            .map((ow) => {
              const mappedId = ow.type === OverwriteType.Role ? roleIdMap.get(ow.id) || ow.id : ow.id;
              return {
                id: mappedId,
                type: ow.type,
                allow: BigInt(ow.allow),
                deny: BigInt(ow.deny),
              };
            })
            .filter((ow) => guild.roles.cache.has(ow.id) || guild.members.cache.has(ow.id) || ow.id === guild.id);

          const parentId = savedCh.parentId ? categoryIdMap.get(savedCh.parentId) || undefined : undefined;

          // Mevcut kanal kontrolü
          let existingCh = currentChannels.find(
            (c) => c && c.name.toLowerCase() === savedCh.name.toLowerCase() && c.type === savedCh.type
          );

          if (existingCh) {
            await existingCh
              .edit({
                parent: parentId,
                position: savedCh.position,
                topic: savedCh.topic || undefined,
                nsfw: savedCh.nsfw,
                bitrate: savedCh.bitrate,
                userLimit: savedCh.userLimit,
                rateLimitPerUser: savedCh.rateLimitPerUser,
                permissionOverwrites: mappedOverwrites,
              })
              .catch(() => {});
          } else {
            await guild.channels.create({
              name: savedCh.name,
              type: savedCh.type as any,
              parent: parentId,
              position: savedCh.position,
              topic: savedCh.topic || undefined,
              nsfw: savedCh.nsfw,
              bitrate: savedCh.bitrate,
              userLimit: savedCh.userLimit,
              rateLimitPerUser: savedCh.rateLimitPerUser,
              permissionOverwrites: mappedOverwrites,
              reason: 'Nights Guard: /yedekgetir kanal kurtarma',
            });
            await new Promise((r) => setTimeout(r, 250));
          }
        } catch (chErr: any) {
          console.warn(`[ServerBackup] Kanal kurtarma uyarısı (${savedCh.name}):`, chErr.message);
        }
      }

      // 4. ÜYELERİN ELLERİNDEKİ ROLLERİ GERİ VER (MEMBER ROLE RE-ASSIGNMENT)
      if (onProgress) await onProgress('👥 **Adım 5/5:** Üyelerin eski rolleri taranıyor ve geri tanımlanıyor...');

      const allMembers = await guild.members.fetch();
      let rolesGivenCount = 0;

      for (const savedRole of backup.roles) {
        if (savedRole.isEveryone || savedRole.managed) continue;
        const currentRoleId = roleIdMap.get(savedRole.id);
        if (!currentRoleId) continue;

        const currentRole = guild.roles.cache.get(currentRoleId);
        if (!currentRole || currentRole.position >= botHighestPosition) continue;

        for (const memberId of savedRole.members) {
          const member = allMembers.get(memberId);
          if (member && !member.roles.cache.has(currentRoleId)) {
            try {
              await member.roles.add(currentRoleId, 'Nights Guard: Yedekten roller geri yüklendi');
              rolesGivenCount++;
            } catch {}
          }
        }
      }

      console.log(`[ServerBackup] 🎉 YEDEKLEME TAMAMEN GERİ YÜKLENDİ! Geri verilen rol sayısı: ${rolesGivenCount}`);

      return {
        success: true,
        restoredStats: {
          roles: backup.roles.length,
          categories: backup.categories.length,
          channels: backup.channels.length,
          rolesGiven: rolesGivenCount,
          backupCreatedIso: backup.createdIso,
          backupId: backup.backupId,
        },
      };
    } catch (err: any) {
      console.error('[ServerBackup] Geri yükleme genel hatası:', err);
      return { success: false, error: err.message };
    }
  }
}
