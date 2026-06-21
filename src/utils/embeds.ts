import { EmbedBuilder, AttachmentBuilder } from "discord.js";
import { getCachedProfile, getAvatarBlob } from "../db";
import { getBaseUrl } from "../web";
import { ratingColor } from "./roles";

export function sep(label: string, totalW = 36): string {
  const frame = Math.max(0, totalW - label.length - 2);
  const left = "─".repeat(Math.floor(frame / 2));
  const right = "─".repeat(Math.ceil(frame / 2));
  return left + " " + label + " " + right;
}

export function buildAvatarAttachment(userId: string): AttachmentBuilder | null {
  const buf = getAvatarBlob(userId);
  if (!buf) return null;
  return new AttachmentBuilder(buf, { name: "avatar.png" });
}

export function profileEmb(
  p: NonNullable<ReturnType<typeof getCachedProfile>>,
  hasAvatar: boolean,
) {
  const stars = p.stars && p.stars !== "0" ? " · ★×" + p.stars : "";
  const emb = new EmbedBuilder()
    .setColor(ratingColor(p.rating))
    .setAuthor({ name: sep("Profile") })
    .setTitle(p.trophy || "칭호 없음")
    .setDescription(
      `**${p.playerName || "이름 없음"}**  ·  **${p.rating || 0}**\n` +
      `플레이 ${p.playCount || 0}회${stars}`,
    )
    .setFooter({ text: `마지막 동기화: ${new Date(p.lastSyncedAt).toLocaleString("ko-KR")}` });
  if (hasAvatar) emb.setThumbnail("attachment://avatar.png");
  return emb;
}

export function getSongList(p: NonNullable<ReturnType<typeof getCachedProfile>>): any[] {
  const raw = JSON.parse(p.recentJson || "{}");
  return Array.isArray(raw) ? raw : (raw.recent || []);
}

export function songEmbeds(
  p: NonNullable<ReturnType<typeof getCachedProfile>>,
  userId: string,
  port: number,
): EmbedBuilder[] {
  const records = getSongList(p);
  const server = getBaseUrl(port);
  if (records.length === 0) {
    return [new EmbedBuilder().setColor(0x2b2d31).setDescription("기록 없음")];
  }
  const pageSize = records[0]?.track || 3;
  return records.slice(0, pageSize).map((r: any, i: number) => {
    const kind = r.musicKind ? ` [${r.musicKind}]` : "";
    return new EmbedBuilder()
      .setColor(0x2b2d31)
      .setAuthor({ name: sep("#" + (i + 1), 34) })
      .setTitle(r.title + kind)
      .setDescription(`\`${r.diff} ${r.level}\``)
      .addFields(
        { name: "달성률", value: r.achievement, inline: true },
        { name: "플레이일", value: r.date || "-", inline: true },
      )
      .setThumbnail(`${server}/jacket?user=${userId}&idx=${i}`);
  });
}

export function buildProfileReply(
  cached: NonNullable<ReturnType<typeof getCachedProfile>>,
  userId: string,
  port: number,
) {
  const avatar = buildAvatarAttachment(userId);
  return {
    embeds: [profileEmb(cached, !!avatar), ...songEmbeds(cached, userId, port)],
    files: avatar ? [avatar] : [],
  };
}
