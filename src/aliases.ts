import { Pool } from "pg";
import { CONFIG } from "./config";

// 곡명 → 별명 목록 (NeonDB의 SongAlias 테이블에서 로드)
let aliasMap: Map<string, string[]> = new Map();

let pool: Pool | null = null;
function getPool(): Pool | null {
  if (!CONFIG.databaseUrl) return null;
  if (!pool) pool = new Pool({ connectionString: CONFIG.databaseUrl, max: 2 });
  return pool;
}

// 공백 제거 + 소문자 정규화 (mailog 검색과 동일한 매칭 규칙)
export function normalizeQuery(s: string): string {
  return s.toLowerCase().replace(/\s+/g, "");
}

export async function loadAliases(): Promise<void> {
  const p = getPool();
  if (!p) {
    console.log("[aliases] databaseUrl 미설정 — 별명 검색 비활성화");
    return;
  }
  try {
    const { rows } = await p.query<{ title: string; alias: string }>(
      'SELECT title, alias FROM "SongAlias"',
    );
    const map = new Map<string, string[]>();
    for (const { title, alias } of rows) {
      const list = map.get(title) ?? [];
      list.push(alias);
      map.set(title, list);
    }
    aliasMap = map;
    console.log(`[aliases] 별명 ${rows.length}개 (곡 ${map.size}개) 로드`);
  } catch (e) {
    console.error("[aliases] 로드 실패:", e);
  }
}

// 해당 곡명의 별명이 정규화된 질의 q를 포함하는지
export function aliasMatches(title: string, q: string): boolean {
  const aliases = aliasMap.get(title);
  if (!aliases) return false;
  return aliases.some((a) => normalizeQuery(a).includes(q));
}
