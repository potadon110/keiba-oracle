/**
 * fetch-races.js
 * 毎朝自動実行: JRAレース情報をAIで取得 → Supabaseに保存
 */

const ANTHROPIC_API_KEY  = process.env.ANTHROPIC_API_KEY;
const SUPABASE_URL        = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

// 今日の日付
function todayISO() {
  const d = new Date();
  // 日本時間に変換（UTC+9）
  const jst = new Date(d.getTime() + 9 * 60 * 60 * 1000);
  return jst.toISOString().slice(0, 10);
}

function todayJP() {
  const d = new Date();
  const jst = new Date(d.getTime() + 9 * 60 * 60 * 1000);
  const days = ["日","月","火","水","木","金","土"];
  return `${jst.getFullYear()}年${jst.getMonth()+1}月${jst.getDate()}日（${days[jst.getDay()]}）`;
}

// ── Supabase操作 ──────────────────────────────────────────────
async function supabaseFetch(path, options = {}) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    headers: {
      apikey:         SUPABASE_SERVICE_KEY,
      Authorization:  `Bearer ${SUPABASE_SERVICE_KEY}`,
      "Content-Type": "application/json",
      Prefer:         options.prefer || "",
    },
    ...options,
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`Supabase Error: ${res.status} ${text}`);
  if (!text) return null;
  return JSON.parse(text);
}

// 今日のレースを削除
async function deleteTodayRaces() {
  const today = todayISO();
  console.log(`🗑️  ${today} のレースデータを削除中...`);
  await supabaseFetch(`races?race_date=eq.${today}`, { method: "DELETE" });
  console.log("✅ 削除完了");
}

// レースを挿入
async function insertRaces(races) {
  const result = await supabaseFetch("races", {
    method: "POST",
    prefer: "return=representation",
    body: JSON.stringify(races),
  });
  return result;
}

// 出走馬を挿入
async function insertHorses(horses) {
  if (horses.length === 0) return;
  await supabaseFetch("horses", {
    method: "POST",
    prefer: "return=representation",
    body: JSON.stringify(horses),
  });
}

// ── Anthropic API でJRA情報を取得 ────────────────────────────
async function fetchRacesFromAI() {
  const today = todayJP();
  console.log(`🤖 AIがJRA開催情報を検索中... (${today})`);

  const prompt = `今日（${today}）のJRA中央競馬と地方競馬の開催情報をWeb検索で調べてください。
以下のJSON形式のみで返答してください。前置き・説明・コードブロックは不要です。

{
  "date": "${todayISO()}",
  "races": [
    {
      "race_type": "centralまたはlocal",
      "venue": "競馬場名（例:函館、大井）",
      "race_number": レース番号の数値,
      "name": "レース名",
      "start_time": "HH:MM形式",
      "grade": "G1またはG2またはG3またはOPまたは一般",
      "distance": "例:芝1200mまたはダ2000m",
      "condition": "良または稍重または重または不良"
    }
  ]
}

ルール:
- 中央競馬はrace_type: "central"、地方競馬はrace_type: "local"
- 重賞レース（G1/G2/G3）を優先して含めてください
- 各開催場のメインレース（11R等）を必ず含めてください
- 開催がない場合はracesを空配列
- JSONのみ出力`;

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 3000,
      tools: [{ type: "web_search_20250305", name: "web_search" }],
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Anthropic API Error: ${res.status} ${err}`);
  }

  const data = await res.json();
  const text = (data.content || [])
    .filter(b => b.type === "text")
    .map(b => b.text)
    .join("");

  // JSONを抽出
  const cleaned = text.replace(/```json\s*/gi, "").replace(/```/g, "").trim();
  const m = cleaned.match(/\{[\s\S]*\}/);
  if (!m) throw new Error("JSONが見つかりませんでした");

  const parsed = JSON.parse(m[0]);
  if (!Array.isArray(parsed.races)) throw new Error("レースデータが不正です");

  return parsed;
}

// ── 出走馬情報を取得 ──────────────────────────────────────────
async function fetchHorsesFromAI(race) {
  console.log(`🐴 ${race.venue} ${race.name} の出走馬を検索中...`);

  const prompt = `${race.name}（${race.venue}競馬場 ${race.race_number}R）の出走馬情報をWeb検索で調べてください。
以下のJSON形式のみで返答してください。

{
  "horses": [
    {
      "horse_number": 馬番の数値,
      "horse_name": "馬名",
      "jockey": "騎手名",
      "popularity": 人気順位の数値または0,
      "odds": "単勝オッズ（例:2.1）または0"
    }
  ]
}

JSONのみ出力`;

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2000,
      tools: [{ type: "web_search_20250305", name: "web_search" }],
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!res.ok) return [];
  const data = await res.json();
  const text = (data.content || [])
    .filter(b => b.type === "text")
    .map(b => b.text)
    .join("");

  const cleaned = text.replace(/```json\s*/gi, "").replace(/```/g, "").trim();
  const m = cleaned.match(/\{[\s\S]*\}/);
  if (!m) return [];

  const parsed = JSON.parse(m[0]);
  return parsed.horses || [];
}

// ── メイン処理 ────────────────────────────────────────────────
async function main() {
  console.log("================================================");
  console.log(`🏇 KEIBA ORACLE 自動データ取得`);
  console.log(`📅 ${todayJP()}`);
  console.log("================================================");

  try {
    // 1. AIでレース情報を取得
    const result = await fetchRacesFromAI();

    if (result.races.length === 0) {
      console.log("⚠️  本日の開催情報が見つかりませんでした");
      process.exit(0);
    }

    console.log(`✅ ${result.races.length}レースを取得しました`);
    result.races.forEach(r => {
      console.log(`   - ${r.venue} ${r.race_number}R ${r.name} (${r.grade}) ${r.start_time}`);
    });

    // 2. 今日の既存データを削除
    await deleteTodayRaces();

    // 3. Supabaseにレースを保存
    console.log("💾 Supabaseにレースを保存中...");
    const today = todayISO();
    const racesToInsert = result.races.map(r => ({
      race_type:   r.race_type,
      race_date:   today,
      venue:       r.venue,
      race_number: Number(r.race_number) || 0,
      name:        r.name,
      start_time:  r.start_time,
      grade:       r.grade || "一般",
      distance:    r.distance || "",
      condition:   r.condition || "良",
    }));

    const inserted = await insertRaces(racesToInsert);
    console.log(`✅ ${inserted.length}レースを保存しました`);

    // 4. 重賞レースの出走馬を取得（G1・G2・G3のみ）
    const mainRaces = inserted.filter(r =>
      ["G1","G2","G3"].includes(r.grade)
    );

    if (mainRaces.length > 0) {
      console.log(`\n🐴 重賞レース ${mainRaces.length}件の出走馬を取得します...`);
      for (const race of mainRaces) {
        try {
          const horses = await fetchHorsesFromAI(race);
          if (horses.length > 0) {
            const horsesToInsert = horses.map(h => ({
              race_id:      race.id,
              horse_number: Number(h.horse_number) || 0,
              horse_name:   h.horse_name || "",
              jockey:       h.jockey || "",
              popularity:   Number(h.popularity) || 0,
              odds:         parseFloat(h.odds) || 0,
            }));
            await insertHorses(horsesToInsert);
            console.log(`   ✅ ${race.name}: ${horsesToInsert.length}頭を保存`);
          }
          // API制限を避けるため1秒待機
          await new Promise(r => setTimeout(r, 1000));
        } catch(e) {
          console.log(`   ⚠️  ${race.name} の出走馬取得に失敗: ${e.message}`);
        }
      }
    }

    console.log("\n================================================");
    console.log("🎉 完了！アプリに自動反映されました");
    console.log("================================================");

  } catch(e) {
    console.error("❌ エラーが発生しました:", e.message);
    process.exit(1);
  }
}

main();
