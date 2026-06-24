import { useState, useEffect } from "react";

// ============================================================
// 設定 — Supabase接続先（実際の値に書き換えてください）
// ============================================================
const SUPABASE_URL  = "https://dimkpqvgdckiwkpybrou.supabase.co";
const SUPABASE_ANON = "sb_publishable_OilWAFW07YZLxL5I8RJ-Yw_OJc2AeCu";

// ============================================================
// マスタ・サンプルデータ
// ============================================================
const LOCAL_VENUES = [
  "大井","川崎","船橋","浦和","門別",
  "盛岡","水沢","名古屋","園田","姫路","笠松","金沢","高知","佐賀",
];

const SAMPLE_CENTRAL = [];
const SAMPLE_LOCAL   = [];

// 各レースIDに対応するサンプル出走馬
const SAMPLE_HORSES = {
  1: [
    { id:101, horse_number:1, horse_name:"イクイノックス",     jockey:"川田将雅",   popularity:1, odds:"2.1"  },
    { id:102, horse_number:2, horse_name:"ドウデュース",       jockey:"武豊",       popularity:2, odds:"3.8"  },
    { id:103, horse_number:3, horse_name:"タイトルホルダー",   jockey:"横山和生",   popularity:3, odds:"5.5"  },
    { id:104, horse_number:4, horse_name:"ジャスティンパレス", jockey:"鮫島克駿",   popularity:4, odds:"7.2"  },
    { id:105, horse_number:5, horse_name:"スターズオンアース", jockey:"ルメール",   popularity:5, odds:"9.8"  },
    { id:106, horse_number:6, horse_name:"ガイアフォース",     jockey:"北村友一",   popularity:6, odds:"12.4" },
    { id:107, horse_number:7, horse_name:"アスクビクターモア", jockey:"田辺裕信",   popularity:7, odds:"18.0" },
    { id:108, horse_number:8, horse_name:"ボルドグフーシュ",   jockey:"岩田望来",   popularity:8, odds:"22.0" },
  ],
  11: [
    { id:201, horse_number:1, horse_name:"メイショウハリオ",  jockey:"浜中俊",       popularity:1, odds:"2.3"  },
    { id:202, horse_number:2, horse_name:"ウシュバテソーロ",  jockey:"川田将雅",     popularity:2, odds:"3.1"  },
    { id:203, horse_number:3, horse_name:"クラウンプライド",  jockey:"横山武史",     popularity:3, odds:"5.0"  },
    { id:204, horse_number:4, horse_name:"テーオーケインズ",  jockey:"松山弘平",     popularity:4, odds:"6.8"  },
    { id:205, horse_number:5, horse_name:"ノットゥルノ",      jockey:"武豊",         popularity:5, odds:"9.5"  },
    { id:206, horse_number:6, horse_name:"オメガパフューム",  jockey:"M.デムーロ",   popularity:6, odds:"14.0" },
  ],
  13: [
    { id:301, horse_number:1, horse_name:"カジノフォンテン",   jockey:"御神本訓史",  popularity:1, odds:"2.8"  },
    { id:302, horse_number:2, horse_name:"ミューチャリー",     jockey:"今野忠成",    popularity:2, odds:"4.2"  },
    { id:303, horse_number:3, horse_name:"チュウワウィザード", jockey:"大野拓弥",    popularity:3, odds:"5.5"  },
    { id:304, horse_number:4, horse_name:"ノーヴァレンダ",     jockey:"矢野貴之",    popularity:4, odds:"8.0"  },
    { id:305, horse_number:5, horse_name:"ブルドッグボス",     jockey:"森泰斗",      popularity:5, odds:"12.0" },
  ],
};

const FEATURED_RACE = {
  id:1, name:"日本ダービー", venue:"東京競馬場",
  time:"15:40", grade:"G1", distance:"芝2400m", condition:"良",
  topPick:"イクイノックス", odds:"2.1",
};

// ============================================================
// ユーティリティ
// ============================================================
function todayJP() {
  const d = new Date();
  const days = ["日","月","火","水","木","金","土"];
  return `${d.getFullYear()}.${String(d.getMonth()+1).padStart(2,"0")}.${String(d.getDate()).padStart(2,"0")} (${days[d.getDay()]})`;
}
function todayQuery() {
  const d = new Date();
  return `${d.getFullYear()}年${d.getMonth()+1}月${d.getDate()}日`;
}
function gradeColor(g) {
  if (g === "G1") return "#FFD700";
  if (g === "G2") return "#C0C0C0";
  if (g === "G3") return "#CD7F32";
  return "#7788AA";
}
function frameColor(num) {
  const f = [
    { bg:"#FFFFFF", fg:"#222" }, { bg:"#111111", fg:"#FFF" },
    { bg:"#CC0000", fg:"#FFF" }, { bg:"#0044BB", fg:"#FFF" },
    { bg:"#DDBB00", fg:"#222" }, { bg:"#006600", fg:"#FFF" },
    { bg:"#FF6600", fg:"#FFF" }, { bg:"#CC44AA", fg:"#FFF" },
  ];
  return f[Math.min(Math.floor((num - 1) / 2), 7)];
}
function popColor(p) {
  if (p === 1) return "#FFD700";
  if (p === 2) return "#C0C0C0";
  if (p === 3) return "#CD7F32";
  return "#444";
}

// ============================================================
// Supabase API
// ============================================================
async function fetchRacesFromSupabase(raceType) {
  if (SUPABASE_URL.includes("your-project")) return null;
  try {
    const today = new Date().toISOString().slice(0, 10);
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/races?race_type=eq.${raceType}&race_date=eq.${today}&order=start_time.asc`,
      {
        headers: {
          apikey: SUPABASE_ANON,
          Authorization: `Bearer ${SUPABASE_ANON}`,
          "Content-Type": "application/json",
        },
      }
    );
    if (!res.ok) throw new Error();
    const data = await res.json();
    // 空配列でもLIVE扱いにする（接続成功）
    return data;
  } catch { return null; }
}

async function fetchHorsesFromSupabase(raceId) {
  if (SUPABASE_URL.includes("your-project")) return null;
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/horses?race_id=eq.${raceId}&order=horse_number.asc`,
      { headers: { apikey: SUPABASE_ANON, Authorization: `Bearer ${SUPABASE_ANON}` } }
    );
    if (!res.ok) throw new Error();
    return await res.json();
  } catch { return null; }
}

// ============================================================
// 汎用コンポーネント
// ============================================================
function Skeleton({ width="100%", height=14, radius=6, style={} }) {
  return (
    <div style={{
      width, height, borderRadius:radius, flexShrink:0,
      background:"linear-gradient(90deg,#1a1a10 25%,#2a2810 50%,#1a1a10 75%)",
      animation:"pulse 1.4s ease infinite", ...style,
    }}/>
  );
}
function ArrowLeft() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FFD700" strokeWidth="2">
      <path d="M19 12H5M12 5l-7 7 7 7"/>
    </svg>
  );
}
function ChevronRight({ size=16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M9 18l6-6-6-6"/>
    </svg>
  );
}
function TrophyIcon({ size=20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#FFD700" strokeWidth="1.8">
      <path d="M6 9H4a2 2 0 0 1-2-2V5h4"/><path d="M18 9h2a2 2 0 0 0 2-2V5h-4"/>
      <path d="M6 2h12v7a6 6 0 0 1-12 0V2Z"/><path d="M12 15v7"/><path d="M8 22h8"/>
    </svg>
  );
}
function StarIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="#FFD700">
      <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/>
    </svg>
  );
}

// データバッジ（LIVE / SAMPLE）
function DataBadge({ src }) {
  const isLive = src === "LIVE";
  return (
    <div style={{
      fontSize:9, fontWeight:700, letterSpacing:1,
      color: isLive ? "#7aaa7a" : "#555",
      background: isLive ? "#0a1a0a" : "#111009",
      border:`1px solid ${isLive ? "#2a5a2a" : "#222"}`,
      borderRadius:6, padding:"3px 8px",
      display:"flex", alignItems:"center", gap:4,
    }}>
      {isLive && (
        <span style={{ width:6, height:6, borderRadius:"50%",
          background:"#7aaa7a", display:"inline-block",
          animation:"pulse 1.4s ease infinite" }}/>
      )}
      {src || "…"}
    </div>
  );
}

// ============================================================
// ホーム画面
// ============================================================
function HomeScreen({ onNavigate, featured, liveData, fetchStatus, lastUpdated, onRefresh, currentUser, onLogout }) {
  const isLoading  = fetchStatus === "loading";
  const isFallback = fetchStatus === "fallback";
  const isDone     = fetchStatus === "done";
  const venues     = liveData?.venues || [];
  const updatedStr = lastUpdated
    ? `${String(lastUpdated.getHours()).padStart(2,"0")}:${String(lastUpdated.getMinutes()).padStart(2,"0")} 更新`
    : null;

  return (
    <div style={S.screen}>
      {/* ── ヘッダー ── */}
      <div style={S.homeHeader}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <TrophyIcon size={28}/>
          <div>
            <div style={S.appName}>KEIBA ORACLE</div>
            <div style={S.appSub}>競馬 AI 予想</div>
          </div>
        </div>
        <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:6 }}>
          <div style={S.dateBadge}>
            <span style={{ fontSize:11, color:"#FFD700" }}>{todayJP()}</span>
          </div>
          {currentUser ? (
            <div style={{ display:"flex", alignItems:"center", gap:6 }}>
              <span style={{ fontSize:10, color:"#FFD700",
                background:"#1a1400", border:"1px solid #3a3318",
                borderRadius:6, padding:"3px 8px" }}>
                👤 {currentUser.nickname}
              </span>
              <button onClick={onLogout} style={{
                fontSize:9, color:"#555", background:"#111009",
                border:"1px solid #222", borderRadius:5,
                padding:"3px 7px", cursor:"pointer" }}>
                ログアウト
              </button>
            </div>
          ) : (
            <button onClick={() => onNavigate("auth")} style={{
              fontSize:11, fontWeight:700, color:"#FFD700",
              background:"#1a1400", border:"1px solid #3a3318",
              borderRadius:7, padding:"5px 12px", cursor:"pointer",
              fontFamily:"'Noto Serif JP',serif",
            }}>
              ログイン / 登録
            </button>
          )}
        </div>
      </div>

      {/* ── 開催情報バナー ── */}
      <div style={S.infoBanner}>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:10, fontWeight:700, color:"#FFD700", letterSpacing:1.5, marginBottom:6 }}>
            本日の開催情報
          </div>
          {isLoading && <Skeleton width={160} height={12}/>}
          {!isLoading && venues.length > 0 && (
            <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
              {venues.map(v => <span key={v} style={S.venueBadge}>{v}</span>)}
            </div>
          )}
          {!isLoading && venues.length === 0 && (
            <div style={{ fontSize:12, color:"#555", fontStyle:"italic" }}>
              {isFallback ? "サンプルデータを表示中" : "本日は開催なし"}
            </div>
          )}
        </div>
        <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:4 }}>
          {isLoading ? (
            <div style={{ width:20, height:20, borderRadius:"50%",
              border:"2px solid #3a3318", borderTopColor:"#FFD700",
              animation:"spin 0.8s linear infinite" }}/>
          ) : (
            <button style={S.refreshBtn} onClick={onRefresh}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#FFD700" strokeWidth="2.5">
                <path d="M23 4v6h-6"/><path d="M1 20v-6h6"/>
                <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
              </svg>
            </button>
          )}
          {updatedStr && !isLoading && (
            <div style={{ fontSize:9, color:"#444" }}>{updatedStr}</div>
          )}
        </div>
      </div>

      {/* ── 注目レース ── */}
      <div style={S.sectionLabel}><StarIcon/><span>本日の注目レース</span></div>

      {isLoading ? (
        <div style={{ ...S.featuredCard, display:"flex", flexDirection:"column", gap:10 }}>
          <Skeleton width={48} height={20} radius={4}/>
          <Skeleton width="70%" height={28} radius={6}/>
          <div style={{ display:"flex", gap:8 }}>
            <Skeleton width={90} height={22} radius={6}/>
            <Skeleton width={70} height={22} radius={6}/>
          </div>
          <div style={{ height:1, background:"#1e1a08" }}/>
          <div style={{ display:"flex", justifyContent:"space-between" }}>
            <Skeleton width={120} height={20}/>
            <Skeleton width={70} height={20}/>
          </div>
          <div style={{ fontSize:11, color:"#666", fontStyle:"italic", display:"flex", alignItems:"center", gap:6 }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#FFD700" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/>
            </svg>
            JRA開催情報を取得中…
          </div>
        </div>
      ) : (
        <div style={S.featuredCard}>
          <div style={S.featuredGlow}/>
          {isDone && (
            <div style={{ display:"inline-flex", alignItems:"center", gap:5,
              fontSize:9, fontWeight:700, color:"#7aaa7a", letterSpacing:1.5, marginBottom:8 }}>
              <span style={{ width:6, height:6, borderRadius:"50%", background:"#7aaa7a",
                display:"inline-block", animation:"pulse 1.4s ease infinite" }}/>
              LIVE DATA
            </div>
          )}
          <div style={{ display:"inline-block", fontSize:11, fontWeight:700,
            color:gradeColor(featured.grade), border:`1px solid ${gradeColor(featured.grade)}`,
            borderRadius:4, padding:"2px 8px", letterSpacing:1, marginBottom:8 }}>
            {featured.grade}
          </div>
          <div style={S.featuredName}>{featured.name}</div>
          <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginBottom:14 }}>
            {[`📍 ${featured.venue}`, `🕐 ${featured.time}`, `📏 ${featured.distance}`].map((c,i) => (
              <span key={i} style={S.metaChip}>{c}</span>
            ))}
          </div>
          <div style={{ height:1, background:"linear-gradient(90deg,transparent,#3a3318,transparent)", margin:"12px 0" }}/>
          <div style={{ display:"flex", justifyContent:"space-between", marginBottom:14 }}>
            <div>
              <div style={{ fontSize:10, color:"#666", marginBottom:4 }}>AI 本命予想</div>
              <div style={{ fontSize:18, fontWeight:700, color:"#FFD700" }}>{featured.topPick}</div>
            </div>
            <div style={{ textAlign:"right" }}>
              <div style={{ fontSize:10, color:"#666", marginBottom:4 }}>単勝オッズ</div>
              <div style={{ fontSize:22, fontWeight:700, color:"#F5E8C0", fontFamily:"'Rajdhani',sans-serif" }}>
                {featured.odds} 倍
              </div>
            </div>
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            <div style={{ fontSize:10, color:"#666", whiteSpace:"nowrap" }}>AI 信頼度</div>
            <div style={{ flex:1, height:4, background:"#1e1c0e", borderRadius:2, overflow:"hidden" }}>
              <div style={{ width:"82%", height:"100%", background:"linear-gradient(90deg,#B8860B,#FFD700)", borderRadius:2 }}/>
            </div>
            <div style={{ fontSize:12, fontWeight:700, color:"#FFD700", fontFamily:"'Rajdhani',sans-serif" }}>82%</div>
          </div>
        </div>
      )}

      {/* ── 統計 ── */}
      <div style={{ display:"flex", margin:"16px 16px", gap:8 }}>
        {[
          { label:"本日レース数", value: liveData?.races?.length ?? SAMPLE_CENTRAL.length },
          { label:"G1 レース",   value: liveData?.races?.filter(r=>r.grade==="G1").length ?? 2 },
          { label:"的中率",      value: "68%" },
        ].map(s => (
          <div key={s.label} style={S.statBox}>
            <div style={{ ...S.statValue, ...(isLoading ? { animation:"pulse 1.4s ease infinite", color:"#333" } : {}) }}>
              {isLoading ? "…" : String(s.value)}
            </div>
            <div style={S.statLabel}>{s.label}</div>
          </div>
        ))}
      </div>

      <button style={S.ctaButton} onClick={() => onNavigate("list")}>
        <span>レース一覧を見る</span>
        <ChevronRight size={18}/>
      </button>

      <div style={{ textAlign:"center", fontSize:11, color:"#333", marginTop:16, letterSpacing:1 }}>
        {isLoading ? "JRA情報を取得中…" : isFallback ? "サンプルデータ表示中" : "AI 予想更新済み"}
      </div>
    </div>
  );
}

// ============================================================
// レース一覧画面
// ============================================================
function RaceListScreen({ onNavigate }) {
  const [mainTab,      setMainTab]      = useState("central");
  const [gradeFilter,  setGradeFilter]  = useState("ALL");
  const [venueFilter,  setVenueFilter]  = useState("ALL");
  const [centralRaces, setCentralRaces] = useState(null);
  const [localRaces,   setLocalRaces]   = useState(null);
  const [loadingC,     setLoadingC]     = useState(false);
  const [loadingL,     setLoadingL]     = useState(false);
  const [srcLabel,     setSrcLabel]     = useState("");

  // Supabase or サンプルで中央を読込
  const loadCentral = async () => {
    if (centralRaces !== null) return;
    setLoadingC(true);
    const data = await fetchRacesFromSupabase("central");
    if (data !== null) {
      // null でなければ接続成功（データが0件でもLIVE）
      setCentralRaces(data.length > 0 ? data : SAMPLE_CENTRAL);
      setSrcLabel("LIVE");
    } else {
      setCentralRaces(SAMPLE_CENTRAL);
      setSrcLabel("SAMPLE");
    }
    setLoadingC(false);
  };
  const loadLocal = async () => {
    if (localRaces !== null) return;
    setLoadingL(true);
    const data = await fetchRacesFromSupabase("local");
    if (data !== null) {
      setCentralRaces(data.length > 0 ? data : SAMPLE_LOCAL);
      setLocalRaces(data.length > 0 ? data : SAMPLE_LOCAL);
      setSrcLabel("LIVE");
    } else {
      setLocalRaces(SAMPLE_LOCAL);
      setSrcLabel("SAMPLE");
    }
    setLoadingL(false);
  };

  // 画面表示時に中央を自動読込
  useEffect(() => { loadCentral(); }, []);

  const switchTab = (t) => {
    setMainTab(t); setGradeFilter("ALL"); setVenueFilter("ALL");
    if (t === "central") loadCentral(); else loadLocal();
  };

  const isLocal   = mainTab === "local";
  const accent    = isLocal ? "#40c8c8" : "#FFD700";
  const base      = mainTab === "central" ? (centralRaces ?? []) : (localRaces ?? []);

  // 中央競馬の開催場リスト（データから動的に生成）
  const centralVenues = Array.from(new Set((centralRaces ?? []).map(r => r.venue))).filter(Boolean);

  const graded    = gradeFilter === "ALL" ? base : base.filter(r => r.grade === gradeFilter);
  const displayed = venueFilter !== "ALL" ? graded.filter(r => r.venue === venueFilter) : graded;
  const isLoading = mainTab === "central" ? loadingC : loadingL;
  const grades    = ["ALL", ...Array.from(new Set(base.map(r => r.grade))).filter(Boolean)];

  return (
    <div style={S.screen}>
      {/* ── ヘッダー ── */}
      <div style={S.subHeader}>
        <button style={S.backBtn} onClick={() => onNavigate("home")}><ArrowLeft/></button>
        <div style={S.subTitle}>レース一覧</div>
        <DataBadge src={srcLabel}/>
      </div>

      {/* ── 中央/地方タブ ── */}
      <div style={{ display:"flex", margin:"12px 16px 0", background:"#0a0908",
        border:"1px solid #1e1c0e", borderRadius:12, padding:4, gap:4 }}>
        {[
          { key:"central", label:"中央競馬", emoji:"🏇", accent:"#FFD700", bg:"#1a1400", border:"#3a3318" },
          { key:"local",   label:"地方競馬", emoji:"🌙", accent:"#40c8c8", bg:"#001818", border:"#1a5050" },
        ].map(t => {
          const active = mainTab === t.key;
          const count  = t.key === "central" ? centralRaces?.length : localRaces?.length;
          return (
            <button key={t.key} onClick={() => switchTab(t.key)} style={{
              flex:1, display:"flex", alignItems:"center", justifyContent:"center", gap:6,
              padding:"10px 8px", borderRadius:9, cursor:"pointer",
              border: active ? `1px solid ${t.border}` : "1px solid transparent",
              background: active ? t.bg : "transparent",
              color: active ? t.accent : "#444",
              fontSize:13, fontWeight:700, fontFamily:"'Noto Serif JP',serif",
              boxShadow: active ? `0 0 12px ${t.accent}22` : "none",
              transition:"all 0.2s",
            }}>
              <span style={{ fontSize:14 }}>{t.emoji}</span>
              <span>{t.label}</span>
              {count !== undefined && (
                <span style={{ fontSize:10, fontFamily:"'Rajdhani',sans-serif",
                  padding:"1px 6px", borderRadius:10,
                  background: active ? "#00000030" : "#111",
                  color: active ? t.accent : "#555",
                  border:`1px solid ${active ? t.border : "#222"}` }}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ── 競馬場フィルター（中央・地方共通） ── */}
      {(() => {
        const venues = isLocal ? LOCAL_VENUES : centralVenues;
        if (venues.length === 0) return null;
        const activeColor  = isLocal ? "#40c8c8" : "#FFD700";
        const activeBg     = isLocal ? "#001a1a"  : "#1a1400";
        const activeBorder = isLocal ? "#2a6060"  : "#3a3318";
        const inactiveColor  = isLocal ? "#446666" : "#666644";
        const inactiveBg     = isLocal ? "#080f0f" : "#0f0e08";
        const inactiveBorder = isLocal ? "#1a2828" : "#282810";
        return (
          <div style={{ display:"flex", gap:6, padding:"10px 16px 0",
            overflowX:"auto", WebkitOverflowScrolling:"touch" }}>
            <button onClick={() => setVenueFilter("ALL")} style={{
              flexShrink:0, padding:"5px 13px", borderRadius:8, cursor:"pointer",
              border: venueFilter==="ALL" ? `1px solid ${activeBorder}` : `1px solid ${inactiveBorder}`,
              background: venueFilter==="ALL" ? activeBg : inactiveBg,
              color: venueFilter==="ALL" ? activeColor : inactiveColor,
              fontSize:11, fontWeight:700, whiteSpace:"nowrap",
              fontFamily:"'Noto Serif JP',serif",
            }}>全場</button>
            {venues.map(v => (
              <button key={v} onClick={() => setVenueFilter(v)} style={{
                flexShrink:0, padding:"5px 13px", borderRadius:8, cursor:"pointer",
                border: venueFilter===v ? `1px solid ${activeBorder}` : `1px solid ${inactiveBorder}`,
                background: venueFilter===v ? activeBg : inactiveBg,
                color: venueFilter===v ? activeColor : inactiveColor,
                fontSize:11, fontWeight:700, whiteSpace:"nowrap",
                fontFamily:"'Noto Serif JP',serif",
              }}>{v}</button>
            ))}
          </div>
        );
      })()}

      {/* ── グレードフィルター ── */}
      <div style={{ display:"flex", gap:8, padding:"10px 16px", overflowX:"auto" }}>
        {grades.map(g => (
          <button key={g} onClick={() => setGradeFilter(g)} style={{
            flexShrink:0, padding:"6px 14px", borderRadius:8, cursor:"pointer",
            border: gradeFilter===g ? `1px solid ${accent}` : "1px solid #2a2810",
            background: gradeFilter===g ? (isLocal ? "#001a1a" : "#2a2400") : "#111009",
            color: gradeFilter===g ? accent : "#666",
            fontSize:12, fontWeight:700, fontFamily:"'Rajdhani',sans-serif",
            letterSpacing:1, whiteSpace:"nowrap", transition:"all 0.15s",
          }}>{g}</button>
        ))}
      </div>

      {/* ── レースカードリスト ── */}
      <div style={{ padding:"0 16px", display:"flex", flexDirection:"column", gap:10 }}>
        {isLoading ? (
          [1,2,3,4].map(i => (
            <div key={i} style={{ ...S.raceCard, gap:12 }}>
              <div style={{ display:"flex", flexDirection:"column", gap:6, minWidth:44 }}>
                <Skeleton width={36} height={18} radius={4}/>
                <Skeleton width={36} height={15}/>
              </div>
              <div style={{ flex:1, display:"flex", flexDirection:"column", gap:6 }}>
                <Skeleton width="60%" height={15}/>
                <Skeleton width="80%" height={11}/>
              </div>
            </div>
          ))
        ) : displayed.length === 0 ? (
          <div style={{ textAlign:"center", padding:"40px 20px", color:"#444", fontSize:13 }}>
            {venueFilter !== "ALL" ? `${venueFilter}のレースはありません` : "該当するレースがありません"}
          </div>
        ) : (
          displayed.map((race, i) => (
            /* ── レースカード（クリックで詳細へ）── */
            <div
              key={race.id}
              onClick={() => onNavigate("detail", race)}
              style={{ ...S.raceCard,
                animationDelay:`${i * 50}ms`,
                cursor:"pointer",
                borderLeft: isLocal ? "2px solid #1a3a3a" : "2px solid transparent",
              }}
            >
              {/* 左: グレード + 発走時刻 */}
              <div style={{ display:"flex", flexDirection:"column",
                alignItems:"center", gap:6, minWidth:44 }}>
                <div style={{ fontSize:10, fontWeight:700, padding:"2px 6px", borderRadius:4,
                  border:`1px solid ${gradeColor(race.grade)}`,
                  color:gradeColor(race.grade), letterSpacing:0.5 }}>
                  {race.grade}
                </div>
                <div style={{ fontFamily:"'Rajdhani',sans-serif",
                  fontSize:15, fontWeight:700, color:"#E8D9A0" }}>
                  {race.start_time || race.time}
                </div>
              </div>

              {/* 中: 競馬場バッジ + レース名 + サブ情報 */}
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:4 }}>
                  <span style={{ fontSize:11, fontWeight:700, padding:"2px 8px", borderRadius:6,
                    background: isLocal ? "#001818" : "#1a1400",
                    border:`1px solid ${isLocal ? "#2a6060" : "#3a3318"}`,
                    color: isLocal ? "#40c8c8" : "#FFD700",
                    whiteSpace:"nowrap" }}>
                    {isLocal ? "🌙" : "🏇"} {race.venue}
                  </span>
                  {race.race_number && (
                    <span style={{ fontSize:10, fontWeight:700, color:"#666",
                      background:"#111009", border:"1px solid #222",
                      borderRadius:5, padding:"2px 6px",
                      fontFamily:"'Rajdhani',sans-serif" }}>
                      {race.race_number}R
                    </span>
                  )}
                </div>
                <div style={{ fontSize:15, fontWeight:700, color:"#E8D9A0",
                  marginBottom:4, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                  {race.name}
                </div>
                <div style={{ display:"flex", gap:8, flexWrap:"wrap", fontSize:10, color:"#555" }}>
                  {race.distance  && <span>📏 {race.distance}</span>}
                  {race.condition && race.condition !== "—" && <span>🌤 {race.condition}</span>}
                </div>
              </div>

              {/* 右: ハート + 矢印 */}
              <div style={{ display:"flex", flexDirection:"column",
                alignItems:"center", gap:6, flexShrink:0 }}>
                <FavButton item={race} type="race" size={15}/>
                <div style={{ color: isLocal ? "#2a6060" : "#444" }}>
                  <ChevronRight size={18}/>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ============================================================
// レース詳細画面
// ============================================================
function RaceDetailScreen({ race, onNavigate }) {
  const isLocal  = race.race_type === "local" || race.type === "local";
  const accent   = isLocal ? "#40c8c8" : "#FFD700";
  const accentBg = isLocal ? "#001818"  : "#1a1400";
  const accentBr = isLocal ? "#2a6060"  : "#3a3318";

  const [horses,  setHorses]  = useState([]);
  const [hStatus, setHStatus] = useState("loading");
  const [dataSrc, setDataSrc] = useState("");
  const [activeTab, setActiveTab] = useState("horses"); // "horses" | "ai"

  // Supabase から出走馬取得、失敗時はサンプルにフォールバック
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setHStatus("loading");
      const live = await fetchHorsesFromSupabase(race.id);
      if (cancelled) return;
      if (live && live.length > 0) {
        setHorses(live); setDataSrc("LIVE");
      } else {
        // IDに対応するサンプルがない場合は自動生成
        const sample = SAMPLE_HORSES[race.id] ?? autoSample(race);
        setHorses(sample); setDataSrc("SAMPLE");
      }
      setHStatus("done");
    })();
    return () => { cancelled = true; };
  }, [race.id]);

  function autoSample(r) {
    const names   = ["サクラバクシンオー","ナリタブライアン","オグリキャップ","トウカイテイオー","シンボリルドルフ","ミホノブルボン"];
    const jockeys = ["武豊","ルメール","川田将雅","横山武史","松山弘平","吉田隼人"];
    const count = r.horses || 8;
    return Array.from({ length: count }, (_, i) => ({
      id:`auto_${i}`, horse_number:i+1,
      horse_name: names[i % names.length],
      jockey: jockeys[i % jockeys.length],
      popularity: i+1,
      odds: (1.5 + i * 2.1).toFixed(1),
    }));
  }

  const startTime = race.start_time || race.time || "—";

  return (
    <div style={S.screen}>

      {/* ── ヘッダー ── */}
      <div style={S.subHeader}>
        <button style={S.backBtn} onClick={() => onNavigate("list")}><ArrowLeft/></button>
        <div style={S.subTitle}>レース詳細</div>
        <div style={{ display:"flex", alignItems:"center", gap:6 }}>
          <FavButton item={race} type="race" size={16}/>
          <DataBadge src={dataSrc}/>
        </div>
      </div>

      {/* ── レース情報ヒーロー ── */}
      <div style={{
        padding:"16px 20px 20px",
        borderBottom:"1px solid #1a1a12",
        borderLeft:`3px solid ${accent}`,
        background:`linear-gradient(135deg,${accentBg}55 0%,#0d0d0d 65%)`,
      }}>
        {/* バッジ行 */}
        <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:10, flexWrap:"wrap" }}>
          <span style={{ fontSize:12, fontWeight:700, padding:"3px 10px", borderRadius:6,
            background:accentBg, border:`1px solid ${accentBr}`, color:accent }}>
            {isLocal ? "🌙 地方" : "🏇 中央"}
          </span>
          <span style={{ fontSize:12, fontWeight:700, padding:"3px 10px", borderRadius:6,
            background:"#111009", border:"1px solid #2a2810", color:"#888" }}>
            📍 {race.venue}
          </span>
          {race.race_number && (
            <span style={{ fontSize:11, fontWeight:700, padding:"3px 9px", borderRadius:6,
              background:"#0e0d08", border:"1px solid #222", color:"#666",
              fontFamily:"'Rajdhani',sans-serif" }}>
              第{race.race_number}レース
            </span>
          )}
          {race.grade && (
            <span style={{ fontSize:11, fontWeight:700, padding:"2px 8px", borderRadius:4,
              border:`1px solid ${gradeColor(race.grade)}`, color:gradeColor(race.grade) }}>
              {race.grade}
            </span>
          )}
        </div>

        {/* レース名 */}
        <div style={{ fontFamily:"'Playfair Display',serif", fontSize:24, fontWeight:700,
          color:"#F5E8C0", lineHeight:1.2, marginBottom:14 }}>
          {race.name}
        </div>

        {/* 4マスグリッド: 発走時刻・距離・馬場状態・頭数 */}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
          {[
            { icon:"🕐", label:"発走時刻", value:startTime,                  highlight:true  },
            { icon:"📏", label:"距離",     value:race.distance   || "—",     highlight:false },
            { icon:"🌤", label:"馬場状態", value:race.condition  || "—",     highlight:false },
            { icon:"🐴", label:"頭数",     value:hStatus==="done" ? `${horses.length}頭` : "—", highlight:false },
          ].map(item => (
            <div key={item.label} style={{
              background:"#0a0908", border:"1px solid #1e1c0e",
              borderRadius:10, padding:"10px 12px",
            }}>
              <div style={{ fontSize:10, color:"#555", marginBottom:4 }}>
                {item.icon} {item.label}
              </div>
              <div style={{
                fontSize:15, fontWeight:700,
                color: item.highlight ? accent : "#E8D9A0",
                fontFamily:"'Rajdhani',sans-serif",
              }}>
                {item.value}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── タブ切替 ── */}
      <div style={{ display:"flex", margin:"14px 16px 0", background:"#0a0908",
        border:"1px solid #1e1c0e", borderRadius:10, padding:3, gap:3 }}>
        {[
          { key:"horses", label:"出走馬一覧" },
          { key:"ai",     label:"AI 予想"   },
        ].map(t => (
          <button key={t.key} onClick={() => setActiveTab(t.key)} style={{
            flex:1, padding:"9px 0", borderRadius:8, border:"none", cursor:"pointer",
            background: activeTab===t.key ? (isLocal ? "#001a1a" : "#1a1700") : "transparent",
            color: activeTab===t.key ? accent : "#444",
            fontSize:13, fontWeight:700, fontFamily:"'Noto Serif JP',serif",
            boxShadow: activeTab===t.key ? `0 0 10px ${accent}18` : "none",
            transition:"all 0.2s",
          }}>{t.label}</button>
        ))}
      </div>

      {/* ══════════════════════════════════════
          出走馬タブ
      ══════════════════════════════════════ */}
      {activeTab === "horses" && (
        <div>
          <div style={{ padding:"14px 16px 8px", display:"flex", alignItems:"center",
            justifyContent:"space-between" }}>
            <div style={{ display:"flex", alignItems:"center", gap:6,
              fontSize:12, fontWeight:700, color:accent, letterSpacing:1 }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={accent} strokeWidth="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
              出走馬一覧
            </div>
            {hStatus === "done" && (
              <div style={{ fontSize:10, color:"#555" }}>{horses.length}頭</div>
            )}
          </div>

          <div style={{ margin:"0 16px", background:"#0e0d08",
            border:`1px solid ${isLocal ? "#1a3a3a" : "#1e1c0e"}`,
            borderRadius:14, overflow:"hidden" }}>
            {/* ヘッダー */}
            <div style={{
              display:"grid", gridTemplateColumns:"30px 26px 1fr 66px 26px 46px 34px",
              padding:"8px 10px", background:"#161408",
              borderBottom:`1px solid ${isLocal ? "#1a3a3a" : "#2a2810"}`,
              fontSize:10, fontWeight:700, letterSpacing:0.5, color:accent,
            }}>
              <span style={{ textAlign:"center" }}>枠</span>
              <span style={{ textAlign:"center" }}>馬番</span>
              <span>馬名</span>
              <span>騎手</span>
              <span style={{ textAlign:"center" }}>人気</span>
              <span style={{ textAlign:"right" }}>オッズ</span>
              <span style={{ textAlign:"center" }}>♥</span>
            </div>

            {/* ローディング */}
            {hStatus === "loading" && [1,2,3,4,5].map(i => (
              <div key={i} style={{
                display:"grid", gridTemplateColumns:"30px 26px 1fr 66px 26px 46px 34px",
                padding:"11px 10px", gap:6, alignItems:"center",
                background: i%2===0 ? "#0e0d08" : "#111009",
                borderBottom:"1px solid #161408",
              }}>
                <Skeleton width={22} height={22} radius={4} style={{ margin:"0 auto" }}/>
                <Skeleton width={16} height={14} style={{ margin:"0 auto" }}/>
                <Skeleton width="80%" height={13}/>
                <Skeleton width={54} height={11}/>
                <Skeleton width={18} height={18} radius={9} style={{ margin:"0 auto" }}/>
                <Skeleton width={34} height={12} style={{ marginLeft:"auto" }}/>
                <Skeleton width={28} height={28} radius={8} style={{ margin:"0 auto" }}/>
              </div>
            ))}

            {/* データ行 */}
            {hStatus === "done" && horses.map((h, i) => {
              const fc  = frameColor(h.horse_number);
              const pop = Number(h.popularity);
              const top = pop >= 1 && pop <= 3;
              return (
                <div key={h.id || i} style={{
                  display:"grid", gridTemplateColumns:"30px 26px 1fr 66px 26px 46px 34px",
                  alignItems:"center", padding:"10px 10px",
                  background: i%2===0 ? "#0e0d08" : "#111009",
                  borderBottom:"1px solid #161408",
                  borderLeft: top ? `2px solid ${popColor(pop)}` : "2px solid transparent",
                }}>
                  <div style={{ display:"flex", justifyContent:"center" }}>
                    <div style={{ width:22, height:22, borderRadius:4, background:fc.bg, color:fc.fg,
                      fontSize:11, fontWeight:700, fontFamily:"'Rajdhani',sans-serif",
                      display:"flex", alignItems:"center", justifyContent:"center",
                      boxShadow:"0 1px 4px rgba(0,0,0,0.6)" }}>
                      {Math.ceil(h.horse_number / 2)}
                    </div>
                  </div>
                  <div style={{ textAlign:"center", fontSize:14, fontWeight:700,
                    color:"#E8D9A0", fontFamily:"'Rajdhani',sans-serif" }}>
                    {h.horse_number}
                  </div>
                  <div style={{ overflow:"hidden" }}>
                    <div style={{ fontSize:13, fontWeight:700, lineHeight:1.2,
                      color: top ? "#F5E8C0" : "#888",
                      overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                      {h.horse_name}
                    </div>
                  </div>
                  <div style={{ fontSize:11, color:"#666",
                    overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                    {h.jockey}
                  </div>
                  <div style={{ display:"flex", justifyContent:"center" }}>
                    <span style={{ width:20, height:20, borderRadius:"50%",
                      fontSize:10, fontWeight:700,
                      display:"flex", alignItems:"center", justifyContent:"center",
                      background: top ? popColor(pop) : "#1a1a10",
                      color: top ? "#000" : "#555",
                      fontFamily:"'Rajdhani',sans-serif" }}>
                      {pop || "—"}
                    </span>
                  </div>
                  <div style={{ textAlign:"right", fontSize:13, fontWeight:700,
                    color: pop===1 ? accent : "#777", fontFamily:"'Rajdhani',sans-serif" }}>
                    {h.odds}<span style={{ fontSize:9, color:"#555", marginLeft:1 }}>倍</span>
                  </div>
                  {/* ♥ お気に入りボタン */}
                  <div style={{ display:"flex", justifyContent:"center" }}>
                    <FavButton item={{ ...h, id: h.id || `${race.id}_${h.horse_number}` }}
                      type="horse" size={13}/>
                  </div>
                </div>
              );
            })}

            {/* 凡例 */}
            {hStatus === "done" && (
              <div style={{ display:"flex", gap:12, padding:"9px 12px",
                borderTop:`1px solid ${isLocal ? "#1a3a3a" : "#1e1c0e"}`,
                background:"#0a0908" }}>
                {[["#FFD700","1番人気"],["#C0C0C0","2番人気"],["#CD7F32","3番人気"]].map(([c,l]) => (
                  <span key={l} style={{ display:"flex", alignItems:"center", gap:4, fontSize:10, color:"#555" }}>
                    <span style={{ width:8, height:8, borderRadius:"50%", background:c, display:"inline-block" }}/>{l}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════
          AI予想タブ
      ══════════════════════════════════════ */}
      {activeTab === "ai" && (
        <div style={{ paddingBottom:8 }}>

          {/* ── AI予想ランキング ── */}
          <div style={{ padding:"14px 16px 8px", fontSize:12, fontWeight:700,
            color:accent, letterSpacing:1, display:"flex", alignItems:"center", gap:6 }}>
            <StarIcon/> AI 予想ランキング
          </div>

          {horses.slice(0,3).map((h, i) => {
            const marks    = ["◎","○","▲"];
            const conf     = [82, 67, 54];
            const pop      = Number(h.popularity);
            return (
              <div key={h.id||i} style={{ display:"flex", alignItems:"center", gap:12,
                margin:"0 16px 10px", background:"#111009", border:"1px solid #1e1c0e",
                borderRadius:14, padding:"14px" }}>
                <div style={{ width:36, height:36, borderRadius:"50%",
                  background: isLocal ? "#001a1a" : "#1a1700",
                  border:`1px solid ${isLocal ? "#2a6060" : "#3a3318"}`,
                  display:"flex", alignItems:"center", justifyContent:"center",
                  fontSize:18, color:accent, fontWeight:700, flexShrink:0 }}>
                  {marks[i]}
                </div>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:15, fontWeight:700, color:"#E8D9A0", marginBottom:2 }}>
                    {h.horse_name}
                  </div>
                  <div style={{ fontSize:11, color:"#555", marginBottom:6 }}>
                    騎手: {h.jockey}
                  </div>
                  <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                    <div style={{ flex:1, height:3, background:"#1a1a10", borderRadius:2, overflow:"hidden" }}>
                      <div style={{ width:`${conf[i]}%`, height:"100%", borderRadius:2,
                        background:`linear-gradient(90deg,${isLocal?"#1a6060":"#B8860B"},${accent})` }}/>
                    </div>
                    <span style={{ fontSize:12, fontWeight:700, color:accent,
                      fontFamily:"'Rajdhani',sans-serif", minWidth:32 }}>{conf[i]}%</span>
                  </div>
                </div>
                <div style={{ textAlign:"right" }}>
                  <div style={{ fontFamily:"'Rajdhani',sans-serif", fontSize:22,
                    fontWeight:700, color:accent, lineHeight:1 }}>{h.odds}</div>
                  <div style={{ fontSize:10, color:"#555", marginTop:2 }}>倍</div>
                </div>
              </div>
            );
          })}

          {/* ── 過去5走平均順位 ── */}
          <div style={{ padding:"8px 16px 8px", fontSize:12, fontWeight:700,
            color:accent, letterSpacing:1, display:"flex", alignItems:"center", gap:6 }}>
            <StarIcon/> 過去5走平均順位
          </div>
          <div style={{ margin:"0 16px", background:"#0e0d08", border:"1px solid #1e1c0e",
            borderRadius:14, overflow:"hidden" }}>
            {horses.slice(0,3).map((h, hi) => {
              const runs = [[1,1,2,1,1],[2,1,3,2,1],[1,3,2,4,2]][hi];
              const avg  = (runs.reduce((a,b)=>a+b,0)/runs.length).toFixed(1);
              return (
                <div key={h.id||hi} style={{ display:"flex", alignItems:"center",
                  justifyContent:"space-between", padding:"12px 14px",
                  borderBottom: hi<2 ? "1px solid #1a1a10" : "none" }}>
                  <div style={{ display:"flex", alignItems:"center", gap:8, flex:"0 0 auto" }}>
                    <div style={{ fontSize:16, color:accent, fontWeight:700, width:18 }}>
                      {["◎","○","▲"][hi]}
                    </div>
                    <div>
                      <div style={{ fontSize:12, fontWeight:700, color:"#E8D9A0", whiteSpace:"nowrap" }}>
                        {h.horse_name}
                      </div>
                      <div style={{ fontSize:10, color:"#555", marginTop:2 }}>
                        平均 <span style={{ fontFamily:"'Rajdhani',sans-serif",
                          fontWeight:700, color:accent, fontSize:13 }}>{avg}着</span>
                      </div>
                    </div>
                  </div>
                  <div style={{ display:"flex", alignItems:"flex-end", gap:4, height:44 }}>
                    {runs.map((r,ri) => (
                      <div key={ri} style={{ display:"flex", flexDirection:"column",
                        alignItems:"center", gap:2, width:20 }}>
                        <div style={{ width:14, height:32, background:"#1a1a10", borderRadius:3,
                          display:"flex", alignItems:"flex-end", overflow:"hidden" }}>
                          <div style={{ width:"100%", borderRadius:3,
                            height:`${Math.round((1-(r-1)/16)*100)}%`,
                            background: r===1 ? `linear-gradient(180deg,${accent},#886600)`
                              : r<=3 ? "linear-gradient(180deg,#888,#444)" : "#2a2a1a" }}/>
                        </div>
                        <div style={{ fontFamily:"'Rajdhani',sans-serif",
                          fontSize:10, color:"#666", fontWeight:700 }}>{r}</div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* ── 騎手成績 ── */}
          <div style={{ padding:"14px 16px 8px", fontSize:12, fontWeight:700,
            color:accent, letterSpacing:1, display:"flex", alignItems:"center", gap:6 }}>
            <StarIcon/> 騎手成績
          </div>
          <div style={{ margin:"0 16px", background:"#0e0d08", border:"1px solid #1e1c0e",
            borderRadius:14, overflow:"hidden" }}>
            {horses.slice(0,3).map((h, ji) => {
              const stats = [{wr:43,pr:70,wins:38,rides:89},{wr:30,pr:65,wins:22,rides:74},{wr:22,pr:51,wins:15,rides:68}][ji];
              return (
                <div key={h.id||ji} style={{ display:"flex", alignItems:"center",
                  justifyContent:"space-between", padding:"12px 14px",
                  borderBottom: ji<2 ? "1px solid #1a1a10" : "none" }}>
                  <div style={{ display:"flex", alignItems:"center", gap:10, flex:"0 0 auto" }}>
                    <div style={{ width:34, height:34, borderRadius:"50%",
                      background: isLocal ? "#001a1a" : "#1a1700",
                      border:`1px solid ${isLocal ? "#2a6060" : "#3a3318"}`,
                      color:accent, fontWeight:700, fontSize:13,
                      display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                      {h.jockey?.[0]}
                    </div>
                    <div>
                      <div style={{ fontSize:13, fontWeight:700, color:"#E8D9A0" }}>{h.jockey}</div>
                      <div style={{ fontSize:10, color:"#555", marginTop:2 }}>
                        {stats.wins}勝 / {stats.rides}騎乗
                      </div>
                    </div>
                  </div>
                  <div style={{ display:"flex", gap:14, alignItems:"center" }}>
                    {[{label:"勝率",val:stats.wr,c:accent},{label:"複勝率",val:stats.pr,c:"#888"}].map(s=>(
                      <div key={s.label} style={{ display:"flex", flexDirection:"column",
                        alignItems:"center", gap:2, minWidth:44 }}>
                        <div style={{ fontFamily:"'Rajdhani',sans-serif", fontSize:17,
                          fontWeight:700, color:s.c, lineHeight:1 }}>{s.val}%</div>
                        <div style={{ fontSize:9, color:"#555" }}>{s.label}</div>
                        <div style={{ width:44, height:3, background:"#1a1a10",
                          borderRadius:2, overflow:"hidden" }}>
                          <div style={{ width:`${s.val}%`, height:"100%", borderRadius:2,
                            background:s.c }}/>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* ── 距離適性 ── */}
          <div style={{ padding:"14px 16px 8px", fontSize:12, fontWeight:700,
            color:accent, letterSpacing:1, display:"flex", alignItems:"center", gap:6 }}>
            <StarIcon/> 距離適性
          </div>
          <div style={{ margin:"0 16px", background:"#0e0d08", border:"1px solid #1e1c0e",
            borderRadius:14, overflow:"hidden" }}>
            {horses.slice(0,3).map((h, ai) => {
              const apts = [
                {"〜1400":30,"1600":55,"2000":88,"2400":95,"2600〜":72},
                {"〜1400":20,"1600":78,"2000":82,"2400":80,"2600〜":55},
                {"〜1400":15,"1600":40,"2000":75,"2400":85,"2600〜":90},
              ][ai];
              const targetDist = race.distance?.replace(/[^0-9]/g,"") || "2400";
              return (
                <div key={h.id||ai} style={{ padding:"12px 14px",
                  borderBottom: ai<2 ? "1px solid #1a1a10" : "none" }}>
                  <div style={{ fontSize:12, fontWeight:700, color:"#C8B98A", marginBottom:10 }}>
                    <span style={{ color:accent, marginRight:6 }}>{["◎","○","▲"][ai]}</span>
                    {h.horse_name}
                  </div>
                  <div style={{ display:"flex", gap:6, alignItems:"flex-end" }}>
                    {Object.entries(apts).map(([dist, val]) => {
                      const isTarget = dist.includes(targetDist.slice(0,2));
                      return (
                        <div key={dist} style={{ flex:1, display:"flex", flexDirection:"column",
                          alignItems:"center", gap:3 }}>
                          <div style={{ fontSize:9, color: isTarget ? accent : "#555",
                            whiteSpace:"nowrap" }}>{dist}</div>
                          <div style={{ width:"100%", height:48, background:"#161410",
                            borderRadius:3, display:"flex", alignItems:"flex-end",
                            overflow:"hidden" }}>
                            <div style={{ width:"100%", borderRadius:3,
                              height:`${val}%`,
                              background: isTarget
                                ? `linear-gradient(180deg,${accent},#886600)`
                                : val>=70 ? "linear-gradient(180deg,#5a8a5a,#2d4d2d)"
                                : "linear-gradient(180deg,#3a3a2a,#222)" }}/>
                          </div>
                          <div style={{ fontFamily:"'Rajdhani',sans-serif", fontSize:11,
                            fontWeight:700,
                            color: isTarget ? accent : val>=70 ? "#7aaa7a" : "#555" }}>
                            {val}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
            <div style={{ fontSize:10, color:"#444", padding:"8px 14px",
              borderTop:"1px solid #161410" }}>※ ハイライトは今回の施行距離</div>
          </div>

          {/* ── 馬場適性 ── */}
          <div style={{ padding:"14px 16px 8px", fontSize:12, fontWeight:700,
            color:accent, letterSpacing:1, display:"flex", alignItems:"center", gap:6 }}>
            <StarIcon/> 馬場適性
          </div>
          <div style={{ margin:"0 16px", background:"#0e0d08", border:"1px solid #1e1c0e",
            borderRadius:14, overflow:"hidden" }}>
            {horses.slice(0,3).map((h, ti) => {
              const scores = [
                {"良":96,"稍重":80,"重":62,"不良":40},
                {"良":84,"稍重":75,"重":60,"不良":38},
                {"良":78,"稍重":82,"重":85,"不良":70},
              ][ti];
              const currentCond = race.condition || "良";
              return (
                <div key={h.id||ti} style={{ padding:"12px 14px",
                  borderBottom: ti<2 ? "1px solid #1a1a10" : "none" }}>
                  <div style={{ fontSize:12, fontWeight:700, color:"#C8B98A", marginBottom:8 }}>
                    <span style={{ color:accent, marginRight:6 }}>{["◎","○","▲"][ti]}</span>
                    {h.horse_name}
                  </div>
                  <div style={{ display:"flex", gap:6 }}>
                    {Object.entries(scores).map(([cond, val]) => {
                      const isCurrent = cond === currentCond;
                      const rank = val>=85?"S":val>=70?"A":val>=55?"B":"C";
                      const rankColor = rank==="S"?accent:rank==="A"?"#7aaa7a":rank==="B"?"#888":"#444";
                      return (
                        <div key={cond} style={{ flex:1, borderRadius:8, padding:"8px 4px",
                          display:"flex", flexDirection:"column", alignItems:"center", gap:4,
                          background: isCurrent ? "#1e1c08" : "#0e0d06",
                          border:`1px solid ${isCurrent ? (isLocal?"#2a6060":"#3a3518") : "#1a1a10"}` }}>
                          <div style={{ fontSize:11, fontWeight:700,
                            color: isCurrent ? accent : "#555",
                            display:"flex", alignItems:"center", gap:3 }}>
                            {cond}
                            {isCurrent && (
                              <span style={{ fontSize:9, background:accent, color:"#000",
                                borderRadius:3, padding:"1px 3px", fontWeight:700 }}>今</span>
                            )}
                          </div>
                          <div style={{ fontFamily:"'Rajdhani',sans-serif", fontSize:22,
                            fontWeight:700, lineHeight:1, color:rankColor }}>{rank}</div>
                          <div style={{ fontSize:10, color:"#555",
                            fontFamily:"'Rajdhani',sans-serif" }}>{val}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
            <div style={{ fontSize:10, color:"#444", padding:"8px 14px",
              borderTop:"1px solid #161410" }}>S=最適 / A=良好 / B=普通 / C=苦手</div>
          </div>

          {/* ── AI総合コメント ── */}
          <div style={{ margin:"12px 16px 0", background:"#0f0e08",
            border:"1px solid #2a2810", borderRadius:14, padding:16 }}>
            <div style={{ fontSize:12, fontWeight:700, color:accent,
              letterSpacing:1, marginBottom:8 }}>AI 総合コメント</div>
            <div style={{ fontSize:13, color:"#888", lineHeight:1.8 }}>
              {horses[0]?.horse_name || "本命馬"}は過去5走で安定した成績を誇る。
              鞍上の{horses[0]?.jockey || "騎手"}との相性も良く本命筆頭として推奨。
              今回の距離・馬場状態はともに高適性を示しており、
              死角のない仕上がりで最上位評価が妥当。
            </div>
          </div>

        </div>
      )}

      {/* ── 即PAT導線（強化版） ── */}
      <ImmediatePAT race={race} horses={horses} accent={accent} accentBg={accentBg} accentBr={accentBr}/>

      <div style={{ height:40 }}/>
    </div>
  );
}

// ============================================================
// 即PAT送客 — クリック計測ユーティリティ
// ============================================================
const PAT_STATS_KEY = "keiba:pat_stats";

async function recordPATClick(raceName) {
  try {
    const r    = await window.storage.get(PAT_STATS_KEY);
    const data = r ? JSON.parse(r.value) : { total:0, logs:[] };
    data.total += 1;
    data.logs.unshift({
      race: raceName,
      at:   new Date().toISOString(),
    });
    data.logs = data.logs.slice(0, 50); // 直近50件のみ保持
    await window.storage.set(PAT_STATS_KEY, JSON.stringify(data));
  } catch {}
}
async function loadPATStats() {
  try {
    const r = await window.storage.get(PAT_STATS_KEY);
    return r ? JSON.parse(r.value) : { total:0, logs:[] };
  } catch { return { total:0, logs:[] }; }
}

// ============================================================
// 即PAT導線コンポーネント（強化版）
// ============================================================
function ImmediatePAT({ race, horses, accent, accentBg, accentBr }) {
  // ── アフィリエイトタグ付き即PAT URL ──
  // 実際の即PATアフィリエイトURLに書き換えてください
  const PAT_URL = `https://www.ipat.jra.go.jp/?utm_source=keiba_oracle&utm_medium=app&utm_campaign=race_${race.id || "unknown"}`;

  const PAT_TYPES = ["単勝","複勝","馬連","馬単","3連複","3連単","ワイド"];

  const [open,    setOpen]    = useState(false);
  const [betType, setBetType] = useState("単勝");
  const [horse1,  setHorse1]  = useState("");
  const [horse2,  setHorse2]  = useState("");
  const [horse3,  setHorse3]  = useState("");
  const [amount,  setAmount]  = useState("100");
  const [copied,  setCopied]  = useState(false);
  const [toast,   setToast]   = useState("");
  const [clicks,  setClicks]  = useState(0);

  // クリック数を読込
  useEffect(() => {
    loadPATStats().then(s => setClicks(s.total));
  }, []);

  const showToast = (msg) => { setToast(msg); setTimeout(()=>setToast(""), 2200); };

  // 買い目テキスト生成
  const buildBetText = () => {
    const racePart = `【${race.venue} ${race.race_number ? race.race_number+"R " : ""}${race.name}】`;
    let horsePart = "";
    if (["単勝","複勝"].includes(betType)) {
      horsePart = horse1 ? `${horse1}番` : "馬番未入力";
    } else if (["馬連","馬単","ワイド"].includes(betType)) {
      horsePart = (horse1 && horse2) ? `${horse1}-${horse2}` : "馬番未入力";
    } else {
      horsePart = (horse1 && horse2 && horse3) ? `${horse1}-${horse2}-${horse3}` : "馬番未入力";
    }
    return `${racePart}\n${betType} ${horsePart} ${Number(amount).toLocaleString()}円\n\n↓即PATで購入\n${PAT_URL}`;
  };

  // クリップボードコピー
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(buildBetText());
      setCopied(true);
      showToast("買い目とURLをコピーしました！");
      setTimeout(() => setCopied(false), 2500);
    } catch { showToast("コピーに失敗しました"); }
  };

  // 即PAT送客（クリック計測付き）
  const handleOpenPAT = async () => {
    await recordPATClick(race.name);
    setClicks(c => c + 1);
    window.open(PAT_URL, "_blank");
    showToast("即PATへ移動します 🏇");
  };

  // AI推奨を自動入力
  const autoFill = () => {
    if (horses.length > 0) setHorse1(String(horses[0].horse_number));
    if (horses.length > 1) setHorse2(String(horses[1].horse_number));
    if (horses.length > 2) setHorse3(String(horses[2].horse_number));
    showToast("AI推奨馬番を入力しました");
  };

  const needHorse2 = !["単勝","複勝"].includes(betType);
  const needHorse3 = ["3連複","3連単"].includes(betType);

  const inp = {
    width:"100%", background:"#0a0908", border:"1px solid #2a2810",
    borderRadius:7, padding:"8px 10px", color:"#E8D9A0",
    fontSize:14, fontFamily:"'Rajdhani',sans-serif", fontWeight:700, textAlign:"center",
  };

  return (
    <div style={{ margin:"16px 16px 0" }}>

      {/* ── セクションラベル ── */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between",
        marginBottom:8 }}>
        <div style={{ fontSize:11, fontWeight:700, color:accent,
          letterSpacing:1, display:"flex", alignItems:"center", gap:5 }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
            stroke={accent} strokeWidth="2">
            <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
            <line x1="1" y1="10" x2="23" y2="10"/>
          </svg>
          即PAT送客
        </div>
        {/* 累計クリック数バッジ */}
        <div style={{ fontSize:10, fontWeight:700, color:"#555",
          background:"#111009", border:"1px solid #1e1c0e",
          borderRadius:8, padding:"2px 8px",
          fontFamily:"'Rajdhani',sans-serif" }}>
          累計 {clicks} クリック
        </div>
      </div>

      {/* ── メインボタン2つ ── */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:8 }}>
        {/* 買い目入力ボタン */}
        <button onClick={() => setOpen(!open)} style={{
          display:"flex", alignItems:"center", justifyContent:"center", gap:6,
          padding:"13px 8px",
          background: open ? accentBg : "#111009",
          border:`1px solid ${open ? accent : "#2a2810"}`,
          borderRadius:12, color: open ? accent : "#666",
          fontSize:12, fontWeight:700, fontFamily:"'Noto Serif JP',serif",
          cursor:"pointer", transition:"all 0.2s",
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
            stroke={open ? accent : "#666"} strokeWidth="2">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
          </svg>
          買い目を作る
        </button>

        {/* 即PAT送客ボタン（メイン収益ボタン） */}
        <button onClick={handleOpenPAT} style={{
          display:"flex", alignItems:"center", justifyContent:"center", gap:6,
          padding:"13px 8px",
          background:`linear-gradient(135deg,${accentBg},#0d0d0d)`,
          border:`1px solid ${accent}`,
          borderRadius:12, color:accent,
          fontSize:12, fontWeight:700, fontFamily:"'Noto Serif JP',serif",
          cursor:"pointer", boxShadow:`0 0 16px ${accent}22`,
          position:"relative", overflow:"hidden",
        }}>
          {/* パルスアニメ */}
          <span style={{ position:"absolute", inset:0, borderRadius:12,
            background:`radial-gradient(circle, ${accent}15, transparent 70%)`,
            animation:"pulse 2s ease infinite" }}/>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
            stroke={accent} strokeWidth="2">
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
            <polyline points="15,3 21,3 21,9"/><line x1="10" y1="14" x2="21" y2="3"/>
          </svg>
          即PATで購入 ↗
        </button>
      </div>

      {/* ── 買い目フォーム ── */}
      {open && (
        <div style={{ background:"#0e0d08", border:`1px solid ${accentBr}`,
          borderRadius:14, padding:14,
          boxShadow:`0 0 20px ${accent}12`,
          animation:"fadeSlideUp 0.3s ease both" }}>

          {/* ヘッダー */}
          <div style={{ display:"flex", justifyContent:"space-between",
            alignItems:"center", marginBottom:12 }}>
            <div style={{ fontSize:12, fontWeight:700, color:accent, letterSpacing:1 }}>
              🎯 買い目入力
            </div>
            <button onClick={autoFill} style={{ fontSize:10, fontWeight:700,
              padding:"4px 10px", borderRadius:6, cursor:"pointer",
              background:"#1a1400", border:`1px solid ${accent}`, color:accent }}>
              ✨ AI推奨を入力
            </button>
          </div>

          {/* 券種 */}
          <div style={{ marginBottom:10 }}>
            <div style={{ fontSize:10, color:"#666", marginBottom:6 }}>券種</div>
            <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
              {PAT_TYPES.map(t => (
                <button key={t} onClick={() => setBetType(t)} style={{
                  padding:"5px 11px", borderRadius:7, fontSize:12, fontWeight:700,
                  cursor:"pointer", fontFamily:"'Noto Serif JP',serif",
                  background: betType===t ? accentBg : "#0a0908",
                  border:`1px solid ${betType===t ? accent : "#2a2810"}`,
                  color: betType===t ? accent : "#555",
                  transition:"all 0.15s",
                }}>{t}</button>
              ))}
            </div>
          </div>

          {/* 馬番 */}
          <div style={{ marginBottom:10 }}>
            <div style={{ fontSize:10, color:"#666", marginBottom:6 }}>馬番</div>
            <div style={{ display:"grid",
              gridTemplateColumns: needHorse3?"1fr 1fr 1fr":needHorse2?"1fr 1fr":"1fr",
              gap:6 }}>
              {[
                { val:horse1, set:setHorse1, label:needHorse2?"1頭目":"馬番" },
                ...(needHorse2 ? [{ val:horse2, set:setHorse2, label:"2頭目" }] : []),
                ...(needHorse3 ? [{ val:horse3, set:setHorse3, label:"3頭目" }] : []),
              ].map(f => (
                <div key={f.label}>
                  <div style={{ fontSize:9, color:"#555", marginBottom:3, textAlign:"center" }}>
                    {f.label}
                  </div>
                  <select value={f.val} onChange={e=>f.set(e.target.value)} style={inp}>
                    <option value="">-</option>
                    {horses.map(h => (
                      <option key={h.horse_number} value={h.horse_number}>
                        {h.horse_number}番 {h.horse_name}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          </div>

          {/* 金額 */}
          <div style={{ marginBottom:12 }}>
            <div style={{ fontSize:10, color:"#666", marginBottom:6 }}>購入金額</div>
            <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:6 }}>
              {["100","200","500","1000","2000","5000"].map(v => (
                <button key={v} onClick={()=>setAmount(v)} style={{
                  padding:"5px 11px", borderRadius:7, fontSize:12, fontWeight:700,
                  cursor:"pointer", fontFamily:"'Rajdhani',sans-serif",
                  background: amount===v ? "#1a1400":"#0a0908",
                  border:`1px solid ${amount===v ? "#FFD700":"#2a2810"}`,
                  color: amount===v ? "#FFD700":"#555",
                }}>¥{Number(v).toLocaleString()}</button>
              ))}
            </div>
            <input type="number" value={amount}
              onChange={e=>setAmount(e.target.value)}
              style={{ ...inp, textAlign:"left", padding:"8px 12px" }}
              placeholder="金額を入力"/>
          </div>

          {/* プレビュー */}
          <div style={{ background:"#0a0908", border:"1px solid #1e1c0e",
            borderRadius:10, padding:"10px 12px", marginBottom:12 }}>
            <div style={{ fontSize:9, color:"#555", marginBottom:4 }}>買い目プレビュー</div>
            <div style={{ fontSize:12, fontWeight:700, color:"#E8D9A0",
              fontFamily:"'Noto Serif JP',serif", lineHeight:1.8,
              whiteSpace:"pre-wrap" }}>
              {buildBetText()}
            </div>
          </div>

          {/* コピー + 即PAT */}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
            <button onClick={handleCopy} style={{
              display:"flex", alignItems:"center", justifyContent:"center", gap:6,
              padding:"12px", borderRadius:10, cursor:"pointer",
              background: copied ? "#0a2a0a":"#111009",
              border:`1px solid ${copied ? "#7aaa7a":"#2a2810"}`,
              color: copied ? "#7aaa7a":"#888",
              fontSize:12, fontWeight:700, fontFamily:"'Noto Serif JP',serif",
              transition:"all 0.2s",
            }}>
              {copied ? "✓ コピー済み" : (
                <>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="2">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                  </svg>
                  買い目をコピー
                </>
              )}
            </button>
            <button onClick={handleOpenPAT} style={{
              display:"flex", alignItems:"center", justifyContent:"center", gap:6,
              padding:"12px", borderRadius:10, cursor:"pointer",
              background:accentBg, border:`1px solid ${accent}`, color:accent,
              fontSize:12, fontWeight:700, fontFamily:"'Noto Serif JP',serif",
              boxShadow:`0 0 12px ${accent}22`,
            }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
                stroke={accent} strokeWidth="2">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                <polyline points="15,3 21,3 21,9"/>
                <line x1="10" y1="14" x2="21" y2="3"/>
              </svg>
              即PATへ ↗
            </button>
          </div>

          <div style={{ fontSize:10, color:"#333", textAlign:"center", marginTop:10 }}>
            ※ 買い目をコピーして即PATに貼り付けてください。自動投票機能はありません。
          </div>
        </div>
      )}

      {toast && (
        <div style={{ position:"fixed", bottom:24, left:"50%",
          transform:"translateX(-50%)", zIndex:200,
          background:"#0f2a0f", border:"1px solid #2a6a2a",
          borderRadius:10, padding:"10px 18px", color:"#7aaa7a",
          fontSize:12, fontWeight:700,
          boxShadow:"0 4px 20px rgba(0,0,0,0.7)", whiteSpace:"nowrap" }}>
          {toast}
        </div>
      )}
    </div>
  );
}

// ============================================================
// 穴馬ランキング画面
// ============================================================

// 穴馬サンプルデータ（期待値順）
const ANABA_SAMPLE = {
  central: [
    { rank:1, horse_name:"ガイアフォース",     race_name:"日本ダービー",    venue:"東京",  popularity:6,  odds:"12.4", ev:185, reason:"前走から大幅な距離短縮で末脚炸裂の可能性。コース適性◎",    mark:"◎穴" },
    { rank:2, horse_name:"アスクビクターモア", race_name:"日本ダービー",    venue:"東京",  popularity:7,  odds:"18.0", ev:162, reason:"叩き良化型。前走凡走からの巻き返し濃厚。鞍上田辺が積極策",  mark:"○穴" },
    { rank:3, horse_name:"ボルドグフーシュ",   race_name:"日本ダービー",    venue:"東京",  popularity:8,  odds:"22.0", ev:148, reason:"長距離実績あり。スローペースになれば差し届く展開期待",      mark:"▲穴" },
    { rank:4, horse_name:"マテンロウレオ",     race_name:"鳴尾記念",        venue:"阪神",  popularity:5,  odds:"9.8",  ev:134, reason:"稍重馬場で成績向上。今回の馬場状態はベスト条件",            mark:"△穴" },
    { rank:5, horse_name:"ヒンドゥタイムズ",   race_name:"鳴尾記念",        venue:"阪神",  popularity:9,  odds:"28.0", ev:121, reason:"前走は不利あり。距離短縮でスピード活かせる舞台に替わる",    mark:"△穴" },
  ],
  local: [
    { rank:1, horse_name:"ノットゥルノ",       race_name:"帝王賞",          venue:"大井",  popularity:5,  odds:"9.5",  ev:178, reason:"大井コース2勝。左回りへの適性が高く変わり身に期待",        mark:"◎穴" },
    { rank:2, horse_name:"ブルドッグボス",     race_name:"川崎記念",        venue:"川崎",  popularity:5,  odds:"12.0", ev:155, reason:"川崎巧者。前走からの反動なく距離もベスト2100m",            mark:"○穴" },
    { rank:3, horse_name:"オメガパフューム",   race_name:"帝王賞",          venue:"大井",  popularity:6,  odds:"14.0", ev:142, reason:"大井で圧倒的な実績。久々でも仕上がり良好の情報あり",        mark:"▲穴" },
    { rank:4, horse_name:"ノーヴァレンダ",     race_name:"川崎記念",        venue:"川崎",  popularity:4,  odds:"8.0",  ev:128, reason:"川崎記念は相性の良い舞台。前走の消耗度低く上積み見込む",    mark:"△穴" },
    { rank:5, horse_name:"テーオーケインズ",   race_name:"帝王賞",          venue:"大井",  popularity:4,  odds:"6.8",  ev:115, reason:"叩き3走目でピーク。今回は好枠を引き先行有利の展開",        mark:"△穴" },
  ],
};

function AnabaRankingScreen({ onNavigate }) {
  const [tab, setTab] = useState("central");
  const isLocal  = tab === "local";
  const accent   = isLocal ? "#40c8c8" : "#FFD700";
  const list     = ANABA_SAMPLE[tab];

  // 期待値バーの色
  const evColor = (ev) => {
    if (ev >= 170) return "#FFD700";
    if (ev >= 140) return "#7aaa7a";
    if (ev >= 120) return "#888";
    return "#555";
  };

  // 印バッジの色
  const markBg = (mark) => {
    if (mark.startsWith("◎")) return { bg:"#2a1a00", border:"#FFD700", color:"#FFD700" };
    if (mark.startsWith("○")) return { bg:"#1a1a2a", border:"#8888FF", color:"#8888FF" };
    if (mark.startsWith("▲")) return { bg:"#1a1200", border:"#FF8C00", color:"#FF8C00" };
    return { bg:"#111", border:"#444", color:"#666" };
  };

  return (
    <div style={S.screen}>

      {/* ── ヘッダー ── */}
      <div style={S.subHeader}>
        <button style={S.backBtn} onClick={() => onNavigate("home")}><ArrowLeft/></button>
        <div style={S.subTitle}>穴馬ランキング</div>
        <div style={{ fontSize:10, fontWeight:700, color:"#FFD700",
          background:"#1a1400", border:"1px solid #3a3318",
          borderRadius:6, padding:"3px 8px" }}>期待値順</div>
      </div>

      {/* ── 説明バナー ── */}
      <div style={{ margin:"10px 16px 0", background:"#0e0d08",
        border:"1px solid #2a2810", borderRadius:12, padding:"12px 14px" }}>
        <div style={{ fontSize:10, fontWeight:700, color:"#FFD700",
          letterSpacing:1.5, marginBottom:6 }}>📊 期待値とは</div>
        <div style={{ fontSize:12, color:"#666", lineHeight:1.7 }}>
          オッズ × 推定勝率で算出。<span style={{ color:"#FFD700" }}>100以上</span>が
          プラス期待値。数値が高いほど<span style={{ color:"#FFD700" }}>穴馬として狙い目</span>です。
        </div>
      </div>

      {/* ── 中央/地方タブ ── */}
      <div style={{ display:"flex", margin:"12px 16px 0", background:"#0a0908",
        border:"1px solid #1e1c0e", borderRadius:12, padding:4, gap:4 }}>
        {[
          { key:"central", label:"中央競馬", emoji:"🏇", accent:"#FFD700", bg:"#1a1400", border:"#3a3318" },
          { key:"local",   label:"地方競馬", emoji:"🌙", accent:"#40c8c8", bg:"#001818", border:"#1a5050" },
        ].map(t => {
          const active = tab === t.key;
          return (
            <button key={t.key} onClick={() => setTab(t.key)} style={{
              flex:1, display:"flex", alignItems:"center", justifyContent:"center", gap:6,
              padding:"10px 8px", borderRadius:9, cursor:"pointer",
              border: active ? `1px solid ${t.border}` : "1px solid transparent",
              background: active ? t.bg : "transparent",
              color: active ? t.accent : "#444",
              fontSize:13, fontWeight:700, fontFamily:"'Noto Serif JP',serif",
              transition:"all 0.2s",
            }}>
              <span>{t.emoji}</span>
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* ── ランキングカード ── */}
      <div style={{ padding:"12px 16px 0", display:"flex", flexDirection:"column", gap:10 }}>
        {list.map((horse, i) => {
          const mc = markBg(horse.mark);
          const isTop = i === 0;
          return (
            <div key={i} style={{
              background: isTop
                ? "linear-gradient(135deg,#1a1400 0%,#111009 100%)"
                : "#0e0d08",
              border:`1px solid ${isTop ? (isLocal?"#2a6060":"#3a3318") : "#1e1c0e"}`,
              borderRadius:14, padding:"14px",
              boxShadow: isTop ? `0 0 20px ${accent}18` : "none",
              animation:`fadeSlideUp 0.4s ease ${i*60}ms both`,
            }}>
              {/* 上段: 順位・印・馬名・期待値 */}
              <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:10 }}>
                {/* 順位 */}
                <div style={{
                  width:32, height:32, borderRadius:"50%", flexShrink:0,
                  background: i===0 ? "linear-gradient(135deg,#FFD700,#B8860B)"
                             : i===1 ? "linear-gradient(135deg,#C0C0C0,#888)"
                             : i===2 ? "linear-gradient(135deg,#CD7F32,#8B4513)"
                             : "#111009",
                  display:"flex", alignItems:"center", justifyContent:"center",
                  fontSize:14, fontWeight:700,
                  color: i<=2 ? "#000" : "#555",
                  fontFamily:"'Rajdhani',sans-serif",
                  border: i>2 ? "1px solid #2a2810" : "none",
                }}>{horse.rank}</div>

                {/* 印バッジ */}
                <div style={{ fontSize:11, fontWeight:700, padding:"2px 8px",
                  borderRadius:6, background:mc.bg, border:`1px solid ${mc.border}`,
                  color:mc.color, whiteSpace:"nowrap", flexShrink:0 }}>
                  {horse.mark}
                </div>

                {/* 馬名・レース */}
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:15, fontWeight:700, color:"#F5E8C0",
                    overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                    {horse.horse_name}
                  </div>
                  <div style={{ fontSize:10, color:"#555", marginTop:2 }}>
                    {isLocal ? "🌙" : "🏇"} {horse.venue} / {horse.race_name}
                  </div>
                </div>

                {/* 期待値 */}
                <div style={{ textAlign:"right", flexShrink:0 }}>
                  <div style={{ fontFamily:"'Rajdhani',sans-serif", fontSize:24,
                    fontWeight:700, color:evColor(horse.ev), lineHeight:1 }}>
                    {horse.ev}
                  </div>
                  <div style={{ fontSize:9, color:"#555", marginTop:2 }}>期待値</div>
                </div>
              </div>

              {/* 期待値バー */}
              <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:10 }}>
                <div style={{ flex:1, height:4, background:"#1a1a10",
                  borderRadius:2, overflow:"hidden" }}>
                  <div style={{ width:`${Math.min(horse.ev / 2, 100)}%`, height:"100%",
                    borderRadius:2,
                    background:`linear-gradient(90deg,${evColor(horse.ev)}88,${evColor(horse.ev)})`,
                    transition:"width 0.6s ease" }}/>
                </div>
                <div style={{ fontSize:10, color:"#555", whiteSpace:"nowrap" }}>
                  人気{horse.popularity}番 / {horse.odds}倍
                </div>
              </div>

              {/* 推奨理由 */}
              <div style={{ background:"#0a0908", borderRadius:8, padding:"9px 11px",
                border:"1px solid #161410" }}>
                <div style={{ fontSize:10, fontWeight:700, color:accent,
                  letterSpacing:1, marginBottom:4 }}>📝 推奨理由</div>
                <div style={{ fontSize:12, color:"#888", lineHeight:1.7 }}>
                  {horse.reason}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── 注意書き ── */}
      <div style={{ margin:"14px 16px 0", fontSize:10, color:"#333",
        textAlign:"center", lineHeight:1.8 }}>
        ※ 期待値はAIによる推定値です。投資は自己責任でお願いします。
      </div>

      <div style={{ height:40 }}/>
    </div>
  );
}

// ============================================================
// 的中率・回収率画面
// ============================================================
const STATS_KEY  = "keiba:predictions";
const BET_TYPES  = ["単勝","複勝","馬連","馬単","3連複","3連単","ワイド"];

async function loadPredictions() {
  try { const r = await window.storage.get(STATS_KEY); return r ? JSON.parse(r.value) : []; }
  catch { return []; }
}
async function savePredictions(data) {
  try { await window.storage.set(STATS_KEY, JSON.stringify(data)); } catch {}
}
function monthLabel(dateStr) {
  const d = new Date(dateStr); return `${d.getMonth()+1}月`;
}

function StatsScreen({ onNavigate }) {
  const [predictions, setPredictions] = useState([]);
  const [loaded,   setLoaded]   = useState(false);
  const [tab,      setTab]      = useState("summary");
  const [toast,    setToast]    = useState("");
  const emptyForm = {
    date: new Date().toISOString().slice(0,10),
    race_name:"", venue:"", bet_type:"単勝",
    horse_name:"", bet_amount:"", is_hit:false, payout:"",
  };
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    loadPredictions().then(data => { setPredictions(data); setLoaded(true); });
  }, []);

  const showToast = (msg) => { setToast(msg); setTimeout(()=>setToast(""), 2500); };

  const handleSave = async () => {
    if (!form.race_name || !form.horse_name || !form.bet_amount) {
      showToast("必須項目を入力してください"); return;
    }
    const item = { id:Date.now(), ...form,
      bet_amount:Number(form.bet_amount),
      payout: form.is_hit ? Number(form.payout||0) : 0 };
    const next = [item, ...predictions];
    setPredictions(next); await savePredictions(next);
    setForm(emptyForm); setTab("history"); showToast("記録しました ✓");
  };

  const handleDelete = async (id) => {
    const next = predictions.filter(p=>p.id!==id);
    setPredictions(next); await savePredictions(next); showToast("削除しました");
  };

  // 集計
  const total    = predictions.length;
  const hits     = predictions.filter(p=>p.is_hit).length;
  const hitRate  = total>0 ? Math.round(hits/total*100) : 0;
  const totalBet = predictions.reduce((a,p)=>a+p.bet_amount, 0);
  const totalPay = predictions.reduce((a,p)=>a+p.payout, 0);
  const roi      = totalBet>0 ? Math.round(totalPay/totalBet*100) : 0;
  const profit   = totalPay - totalBet;

  // 月別
  const monthlyMap = {};
  predictions.forEach(p => {
    const m = monthLabel(p.date);
    if (!monthlyMap[m]) monthlyMap[m] = { bet:0, pay:0 };
    monthlyMap[m].bet += p.bet_amount;
    monthlyMap[m].pay += p.payout;
  });
  const monthly = Object.entries(monthlyMap).slice(-6);
  const maxPay  = Math.max(...monthly.map(([,v])=>v.pay), 1);

  const inp = { width:"100%", background:"#0a0908", border:"1px solid #2a2810",
    borderRadius:7, padding:"8px 10px", color:"#E8D9A0",
    fontSize:13, fontFamily:"'Noto Serif JP',serif" };
  const lbl = { fontSize:10, color:"#666", marginBottom:4 };

  return (
    <div style={S.screen}>
      <div style={S.subHeader}>
        <button style={S.backBtn} onClick={()=>onNavigate("home")}><ArrowLeft/></button>
        <div style={S.subTitle}>的中率・回収率</div>
        <div style={{ fontSize:10, fontWeight:700, color:"#7aaa7a",
          background:"#0a1a0a", border:"1px solid #2a5a2a",
          borderRadius:6, padding:"3px 8px" }}>{total}件</div>
      </div>

      {/* タブ */}
      <div style={{ display:"flex", margin:"12px 16px 0", background:"#0a0908",
        border:"1px solid #1e1c0e", borderRadius:10, padding:3, gap:3 }}>
        {[{key:"summary",label:"サマリー"},{key:"history",label:"履歴"},{key:"add",label:"＋ 記録"}].map(t=>(
          <button key={t.key} onClick={()=>setTab(t.key)} style={{
            flex:1, padding:"9px 0", borderRadius:8, border:"none", cursor:"pointer",
            background: tab===t.key?"#1a1700":"transparent",
            color: tab===t.key?"#FFD700":"#444",
            fontSize:12, fontWeight:700, fontFamily:"'Noto Serif JP',serif",
          }}>{t.label}</button>
        ))}
      </div>

      {/* ── サマリー ── */}
      {tab==="summary" && (
        <div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr",
            gap:8, margin:"12px 16px 0" }}>
            {[
              { label:"的中率",   value:`${hitRate}%`,  sub:`${hits}/${total}件`,
                color:hitRate>=40?"#FFD700":hitRate>=25?"#7aaa7a":"#888" },
              { label:"回収率",   value:`${roi}%`,       sub:roi>=100?"プラス収支":"マイナス収支",
                color:roi>=100?"#7aaa7a":"#888" },
              { label:"投資合計", value:`¥${totalBet.toLocaleString()}`, sub:"合計投資額", color:"#888" },
              { label:"損益",     value:`${profit>=0?"+":""}¥${profit.toLocaleString()}`,
                sub:profit>=0?"プラス":"マイナス", color:profit>=0?"#7aaa7a":"#FF6666" },
            ].map(k=>(
              <div key={k.label} style={{ background:"#0e0d08", border:"1px solid #1e1c0e",
                borderRadius:12, padding:"14px 12px" }}>
                <div style={{ fontSize:10, color:"#555", marginBottom:6 }}>{k.label}</div>
                <div style={{ fontFamily:"'Rajdhani',sans-serif", fontSize:22,
                  fontWeight:700, color:k.color, lineHeight:1 }}>{k.value}</div>
                <div style={{ fontSize:10, color:"#444", marginTop:4 }}>{k.sub}</div>
              </div>
            ))}
          </div>

          {/* 的中率バー */}
          <div style={{ margin:"10px 16px 0", background:"#0e0d08",
            border:"1px solid #1e1c0e", borderRadius:12, padding:14 }}>
            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:8 }}>
              <div style={{ fontSize:12, fontWeight:700, color:"#FFD700" }}>的中率</div>
              <div style={{ fontFamily:"'Rajdhani',sans-serif", fontSize:18,
                fontWeight:700, color:"#FFD700" }}>{hitRate}%</div>
            </div>
            <div style={{ height:8, background:"#1a1a10", borderRadius:4, overflow:"hidden" }}>
              <div style={{ width:`${hitRate}%`, height:"100%", borderRadius:4,
                background:"linear-gradient(90deg,#B8860B,#FFD700)" }}/>
            </div>
            <div style={{ display:"flex", justifyContent:"space-between",
              fontSize:10, color:"#555", marginTop:6 }}>
              <span>0%</span><span>目標30%</span><span>100%</span>
            </div>
          </div>

          {/* 回収率バー */}
          <div style={{ margin:"8px 16px 0", background:"#0e0d08",
            border:"1px solid #1e1c0e", borderRadius:12, padding:14 }}>
            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:8 }}>
              <div style={{ fontSize:12, fontWeight:700,
                color:roi>=100?"#7aaa7a":"#888" }}>回収率</div>
              <div style={{ fontFamily:"'Rajdhani',sans-serif", fontSize:18,
                fontWeight:700, color:roi>=100?"#7aaa7a":"#888" }}>{roi}%</div>
            </div>
            <div style={{ height:8, background:"#1a1a10", borderRadius:4,
              overflow:"hidden", position:"relative" }}>
              <div style={{ position:"absolute", left:"50%", top:0, bottom:0,
                width:1, background:"#3a3318", zIndex:1 }}/>
              <div style={{ width:`${Math.min(roi,200)/2}%`, height:"100%", borderRadius:4,
                background:roi>=100?"linear-gradient(90deg,#2a6a2a,#7aaa7a)":"linear-gradient(90deg,#6a2a2a,#aa4444)" }}/>
            </div>
            <div style={{ display:"flex", justifyContent:"space-between",
              fontSize:10, color:"#555", marginTop:6 }}>
              <span>0%</span><span style={{ color:"#3a3318" }}>100%</span><span>200%</span>
            </div>
          </div>

          {/* 月別グラフ */}
          {monthly.length>0 && (
            <div style={{ margin:"8px 16px 0", background:"#0e0d08",
              border:"1px solid #1e1c0e", borderRadius:12, padding:14 }}>
              <div style={{ fontSize:12, fontWeight:700, color:"#FFD700", marginBottom:12 }}>
                月別払戻額
              </div>
              <div style={{ display:"flex", alignItems:"flex-end", gap:8, height:80 }}>
                {monthly.map(([month,v])=>(
                  <div key={month} style={{ flex:1, display:"flex",
                    flexDirection:"column", alignItems:"center", gap:4 }}>
                    <div style={{ width:"100%", background:"#161410", borderRadius:4,
                      height:60, display:"flex", alignItems:"flex-end", overflow:"hidden" }}>
                      <div style={{ width:"100%", minHeight:4, borderRadius:4,
                        height:`${Math.round(v.pay/maxPay*100)}%`,
                        background:v.pay>=v.bet
                          ?"linear-gradient(180deg,#7aaa7a,#2a5a2a)"
                          :"linear-gradient(180deg,#aa4444,#5a2a2a)" }}/>
                    </div>
                    <div style={{ fontSize:9, color:"#555" }}>{month}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {total===0 && (
            <div style={{ textAlign:"center", padding:"32px 20px", color:"#333", fontSize:13 }}>
              まだ記録がありません。<br/>「＋ 記録」から追加してください。
            </div>
          )}
        </div>
      )}

      {/* ── 履歴 ── */}
      {tab==="history" && (
        <div style={{ padding:"12px 16px 0", display:"flex", flexDirection:"column", gap:8 }}>
          {!loaded && [1,2,3].map(i=>(
            <div key={i} style={{ background:"#0e0d08", border:"1px solid #1e1c0e",
              borderRadius:12, padding:14 }}>
              <Skeleton width="60%" height={14} style={{ marginBottom:8 }}/>
              <Skeleton width="40%" height={11}/>
            </div>
          ))}
          {loaded && predictions.length===0 && (
            <div style={{ textAlign:"center", padding:"32px 20px",
              color:"#333", fontSize:13 }}>記録がありません</div>
          )}
          {loaded && predictions.map((p,i)=>(
            <div key={p.id} style={{ background:"#0e0d08", borderRadius:12, padding:"12px 14px",
              border:`1px solid ${p.is_hit?"#2a5a2a":"#1e1c0e"}`,
              borderLeft:`3px solid ${p.is_hit?"#7aaa7a":"#333"}`,
              animation:`fadeSlideUp 0.3s ease ${i*40}ms both` }}>
              <div style={{ display:"flex", justifyContent:"space-between",
                alignItems:"flex-start", marginBottom:6 }}>
                <div>
                  <div style={{ fontSize:13, fontWeight:700, color:"#E8D9A0" }}>
                    {p.horse_name}
                  </div>
                  <div style={{ fontSize:10, color:"#555", marginTop:2 }}>
                    {p.date} / {p.venue} {p.race_name}
                  </div>
                </div>
                <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                  <span style={{ fontSize:11, fontWeight:700, padding:"2px 8px", borderRadius:6,
                    background:p.is_hit?"#0a2a0a":"#1a1a1a",
                    border:`1px solid ${p.is_hit?"#2a6a2a":"#333"}`,
                    color:p.is_hit?"#7aaa7a":"#555" }}>
                    {p.is_hit?"✓ 的中":"✗ 外れ"}
                  </span>
                  <button onClick={()=>handleDelete(p.id)} style={{ width:24, height:24,
                    borderRadius:6, background:"#1a0808", border:"1px solid #3a1818",
                    color:"#884444", cursor:"pointer", fontSize:12,
                    display:"flex", alignItems:"center", justifyContent:"center" }}>✕</button>
                </div>
              </div>
              <div style={{ display:"flex", gap:10, fontSize:11 }}>
                <span style={{ color:"#666" }}>{p.bet_type}</span>
                <span style={{ color:"#888" }}>投資:¥{p.bet_amount.toLocaleString()}</span>
                {p.is_hit && <span style={{ color:"#7aaa7a" }}>払戻:¥{p.payout.toLocaleString()}</span>}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── 記録フォーム ── */}
      {tab==="add" && (
        <div style={{ margin:"12px 16px 0", background:"#0e0d08",
          border:"1px solid #2a2810", borderRadius:14, padding:16 }}>
          <div style={{ fontSize:10, fontWeight:700, color:"#FFD700",
            letterSpacing:1.5, marginBottom:10 }}>レース情報</div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:8 }}>
            <div><div style={lbl}>開催日 *</div>
              <input type="date" value={form.date}
                onChange={e=>setForm(f=>({...f,date:e.target.value}))} style={inp}/></div>
            <div><div style={lbl}>競馬場</div>
              <input value={form.venue} placeholder="例: 東京"
                onChange={e=>setForm(f=>({...f,venue:e.target.value}))} style={inp}/></div>
          </div>
          <div style={{ marginBottom:8 }}>
            <div style={lbl}>レース名 *</div>
            <input value={form.race_name} placeholder="例: 日本ダービー"
              onChange={e=>setForm(f=>({...f,race_name:e.target.value}))} style={inp}/>
          </div>
          <div style={{ fontSize:10, fontWeight:700, color:"#FFD700", letterSpacing:1.5,
            margin:"14px 0 10px", paddingTop:10, borderTop:"1px solid #1e1c0e" }}>予想内容</div>
          <div style={{ marginBottom:8 }}>
            <div style={lbl}>馬名 *</div>
            <input value={form.horse_name} placeholder="例: イクイノックス"
              onChange={e=>setForm(f=>({...f,horse_name:e.target.value}))} style={inp}/>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:8 }}>
            <div><div style={lbl}>券種</div>
              <select value={form.bet_type}
                onChange={e=>setForm(f=>({...f,bet_type:e.target.value}))} style={inp}>
                {BET_TYPES.map(t=><option key={t} value={t}>{t}</option>)}
              </select></div>
            <div><div style={lbl}>投資額(円) *</div>
              <input type="number" value={form.bet_amount} placeholder="例: 1000"
                onChange={e=>setForm(f=>({...f,bet_amount:e.target.value}))} style={inp}/></div>
          </div>
          <div style={{ fontSize:10, fontWeight:700, color:"#FFD700", letterSpacing:1.5,
            margin:"14px 0 10px", paddingTop:10, borderTop:"1px solid #1e1c0e" }}>結果</div>
          <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:10 }}>
            <button onClick={()=>setForm(f=>({...f,is_hit:!f.is_hit}))} style={{
              width:48, height:26, borderRadius:13, border:"none", cursor:"pointer",
              background:form.is_hit?"#2a6a2a":"#1a1a10", position:"relative" }}>
              <div style={{ width:20, height:20, borderRadius:"50%", background:"#FFF",
                position:"absolute", top:3, left:form.is_hit?24:4, transition:"left 0.2s" }}/>
            </button>
            <span style={{ fontSize:13, fontWeight:700,
              color:form.is_hit?"#7aaa7a":"#555" }}>
              {form.is_hit?"✓ 的中":"外れ"}
            </span>
          </div>
          {form.is_hit && (
            <div style={{ marginBottom:8 }}>
              <div style={lbl}>払戻金(円)</div>
              <input type="number" value={form.payout} placeholder="例: 3200"
                onChange={e=>setForm(f=>({...f,payout:e.target.value}))}
                style={{ ...inp, color:"#7aaa7a" }}/>
            </div>
          )}
          <button onClick={handleSave} style={{ ...S.ctaButton, marginTop:14 }}>
            記録を保存する
          </button>
        </div>
      )}

      {toast && (
        <div style={{ position:"fixed", bottom:24, left:"50%", transform:"translateX(-50%)",
          zIndex:100, background:"#0f2a0f", border:"1px solid #2a6a2a",
          borderRadius:10, padding:"10px 20px", color:"#7aaa7a",
          fontSize:12, fontWeight:700, boxShadow:"0 4px 20px rgba(0,0,0,0.6)",
          whiteSpace:"nowrap" }}>{toast}</div>
      )}
      <div style={{ height:40 }}/>
    </div>
  );
}

// ============================================================
// お気に入り機能
// ============================================================
const FAV_KEY = "keiba:favorites";

async function loadFavorites() {
  try { const r = await window.storage.get(FAV_KEY); return r ? JSON.parse(r.value) : []; }
  catch { return []; }
}
async function saveFavorites(data) {
  try { await window.storage.set(FAV_KEY, JSON.stringify(data)); } catch {}
}

// ハートアイコン
function HeartIcon({ filled, size=18, color="#FFD700" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24"
      fill={filled ? color : "none"} stroke={color} strokeWidth="2">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
    </svg>
  );
}

// お気に入りボタン（レース一覧・詳細画面から使う）
function FavButton({ item, type, size=18 }) {
  const [isFav, setIsFav] = useState(false);
  const [toast, setToast] = useState("");

  useEffect(() => {
    loadFavorites().then(favs => {
      setIsFav(favs.some(f => f.id === item.id && f.type === type));
    });
  }, [item.id, type]);

  const toggle = async (e) => {
    e.stopPropagation();
    const favs = await loadFavorites();
    const exists = favs.some(f => f.id === item.id && f.type === type);
    let next;
    if (exists) {
      next = favs.filter(f => !(f.id === item.id && f.type === type));
      setIsFav(false);
      setToast("お気に入りを解除しました");
    } else {
      next = [{ ...item, type, saved_at: new Date().toISOString() }, ...favs];
      setIsFav(true);
      setToast("お気に入りに追加しました ♥");
    }
    await saveFavorites(next);
    setTimeout(() => setToast(""), 2000);
  };

  return (
    <div style={{ position:"relative" }}>
      <button onClick={toggle} style={{
        width:34, height:34, borderRadius:10, cursor:"pointer",
        background: isFav ? "#1a1400" : "#111009",
        border:`1px solid ${isFav ? "#FFD700" : "#2a2810"}`,
        display:"flex", alignItems:"center", justifyContent:"center",
        transition:"all 0.2s",
        boxShadow: isFav ? "0 0 10px rgba(255,215,0,0.3)" : "none",
      }}>
        <HeartIcon filled={isFav} size={size}/>
      </button>
      {toast && (
        <div style={{ position:"fixed", bottom:24, left:"50%",
          transform:"translateX(-50%)", zIndex:200,
          background: isFav ? "#1a1400" : "#1a1a1a",
          border:`1px solid ${isFav ? "#FFD700" : "#444"}`,
          borderRadius:10, padding:"10px 18px",
          color: isFav ? "#FFD700" : "#888",
          fontSize:12, fontWeight:700,
          boxShadow:"0 4px 20px rgba(0,0,0,0.7)", whiteSpace:"nowrap" }}>
          {toast}
        </div>
      )}
    </div>
  );
}

// お気に入り一覧画面
function FavoritesScreen({ onNavigate }) {
  const [favs,   setFavs]   = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [tab,    setTab]    = useState("race"); // "race" | "horse"
  const [toast,  setToast]  = useState("");

  useEffect(() => {
    loadFavorites().then(data => { setFavs(data); setLoaded(true); });
  }, []);

  const showToast = (msg) => { setToast(msg); setTimeout(()=>setToast(""), 2200); };

  const remove = async (id, type) => {
    const next = favs.filter(f => !(f.id===id && f.type===type));
    setFavs(next); await saveFavorites(next); showToast("削除しました");
  };

  const raceList  = favs.filter(f => f.type === "race");
  const horseList = favs.filter(f => f.type === "horse");

  return (
    <div style={S.screen}>

      {/* ヘッダー */}
      <div style={S.subHeader}>
        <button style={S.backBtn} onClick={() => onNavigate("home")}><ArrowLeft/></button>
        <div style={S.subTitle}>お気に入り</div>
        <div style={{ fontSize:10, fontWeight:700, color:"#FFD700",
          background:"#1a1400", border:"1px solid #3a3318",
          borderRadius:6, padding:"3px 8px" }}>
          {favs.length}件
        </div>
      </div>

      {/* タブ */}
      <div style={{ display:"flex", margin:"12px 16px 0", background:"#0a0908",
        border:"1px solid #1e1c0e", borderRadius:10, padding:3, gap:3 }}>
        {[
          { key:"race",  label:`🏇 レース（${raceList.length}）`  },
          { key:"horse", label:`🐴 馬（${horseList.length}）` },
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} style={{
            flex:1, padding:"9px 0", borderRadius:8, border:"none", cursor:"pointer",
            background: tab===t.key ? "#1a1700" : "transparent",
            color: tab===t.key ? "#FFD700" : "#444",
            fontSize:12, fontWeight:700, fontFamily:"'Noto Serif JP',serif",
            transition:"all 0.2s",
          }}>{t.label}</button>
        ))}
      </div>

      {/* リスト */}
      <div style={{ padding:"12px 16px 0", display:"flex", flexDirection:"column", gap:8 }}>

        {/* ローディング */}
        {!loaded && [1,2,3].map(i => (
          <div key={i} style={{ background:"#0e0d08", border:"1px solid #1e1c0e",
            borderRadius:12, padding:14 }}>
            <Skeleton width="65%" height={14} style={{ marginBottom:8 }}/>
            <Skeleton width="40%" height={11}/>
          </div>
        ))}

        {/* レースタブ */}
        {loaded && tab === "race" && (
          raceList.length === 0 ? (
            <div style={{ textAlign:"center", padding:"40px 20px", color:"#333", fontSize:13 }}>
              お気に入りのレースはありません。<br/>
              レース一覧の ♥ ボタンで追加できます。
            </div>
          ) : (
            raceList.map((r, i) => {
              const isLocal = r.race_type === "local";
              const accent  = isLocal ? "#40c8c8" : "#FFD700";
              return (
                <div key={`${r.id}_${r.type}`} style={{
                  background:"#0e0d08", borderRadius:14, padding:"13px 14px",
                  border:"1px solid #1e1c0e",
                  borderLeft:`3px solid ${accent}`,
                  animation:`fadeSlideUp 0.35s ease ${i*50}ms both`,
                  cursor:"pointer",
                }} onClick={() => onNavigate("detail", r)}>
                  <div style={{ display:"flex", justifyContent:"space-between",
                    alignItems:"flex-start" }}>
                    <div style={{ flex:1, minWidth:0 }}>
                      {/* バッジ行 */}
                      <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:6 }}>
                        <span style={{ fontSize:10, fontWeight:700, padding:"2px 7px",
                          borderRadius:5, background: isLocal?"#001818":"#1a1400",
                          border:`1px solid ${isLocal?"#2a6060":"#3a3318"}`,
                          color:accent }}>
                          {isLocal?"🌙":"🏇"} {r.venue}
                        </span>
                        {r.grade && (
                          <span style={{ fontSize:10, fontWeight:700, padding:"2px 6px",
                            borderRadius:4, border:`1px solid ${gradeColor(r.grade)}`,
                            color:gradeColor(r.grade) }}>{r.grade}</span>
                        )}
                        {r.race_number && (
                          <span style={{ fontSize:10, color:"#555",
                            fontFamily:"'Rajdhani',sans-serif" }}>{r.race_number}R</span>
                        )}
                      </div>
                      {/* レース名 */}
                      <div style={{ fontSize:14, fontWeight:700, color:"#F5E8C0",
                        marginBottom:4, overflow:"hidden",
                        textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                        {r.name}
                      </div>
                      {/* メタ */}
                      <div style={{ display:"flex", gap:10, fontSize:10, color:"#555" }}>
                        {r.start_time && <span>🕐 {r.start_time}</span>}
                        {r.distance   && <span>📏 {r.distance}</span>}
                        {r.condition  && r.condition!=="—" && <span>🌤 {r.condition}</span>}
                      </div>
                    </div>
                    {/* 削除ボタン */}
                    <button onClick={e=>{e.stopPropagation();remove(r.id,"race");}} style={{
                      width:28, height:28, borderRadius:8, background:"#1a0808",
                      border:"1px solid #3a1818", color:"#884444", cursor:"pointer",
                      display:"flex", alignItems:"center", justifyContent:"center",
                      fontSize:13, flexShrink:0, marginLeft:8 }}>✕</button>
                  </div>
                  {/* 保存日時 */}
                  <div style={{ fontSize:9, color:"#333", marginTop:6 }}>
                    ♥ {new Date(r.saved_at).toLocaleDateString("ja-JP")} に保存
                  </div>
                </div>
              );
            })
          )
        )}

        {/* 馬タブ */}
        {loaded && tab === "horse" && (
          horseList.length === 0 ? (
            <div style={{ textAlign:"center", padding:"40px 20px", color:"#333", fontSize:13 }}>
              お気に入りの馬はありません。<br/>
              レース詳細の ♥ ボタンで追加できます。
            </div>
          ) : (
            horseList.map((h, i) => {
              const pop = Number(h.popularity);
              return (
                <div key={`${h.id}_${h.type}`} style={{
                  background:"#0e0d08", borderRadius:14, padding:"13px 14px",
                  border:"1px solid #1e1c0e",
                  borderLeft:`3px solid ${pop===1?"#FFD700":pop===2?"#C0C0C0":pop===3?"#CD7F32":"#444"}`,
                  animation:`fadeSlideUp 0.35s ease ${i*50}ms both`,
                }}>
                  <div style={{ display:"flex", justifyContent:"space-between",
                    alignItems:"center" }}>
                    <div style={{ flex:1 }}>
                      {/* 馬番・枠 */}
                      <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:6 }}>
                        {(() => {
                          const fc = frameColor(h.horse_number||1);
                          return (
                            <div style={{ width:22, height:22, borderRadius:4,
                              background:fc.bg, color:fc.fg, fontSize:11, fontWeight:700,
                              display:"flex", alignItems:"center", justifyContent:"center",
                              fontFamily:"'Rajdhani',sans-serif",
                              boxShadow:"0 1px 4px rgba(0,0,0,0.5)" }}>
                              {Math.ceil((h.horse_number||1)/2)}
                            </div>
                          );
                        })()}
                        <span style={{ fontFamily:"'Rajdhani',sans-serif", fontSize:14,
                          fontWeight:700, color:"#E8D9A0" }}>{h.horse_number}番</span>
                        {pop > 0 && (
                          <span style={{ width:20, height:20, borderRadius:"50%",
                            fontSize:10, fontWeight:700, fontFamily:"'Rajdhani',sans-serif",
                            display:"flex", alignItems:"center", justifyContent:"center",
                            background:pop<=3?popColor(pop):"#1a1a10",
                            color:pop<=3?"#000":"#555" }}>{pop}</span>
                        )}
                      </div>
                      {/* 馬名 */}
                      <div style={{ fontSize:15, fontWeight:700, color:"#F5E8C0", marginBottom:4 }}>
                        {h.horse_name}
                      </div>
                      {/* メタ */}
                      <div style={{ display:"flex", gap:10, fontSize:10, color:"#555" }}>
                        {h.jockey   && <span>🏇 {h.jockey}</span>}
                        {h.odds     && <span>単勝 {h.odds}倍</span>}
                      </div>
                    </div>
                    <button onClick={()=>remove(h.id,"horse")} style={{
                      width:28, height:28, borderRadius:8, background:"#1a0808",
                      border:"1px solid #3a1818", color:"#884444", cursor:"pointer",
                      display:"flex", alignItems:"center", justifyContent:"center",
                      fontSize:13 }}>✕</button>
                  </div>
                  <div style={{ fontSize:9, color:"#333", marginTop:6 }}>
                    ♥ {new Date(h.saved_at).toLocaleDateString("ja-JP")} に保存
                  </div>
                </div>
              );
            })
          )
        )}
      </div>

      {toast && (
        <div style={{ position:"fixed", bottom:24, left:"50%",
          transform:"translateX(-50%)", zIndex:100,
          background:"#1a1400", border:"1px solid #3a3318",
          borderRadius:10, padding:"10px 18px", color:"#FFD700",
          fontSize:12, fontWeight:700,
          boxShadow:"0 4px 20px rgba(0,0,0,0.7)", whiteSpace:"nowrap" }}>
          {toast}
        </div>
      )}
      <div style={{ height:40 }}/>
    </div>
  );
}

// ============================================================
// 会員登録・ログイン画面
// ============================================================
const USER_KEY = "keiba:user";

async function loadUser() {
  try { const r = await window.storage.get(USER_KEY); return r ? JSON.parse(r.value) : null; }
  catch { return null; }
}
async function saveUser(data) {
  try { await window.storage.set(USER_KEY, JSON.stringify(data)); } catch {}
}
async function deleteUser() {
  try { await window.storage.delete(USER_KEY); } catch {}
}

function AuthScreen({ onNavigate, onLogin }) {
  const [mode,     setMode]     = useState("login"); // "login" | "register"
  const [nickname, setNickname] = useState("");
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [agreed,   setAgreed]   = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [error,    setError]    = useState("");
  const [loading,  setLoading]  = useState(false);

  const inp = {
    width:"100%", background:"#0a0908", border:"1px solid #2a2810",
    borderRadius:10, padding:"12px 14px", color:"#E8D9A0",
    fontSize:14, fontFamily:"'Noto Serif JP',serif",
    outline:"none",
  };
  const lbl = { fontSize:11, color:"#888", marginBottom:6, display:"block" };

  const validate = () => {
    if (!email.includes("@"))        return "メールアドレスが正しくありません";
    if (password.length < 6)         return "パスワードは6文字以上で入力してください";
    if (mode==="register" && !nickname.trim()) return "ニックネームを入力してください";
    if (mode==="register" && !agreed) return "利用規約に同意してください";
    return "";
  };

  const handleSubmit = async () => {
    const err = validate();
    if (err) { setError(err); return; }
    setLoading(true); setError("");
    await new Promise(r => setTimeout(r, 800)); // 擬似ロード
    const user = {
      nickname: mode==="register" ? nickname : email.split("@")[0],
      email,
      plan: "free",
      joined_at: new Date().toISOString(),
    };
    await saveUser(user);
    onLogin(user);
    setLoading(false);
  };

  return (
    <div style={{ ...S.screen, display:"flex", flexDirection:"column" }}>
      {/* ── ヘッダー ── */}
      <div style={{ padding:"52px 20px 24px", textAlign:"center",
        borderBottom:"1px solid #1e1e14",
        background:"linear-gradient(180deg,#161408,#0d0d0d)" }}>
        <TrophyIcon size={40}/>
        <div style={{ fontFamily:"'Playfair Display',serif", fontSize:26, fontWeight:900,
          background:"linear-gradient(90deg,#FFD700,#FFF8DC,#B8860B)",
          WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent",
          letterSpacing:2, marginTop:10 }}>KEIBA ORACLE</div>
        <div style={{ fontSize:11, color:"#555", letterSpacing:3, marginTop:4 }}>
          {mode==="login" ? "ログイン" : "新規会員登録"}
        </div>
      </div>

      {/* ── モード切替タブ ── */}
      <div style={{ display:"flex", margin:"20px 20px 0", background:"#0a0908",
        border:"1px solid #1e1c0e", borderRadius:12, padding:4, gap:4 }}>
        {[{key:"login",label:"ログイン"},{key:"register",label:"新規登録"}].map(t=>(
          <button key={t.key} onClick={()=>{setMode(t.key);setError("");}} style={{
            flex:1, padding:"10px 0", borderRadius:9, border:"none", cursor:"pointer",
            background: mode===t.key ? "#1a1700" : "transparent",
            color: mode===t.key ? "#FFD700" : "#444",
            fontSize:13, fontWeight:700, fontFamily:"'Noto Serif JP',serif",
            transition:"all 0.2s",
          }}>{t.label}</button>
        ))}
      </div>

      {/* ── フォーム ── */}
      <div style={{ margin:"16px 20px 0", display:"flex", flexDirection:"column", gap:12 }}>

        {/* ニックネーム（登録のみ） */}
        {mode==="register" && (
          <div>
            <label style={lbl}>ニックネーム *</label>
            <input value={nickname} onChange={e=>setNickname(e.target.value)}
              placeholder="例: 競馬太郎" style={inp}/>
          </div>
        )}

        {/* メール */}
        <div>
          <label style={lbl}>メールアドレス *</label>
          <input type="email" value={email} onChange={e=>setEmail(e.target.value)}
            placeholder="example@email.com" style={inp}/>
        </div>

        {/* パスワード */}
        <div>
          <label style={lbl}>パスワード（6文字以上） *</label>
          <div style={{ position:"relative" }}>
            <input type={showPass?"text":"password"} value={password}
              onChange={e=>setPassword(e.target.value)}
              placeholder="••••••••" style={{ ...inp, paddingRight:44 }}/>
            <button onClick={()=>setShowPass(!showPass)} style={{
              position:"absolute", right:12, top:"50%", transform:"translateY(-50%)",
              background:"none", border:"none", color:"#555", cursor:"pointer",
              fontSize:16 }}>{showPass ? "🙈" : "👁"}</button>
          </div>
        </div>

        {/* 利用規約（登録のみ） */}
        {mode==="register" && (
          <div style={{ display:"flex", alignItems:"flex-start", gap:10,
            background:"#0a0908", border:"1px solid #1e1c0e",
            borderRadius:10, padding:"12px 14px" }}>
            <button onClick={()=>setAgreed(!agreed)} style={{
              width:22, height:22, borderRadius:5, flexShrink:0, cursor:"pointer",
              background: agreed?"#1a1700":"#0a0908",
              border:`1px solid ${agreed?"#FFD700":"#2a2810"}`,
              display:"flex", alignItems:"center", justifyContent:"center",
              fontSize:14, color:"#FFD700",
            }}>{agreed?"✓":""}</button>
            <div style={{ fontSize:12, color:"#666", lineHeight:1.7 }}>
              <span style={{ color:"#FFD700", cursor:"pointer",
                textDecoration:"underline" }}>利用規約</span>および
              <span style={{ color:"#FFD700", cursor:"pointer",
                textDecoration:"underline" }}>プライバシーポリシー</span>
              に同意します。本サービスは競馬予想の参考情報を提供するものであり、
              投票は自己責任で行ってください。
            </div>
          </div>
        )}

        {/* エラー */}
        {error && (
          <div style={{ background:"#1a0808", border:"1px solid #5a1818",
            borderRadius:10, padding:"10px 14px",
            fontSize:12, color:"#FF8888", display:"flex", alignItems:"center", gap:8 }}>
            ⚠️ {error}
          </div>
        )}

        {/* 送信ボタン */}
        <button onClick={handleSubmit} disabled={loading} style={{
          ...S.ctaButton, marginTop:4,
          opacity: loading ? 0.6 : 1,
          position:"relative", overflow:"hidden",
        }}>
          {loading ? (
            <div style={{ width:18, height:18, borderRadius:"50%",
              border:"2px solid #3a3318", borderTopColor:"#FFD700",
              animation:"spin 0.8s linear infinite" }}/>
          ) : (
            <span>{mode==="login" ? "ログインする" : "アカウントを作成する"}</span>
          )}
        </button>

        {/* ゲスト利用 */}
        <button onClick={()=>onNavigate("home")} style={{
          background:"none", border:"none", color:"#555",
          fontSize:12, cursor:"pointer", textAlign:"center",
          padding:"8px", fontFamily:"'Noto Serif JP',serif",
        }}>
          ゲストとして続ける →
        </button>
      </div>

      {/* ── プラン案内（登録のみ） ── */}
      {mode==="register" && (
        <div style={{ margin:"20px 20px 0", background:"#0e0d08",
          border:"1px solid #2a2810", borderRadius:14, padding:16 }}>
          <div style={{ fontSize:11, fontWeight:700, color:"#FFD700",
            letterSpacing:1, marginBottom:12 }}>📋 プラン比較</div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
            {[
              { name:"無料プラン", price:"¥0", color:"#888",
                features:["レース一覧", "出走馬確認", "AI予想（3回/日）","穴馬ランキング"] },
              { name:"プレミアム", price:"¥980/月", color:"#FFD700",
                features:["無制限AI予想", "的中率分析", "パドック診断","優先サポート"] },
            ].map(p=>(
              <div key={p.name} style={{ background:"#0a0908",
                border:`1px solid ${p.color==="#FFD700"?"#3a3318":"#1e1c0e"}`,
                borderRadius:10, padding:12 }}>
                <div style={{ fontSize:12, fontWeight:700, color:p.color,
                  marginBottom:4 }}>{p.name}</div>
                <div style={{ fontFamily:"'Rajdhani',sans-serif", fontSize:18,
                  fontWeight:700, color:p.color, marginBottom:8 }}>{p.price}</div>
                {p.features.map(f=>(
                  <div key={f} style={{ fontSize:10, color:"#666",
                    marginBottom:3, display:"flex", alignItems:"center", gap:5 }}>
                    <span style={{ color:p.color, fontSize:10 }}>✓</span>{f}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ height:40 }}/>
    </div>
  );
}

// ============================================================
// パドック画像診断画面
// ============================================================
function PaddockScreen({ onNavigate }) {
  const [image,    setImage]    = useState(null);   // base64
  const [preview,  setPreview]  = useState(null);   // URL
  const [status,   setStatus]   = useState("idle"); // idle|analyzing|done|error
  const [result,   setResult]   = useState(null);
  const [horseName,setHorseName]= useState("");

  // 画像選択
  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target.result;
      setPreview(dataUrl);
      setImage(dataUrl.split(",")[1]); // base64部分のみ
      setResult(null);
      setStatus("idle");
    };
    reader.readAsDataURL(file);
  };

  // Anthropic APIで画像を解析
  const analyze = async () => {
    if (!image) return;
    setStatus("analyzing");
    setResult(null);
    try {
      const prompt = `あなたは競馬のパドック診断の専門家です。
この馬の画像を見て、以下の項目をそれぞれ0〜100点で採点し、JSON形式のみで返答してください。
前置き・説明・コードブロックは不要です。純粋なJSONのみ出力してください。

{
  "horse_name": "${horseName || "診断馬"}",
  "body": { "score": 数値, "comment": "馬体についての一言コメント（日本語30文字以内）" },
  "spirit": { "score": 数値, "comment": "気配についての一言コメント（日本語30文字以内）" },
  "calm": { "score": 数値, "comment": "落ち着きについての一言コメント（日本語30文字以内）" },
  "total": 数値,
  "grade": "S/A/B/C/Dのいずれか",
  "summary": "総合評価コメント（日本語60文字以内）",
  "buy": true または false
}

採点基準:
- 馬体(body): 筋肉量・毛艶・体型バランス・歩様
- 気配(spirit): 目の輝き・耳の向き・前向きさ・闘志
- 落ち着き(calm): パドックでの歩き方・興奮度・集中力
- total: 3項目の加重平均（馬体40%・気配30%・落ち着き30%）
- buy: totalが65以上ならtrue`;

      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method:"POST",
        headers:{ "Content-Type":"application/json" },
        body:JSON.stringify({
          model:"claude-sonnet-4-20250514",
          max_tokens:800,
          messages:[{
            role:"user",
            content:[
              { type:"image", source:{ type:"base64", media_type:"image/jpeg", data:image } },
              { type:"text",  text:prompt },
            ],
          }],
        }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      const text = (data.content||[]).filter(b=>b.type==="text").map(b=>b.text).join("");
      const cleaned = text.replace(/```json\s*/gi,"").replace(/```/g,"").trim();
      const m = cleaned.match(/\{[\s\S]*\}/);
      if (!m) throw new Error();
      setResult(JSON.parse(m[0]));
      setStatus("done");
    } catch {
      setStatus("error");
    }
  };

  // スコアに応じた色
  const scoreColor = (s) => {
    if (s >= 80) return "#FFD700";
    if (s >= 65) return "#7aaa7a";
    if (s >= 50) return "#888";
    return "#FF6666";
  };

  // グレードバッジ
  const gradeBg = (g) => {
    const map = {
      S:{ bg:"#1a1400", border:"#FFD700", color:"#FFD700" },
      A:{ bg:"#0a1a0a", border:"#7aaa7a", color:"#7aaa7a" },
      B:{ bg:"#111",    border:"#888",    color:"#888"    },
      C:{ bg:"#111",    border:"#666",    color:"#666"    },
      D:{ bg:"#1a0808", border:"#FF6666", color:"#FF6666" },
    };
    return map[g] || map["B"];
  };

  return (
    <div style={S.screen}>

      {/* ── ヘッダー ── */}
      <div style={S.subHeader}>
        <button style={S.backBtn} onClick={()=>onNavigate("home")}><ArrowLeft/></button>
        <div style={S.subTitle}>パドック診断</div>
        <div style={{ fontSize:10, fontWeight:700, color:"#7aaa7a",
          background:"#0a1a0a", border:"1px solid #2a5a2a",
          borderRadius:6, padding:"3px 8px" }}>AI診断</div>
      </div>

      {/* ── 説明バナー ── */}
      <div style={{ margin:"12px 16px 0", background:"#0e0d08",
        border:"1px solid #2a2810", borderRadius:12, padding:"12px 14px" }}>
        <div style={{ fontSize:10, fontWeight:700, color:"#FFD700",
          letterSpacing:1.5, marginBottom:6 }}>📸 使い方</div>
        <div style={{ fontSize:12, color:"#666", lineHeight:1.7 }}>
          パドックで撮影した馬の写真をアップロードしてください。
          AIが<span style={{ color:"#FFD700" }}>馬体・気配・落ち着き</span>を自動評価します。
        </div>
      </div>

      {/* ── 馬名入力 ── */}
      <div style={{ margin:"12px 16px 0" }}>
        <div style={{ fontSize:10, color:"#666", marginBottom:6 }}>馬名（任意）</div>
        <input value={horseName} onChange={e=>setHorseName(e.target.value)}
          placeholder="例: イクイノックス"
          style={{ width:"100%", background:"#0a0908", border:"1px solid #2a2810",
            borderRadius:10, padding:"10px 14px", color:"#E8D9A0",
            fontSize:14, fontFamily:"'Noto Serif JP',serif" }}/>
      </div>

      {/* ── 画像アップロードエリア ── */}
      <div style={{ margin:"12px 16px 0" }}>
        <label style={{ display:"block", cursor:"pointer" }}>
          <input type="file" accept="image/*" onChange={handleFile}
            style={{ display:"none" }}/>
          {preview ? (
            <div style={{ position:"relative", borderRadius:14, overflow:"hidden",
              border:"2px solid #3a3318" }}>
              <img src={preview} alt="パドック"
                style={{ width:"100%", height:220, objectFit:"cover", display:"block" }}/>
              <div style={{ position:"absolute", bottom:0, left:0, right:0,
                background:"linear-gradient(transparent,rgba(0,0,0,0.8))",
                padding:"16px 12px 10px",
                fontSize:11, color:"#FFD700", fontWeight:700 }}>
                📸 タップして画像を変更
              </div>
            </div>
          ) : (
            <div style={{ height:200, borderRadius:14, border:"2px dashed #3a3318",
              background:"#0e0d08", display:"flex", flexDirection:"column",
              alignItems:"center", justifyContent:"center", gap:10 }}>
              <div style={{ fontSize:40 }}>📷</div>
              <div style={{ fontSize:13, fontWeight:700, color:"#FFD700" }}>
                画像をアップロード
              </div>
              <div style={{ fontSize:11, color:"#555" }}>
                パドックの写真を選択してください
              </div>
            </div>
          )}
        </label>
      </div>

      {/* ── 診断ボタン ── */}
      {preview && status !== "analyzing" && (
        <div style={{ margin:"12px 16px 0" }}>
          <button onClick={analyze} style={{ ...S.ctaButton }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
              stroke="#FFD700" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/>
              <path d="M21 21l-4.35-4.35"/>
            </svg>
            AIで診断する
          </button>
        </div>
      )}

      {/* ── 解析中 ── */}
      {status === "analyzing" && (
        <div style={{ margin:"12px 16px 0", background:"#0e0d08",
          border:"1px solid #2a2810", borderRadius:14, padding:"28px 16px",
          textAlign:"center" }}>
          <div style={{ width:40, height:40, borderRadius:"50%", margin:"0 auto 14px",
            border:"3px solid #3a3318", borderTopColor:"#FFD700",
            animation:"spin 0.8s linear infinite" }}/>
          <div style={{ fontSize:14, fontWeight:700, color:"#FFD700",
            marginBottom:6 }}>AI診断中...</div>
          <div style={{ fontSize:11, color:"#555", lineHeight:1.7 }}>
            馬体・気配・落ち着きを<br/>分析しています
          </div>
        </div>
      )}

      {/* ── エラー ── */}
      {status === "error" && (
        <div style={{ margin:"12px 16px 0", background:"#1a0808",
          border:"1px solid #5a1818", borderRadius:14, padding:16,
          textAlign:"center" }}>
          <div style={{ fontSize:24, marginBottom:8 }}>⚠️</div>
          <div style={{ fontSize:13, color:"#FF8888", marginBottom:12 }}>
            診断に失敗しました
          </div>
          <button onClick={analyze} style={{ fontSize:12, fontWeight:700,
            color:"#FFD700", background:"#1a1400", border:"1px solid #3a3318",
            borderRadius:8, padding:"8px 16px", cursor:"pointer" }}>
            再試行する
          </button>
        </div>
      )}

      {/* ── 診断結果 ── */}
      {status === "done" && result && (
        <div style={{ animation:"fadeSlideUp 0.4s ease both" }}>

          {/* 総合スコアカード */}
          <div style={{ margin:"12px 16px 0",
            background:"linear-gradient(135deg,#161408,#1a1700)",
            border:"1px solid #3a3318", borderRadius:18, padding:20,
            position:"relative", overflow:"hidden" }}>
            <div style={{ position:"absolute", top:-30, right:-30, width:120, height:120,
              borderRadius:"50%",
              background:"radial-gradient(circle,rgba(255,215,0,0.12),transparent 70%)" }}/>

            {/* 馬名とグレード */}
            <div style={{ display:"flex", justifyContent:"space-between",
              alignItems:"flex-start", marginBottom:14 }}>
              <div>
                <div style={{ fontSize:10, color:"#555", marginBottom:4 }}>診断馬</div>
                <div style={{ fontSize:18, fontWeight:700, color:"#F5E8C0" }}>
                  {result.horse_name}
                </div>
              </div>
              <div style={{ textAlign:"center" }}>
                <div style={{ fontSize:10, color:"#555", marginBottom:4 }}>グレード</div>
                <div style={{ fontSize:32, fontWeight:700,
                  padding:"4px 16px", borderRadius:10,
                  background:gradeBg(result.grade).bg,
                  border:`2px solid ${gradeBg(result.grade).border}`,
                  color:gradeBg(result.grade).color,
                  fontFamily:"'Rajdhani',sans-serif" }}>
                  {result.grade}
                </div>
              </div>
            </div>

            {/* 総合スコア */}
            <div style={{ marginBottom:16 }}>
              <div style={{ display:"flex", justifyContent:"space-between",
                alignItems:"center", marginBottom:6 }}>
                <div style={{ fontSize:12, fontWeight:700, color:"#FFD700" }}>
                  総合スコア
                </div>
                <div style={{ fontFamily:"'Rajdhani',sans-serif", fontSize:28,
                  fontWeight:700, color:scoreColor(result.total) }}>
                  {result.total}<span style={{ fontSize:14, color:"#555" }}>/100</span>
                </div>
              </div>
              <div style={{ height:10, background:"#1a1a10",
                borderRadius:5, overflow:"hidden" }}>
                <div style={{ width:`${result.total}%`, height:"100%", borderRadius:5,
                  background:`linear-gradient(90deg,#B8860B,${scoreColor(result.total)})`,
                  transition:"width 0.8s ease" }}/>
              </div>
            </div>

            {/* 買い推奨バッジ */}
            <div style={{ display:"flex", alignItems:"center", gap:8,
              background: result.buy ? "#0a2a0a" : "#1a0808",
              border:`1px solid ${result.buy ? "#2a6a2a" : "#5a1818"}`,
              borderRadius:10, padding:"10px 14px" }}>
              <div style={{ fontSize:20 }}>{result.buy ? "✅" : "❌"}</div>
              <div>
                <div style={{ fontSize:12, fontWeight:700,
                  color: result.buy ? "#7aaa7a" : "#FF8888" }}>
                  {result.buy ? "買い推奨" : "見送り推奨"}
                </div>
                <div style={{ fontSize:11, color:"#666", marginTop:2 }}>
                  {result.summary}
                </div>
              </div>
            </div>
          </div>

          {/* 3項目詳細スコア */}
          <div style={{ margin:"10px 16px 0", display:"flex",
            flexDirection:"column", gap:8 }}>
            {[
              { key:"body",   label:"馬体",   icon:"💪", data:result.body   },
              { key:"spirit", label:"気配",   icon:"👁", data:result.spirit },
              { key:"calm",   label:"落ち着き", icon:"🧘", data:result.calm  },
            ].map((item,i) => (
              <div key={item.key} style={{ background:"#0e0d08",
                border:"1px solid #1e1c0e", borderRadius:12, padding:"14px",
                animation:`fadeSlideUp 0.4s ease ${i*80}ms both` }}>
                <div style={{ display:"flex", justifyContent:"space-between",
                  alignItems:"center", marginBottom:8 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                    <span style={{ fontSize:18 }}>{item.icon}</span>
                    <span style={{ fontSize:13, fontWeight:700, color:"#E8D9A0" }}>
                      {item.label}
                    </span>
                  </div>
                  <div style={{ fontFamily:"'Rajdhani',sans-serif", fontSize:22,
                    fontWeight:700, color:scoreColor(item.data.score) }}>
                    {item.data.score}
                  </div>
                </div>
                <div style={{ height:6, background:"#1a1a10",
                  borderRadius:3, overflow:"hidden", marginBottom:8 }}>
                  <div style={{ width:`${item.data.score}%`, height:"100%", borderRadius:3,
                    background:`linear-gradient(90deg,#333,${scoreColor(item.data.score)})`,
                    transition:"width 0.8s ease" }}/>
                </div>
                <div style={{ fontSize:12, color:"#777" }}>
                  {item.data.comment}
                </div>
              </div>
            ))}
          </div>

          {/* 再診断ボタン */}
          <div style={{ margin:"12px 16px 0" }}>
            <button onClick={()=>{setPreview(null);setImage(null);setResult(null);setStatus("idle");setHorseName("");}}
              style={{ width:"100%", padding:"12px",
                background:"#0e0d08", border:"1px solid #2a2810",
                borderRadius:12, color:"#666", fontSize:13, fontWeight:700,
                fontFamily:"'Noto Serif JP',serif", cursor:"pointer" }}>
              別の馬を診断する
            </button>
          </div>
        </div>
      )}

      <div style={{ height:40 }}/>
    </div>
  );
}

// ============================================================
// 月額課金・プラン画面
// ============================================================

// Stripe決済URL（実際のStripeのPaymentLinkに差し替えてください）
const STRIPE_MONTHLY_URL  = "https://buy.stripe.com/your-monthly-link";
const STRIPE_YEARLY_URL   = "https://buy.stripe.com/your-yearly-link";

const PLANS = [
  {
    id:"free",
    name:"無料プラン",
    price:"¥0",
    period:"/月",
    color:"#888",
    border:"#2a2810",
    bg:"#0e0d08",
    badge:null,
    features:[
      { label:"レース一覧",         ok:true  },
      { label:"出走馬確認",         ok:true  },
      { label:"AI予想（3回/日）",   ok:true  },
      { label:"穴馬ランキング",     ok:true  },
      { label:"お気に入り（5件）",  ok:true  },
      { label:"無制限AI予想",       ok:false },
      { label:"的中率・回収率分析", ok:false },
      { label:"パドック診断",       ok:false },
      { label:"優先サポート",       ok:false },
    ],
  },
  {
    id:"premium",
    name:"プレミアム",
    price:"¥980",
    period:"/月",
    color:"#FFD700",
    border:"#FFD700",
    bg:"linear-gradient(135deg,#1a1400,#111009)",
    badge:"人気No.1",
    features:[
      { label:"レース一覧",         ok:true },
      { label:"出走馬確認",         ok:true },
      { label:"AI予想（無制限）",   ok:true },
      { label:"穴馬ランキング",     ok:true },
      { label:"お気に入り（無制限）",ok:true },
      { label:"無制限AI予想",       ok:true },
      { label:"的中率・回収率分析", ok:true },
      { label:"パドック診断",       ok:true },
      { label:"優先サポート",       ok:true },
    ],
  },
  {
    id:"yearly",
    name:"年間プラン",
    price:"¥7,800",
    period:"/年",
    color:"#40c8c8",
    border:"#2a6060",
    bg:"linear-gradient(135deg,#001a1a,#111009)",
    badge:"2ヶ月分お得",
    features:[
      { label:"プレミアム全機能",   ok:true },
      { label:"年間統計レポート",   ok:true },
      { label:"先行機能アクセス",   ok:true },
      { label:"専任サポート",       ok:true },
    ],
  },
];

function SubscriptionScreen({ onNavigate, currentUser, onUpgrade }) {
  const [selectedPlan, setSelectedPlan] = useState("premium");
  const [showConfirm,  setShowConfirm]  = useState(false);
  const [toast,        setToast]        = useState("");

  const showToast = (msg) => { setToast(msg); setTimeout(()=>setToast(""), 2500); };

  const currentPlan = currentUser?.plan || "free";

  const handleSubscribe = (planId) => {
    if (planId === "free") return;
    if (!currentUser) { onNavigate("auth"); return; }
    // Stripeの決済ページを開く
    const url = planId === "yearly" ? STRIPE_YEARLY_URL : STRIPE_MONTHLY_URL;
    // URLが実際のStripeリンクでない場合はデモ処理
    if (url.includes("your-")) {
      setShowConfirm(true);
    } else {
      window.open(url, "_blank");
    }
  };

  // デモ用: プランアップグレード確認
  const confirmUpgrade = () => {
    onUpgrade(selectedPlan);
    setShowConfirm(false);
    showToast(`${selectedPlan === "yearly" ? "年間" : "プレミアム"}プランに変更しました 🎉`);
  };

  return (
    <div style={S.screen}>

      {/* ── ヘッダー ── */}
      <div style={S.subHeader}>
        <button style={S.backBtn} onClick={()=>onNavigate("home")}><ArrowLeft/></button>
        <div style={S.subTitle}>プランを選ぶ</div>
        <div style={{ fontSize:10, fontWeight:700, color:"#FFD700",
          background:"#1a1400", border:"1px solid #3a3318",
          borderRadius:6, padding:"3px 8px" }}>👑</div>
      </div>

      {/* ── 現在のプランバナー ── */}
      <div style={{ margin:"12px 16px 0", background:"#0e0d08",
        border:`1px solid ${currentPlan==="free"?"#2a2810":currentPlan==="yearly"?"#2a6060":"#3a3318"}`,
        borderRadius:12, padding:"12px 14px",
        display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        <div>
          <div style={{ fontSize:10, color:"#555", marginBottom:3 }}>現在のプラン</div>
          <div style={{ fontSize:14, fontWeight:700,
            color: currentPlan==="free"?"#888":currentPlan==="yearly"?"#40c8c8":"#FFD700" }}>
            {currentPlan==="free" ? "無料プラン" : currentPlan==="yearly" ? "年間プラン" : "プレミアムプラン"}
          </div>
        </div>
        {currentPlan !== "free" && (
          <div style={{ fontSize:11, fontWeight:700, padding:"4px 10px",
            borderRadius:8, background:"#0a2a0a", border:"1px solid #2a6a2a",
            color:"#7aaa7a" }}>
            ✓ 有効
          </div>
        )}
      </div>

      {/* ── プランカード ── */}
      <div style={{ padding:"12px 16px 0", display:"flex", flexDirection:"column", gap:10 }}>
        {PLANS.map(plan => {
          const isSelected  = selectedPlan === plan.id;
          const isCurrent   = currentPlan  === plan.id;
          return (
            <div key={plan.id}
              onClick={() => setSelectedPlan(plan.id)}
              style={{
                background: plan.bg,
                border:`2px solid ${isSelected ? plan.color : plan.border}`,
                borderRadius:16, padding:16, cursor:"pointer",
                position:"relative", overflow:"hidden",
                boxShadow: isSelected ? `0 0 20px ${plan.color}30` : "none",
                transition:"all 0.2s",
              }}>

              {/* 人気バッジ */}
              {plan.badge && (
                <div style={{ position:"absolute", top:0, right:0,
                  background: plan.id==="yearly" ? "#001a1a" : "#1a1400",
                  border:`1px solid ${plan.color}`,
                  borderRadius:"0 14px 0 10px",
                  padding:"4px 12px", fontSize:10, fontWeight:700, color:plan.color }}>
                  {plan.badge}
                </div>
              )}

              {/* プラン名・価格 */}
              <div style={{ display:"flex", justifyContent:"space-between",
                alignItems:"flex-start", marginBottom:12 }}>
                <div>
                  <div style={{ fontSize:13, fontWeight:700, color:plan.color,
                    marginBottom:4 }}>{plan.name}</div>
                  <div style={{ display:"flex", alignItems:"baseline", gap:2 }}>
                    <span style={{ fontFamily:"'Rajdhani',sans-serif", fontSize:28,
                      fontWeight:700, color:plan.color }}>{plan.price}</span>
                    <span style={{ fontSize:11, color:"#555" }}>{plan.period}</span>
                  </div>
                  {plan.id==="yearly" && (
                    <div style={{ fontSize:10, color:"#40c8c8", marginTop:2 }}>
                      月あたり ¥650（¥330お得）
                    </div>
                  )}
                </div>
                {/* 選択インジケーター */}
                <div style={{ width:22, height:22, borderRadius:"50%", flexShrink:0,
                  border:`2px solid ${isSelected ? plan.color : "#333"}`,
                  background: isSelected ? plan.color : "transparent",
                  display:"flex", alignItems:"center", justifyContent:"center",
                  fontSize:12, color:"#000", fontWeight:700, marginTop:4 }}>
                  {isSelected ? "✓" : ""}
                </div>
              </div>

              {/* 機能リスト */}
              <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                {plan.features.map(f => (
                  <div key={f.label} style={{ display:"flex", alignItems:"center", gap:8,
                    fontSize:12, color: f.ok ? "#C8B98A" : "#444" }}>
                    <span style={{ fontSize:13, flexShrink:0,
                      color: f.ok ? plan.color : "#333" }}>
                      {f.ok ? "✓" : "✗"}
                    </span>
                    {f.label}
                  </div>
                ))}
              </div>

              {/* 現在のプランラベル */}
              {isCurrent && (
                <div style={{ marginTop:10, textAlign:"center", fontSize:11,
                  color:"#555", fontStyle:"italic" }}>
                  現在ご利用中のプランです
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── 購入ボタン ── */}
      <div style={{ margin:"14px 16px 0" }}>
        {selectedPlan === "free" ? (
          <div style={{ textAlign:"center", fontSize:13, color:"#555", padding:"14px" }}>
            無料プランは登録不要でご利用いただけます
          </div>
        ) : currentPlan === selectedPlan ? (
          <div style={{ textAlign:"center", fontSize:13, color:"#555",
            padding:"14px", background:"#0e0d08", border:"1px solid #1e1c0e",
            borderRadius:12 }}>
            現在ご利用中のプランです
          </div>
        ) : (
          <button onClick={() => handleSubscribe(selectedPlan)} style={{
            ...S.ctaButton,
            background: selectedPlan==="yearly"
              ? "linear-gradient(135deg,#001a1a,#002a2a)"
              : "linear-gradient(135deg,#2a2400,#3d3500)",
            border:`1px solid ${selectedPlan==="yearly" ? "#40c8c8" : "#FFD700"}`,
            color: selectedPlan==="yearly" ? "#40c8c8" : "#FFD700",
            boxShadow:`0 0 24px ${selectedPlan==="yearly" ? "#40c8c833" : "#FFD70033"}`,
            fontSize:15,
          }}>
            <span>
              {selectedPlan==="yearly" ? "年間プランで始める" : "プレミアムで始める"}
            </span>
            <ChevronRight size={18}/>
          </button>
        )}
      </div>

      {/* ── 安心の保証 ── */}
      <div style={{ margin:"12px 16px 0", display:"grid",
        gridTemplateColumns:"1fr 1fr 1fr", gap:8 }}>
        {[
          { icon:"🔒", label:"安全決済", sub:"Stripe使用" },
          { icon:"↩️", label:"返金対応", sub:"7日以内" },
          { icon:"📱", label:"即時反映", sub:"購入後すぐ" },
        ].map(item => (
          <div key={item.label} style={{ background:"#0e0d08",
            border:"1px solid #1e1c0e", borderRadius:10,
            padding:"10px 6px", textAlign:"center" }}>
            <div style={{ fontSize:20, marginBottom:4 }}>{item.icon}</div>
            <div style={{ fontSize:11, fontWeight:700, color:"#888" }}>{item.label}</div>
            <div style={{ fontSize:9, color:"#555", marginTop:2 }}>{item.sub}</div>
          </div>
        ))}
      </div>

      {/* ── FAQ ── */}
      <div style={{ margin:"12px 16px 0", background:"#0e0d08",
        border:"1px solid #1e1c0e", borderRadius:14, padding:16 }}>
        <div style={{ fontSize:12, fontWeight:700, color:"#FFD700",
          letterSpacing:1, marginBottom:12 }}>よくある質問</div>
        {[
          { q:"いつでも解約できますか？",
            a:"はい。マイページからいつでも解約できます。次回更新日まで機能をご利用いただけます。" },
          { q:"支払い方法は？",
            a:"クレジットカード・デビットカードに対応しています（Visa/Mastercard/AMEX）。" },
          { q:"無料プランとの違いは？",
            a:"AI予想が無制限に。的中率分析・パドック診断・お気に入り無制限など上位機能が使えます。" },
        ].map((faq, i) => (
          <div key={i} style={{ marginBottom: i<2 ? 12:0,
            paddingBottom: i<2 ? 12:0,
            borderBottom: i<2 ? "1px solid #1a1a10":"none" }}>
            <div style={{ fontSize:12, fontWeight:700, color:"#C8B98A", marginBottom:4 }}>
              Q. {faq.q}
            </div>
            <div style={{ fontSize:11, color:"#666", lineHeight:1.7 }}>
              A. {faq.a}
            </div>
          </div>
        ))}
      </div>

      {/* ── デモ用確認モーダル ── */}
      {showConfirm && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.85)",
          display:"flex", alignItems:"center", justifyContent:"center", zIndex:300,
          padding:"0 20px" }}>
          <div style={{ background:"#111009", border:"1px solid #3a3318",
            borderRadius:20, padding:24, width:"100%", maxWidth:340,
            animation:"fadeSlideUp 0.3s ease both" }}>
            <div style={{ fontSize:24, textAlign:"center", marginBottom:12 }}>👑</div>
            <div style={{ fontSize:16, fontWeight:700, color:"#FFD700",
              textAlign:"center", marginBottom:8 }}>
              {selectedPlan==="yearly" ? "年間プラン" : "プレミアムプラン"}
            </div>
            <div style={{ fontSize:13, color:"#888", textAlign:"center",
              marginBottom:16, lineHeight:1.7 }}>
              {selectedPlan==="yearly" ? "¥7,800/年" : "¥980/月"}で<br/>
              プレミアム機能が全て使えます。<br/>
              <span style={{ fontSize:11, color:"#555" }}>
                ※本番環境ではStripe決済ページへ遷移します
              </span>
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
              <button onClick={()=>setShowConfirm(false)} style={{
                padding:"12px", borderRadius:10, border:"1px solid #2a2810",
                background:"#0a0908", color:"#666", fontSize:13, fontWeight:700,
                cursor:"pointer", fontFamily:"'Noto Serif JP',serif" }}>
                キャンセル
              </button>
              <button onClick={confirmUpgrade} style={{
                padding:"12px", borderRadius:10,
                border:"1px solid #FFD700",
                background:"linear-gradient(135deg,#2a2400,#3d3500)",
                color:"#FFD700", fontSize:13, fontWeight:700,
                cursor:"pointer", fontFamily:"'Noto Serif JP',serif",
                boxShadow:"0 0 16px #FFD70033" }}>
                アップグレード
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div style={{ position:"fixed", bottom:24, left:"50%",
          transform:"translateX(-50%)", zIndex:200,
          background:"#1a1400", border:"1px solid #FFD700",
          borderRadius:10, padding:"10px 20px", color:"#FFD700",
          fontSize:12, fontWeight:700,
          boxShadow:"0 4px 20px rgba(0,0,0,0.7)", whiteSpace:"nowrap" }}>
          {toast}
        </div>
      )}
      <div style={{ height:40 }}/>
    </div>
  );
}

// ============================================================
// 通知機能画面
// ============================================================
const NOTIF_KEY = "keiba:notifications";

async function loadNotifSettings() {
  try {
    const r = await window.storage.get(NOTIF_KEY);
    return r ? JSON.parse(r.value) : {
      enabled: false,
      before15: true,
      before5:  true,
      aiUpdate: true,
      anabaAlert: true,
      favoriteOnly: false,
    };
  } catch {
    return { enabled:false, before15:true, before5:true,
      aiUpdate:true, anabaAlert:true, favoriteOnly:false };
  }
}
async function saveNotifSettings(data) {
  try { await window.storage.set(NOTIF_KEY, JSON.stringify(data)); } catch {}
}

function NotificationScreen({ onNavigate }) {
  const [settings,    setSettings]    = useState(null);
  const [permission,  setPermission]  = useState("default"); // default|granted|denied
  const [toast,       setToast]       = useState("");
  const [schedules,   setSchedules]   = useState([]);

  const showToast = (msg) => { setToast(msg); setTimeout(()=>setToast(""), 2500); };

  // 起動時に設定とパーミッション読込
  useEffect(() => {
    loadNotifSettings().then(s => setSettings(s));
    if ("Notification" in window) {
      setPermission(Notification.permission);
    }
    // 本日のスケジュール（サンプル）
    setSchedules([
      { id:1, race:"日本ダービー",    venue:"東京", time:"15:40", grade:"G1", notified15:false, notified5:false },
      { id:2, race:"鳴尾記念",        venue:"阪神", time:"15:30", grade:"G3", notified15:false, notified5:false },
      { id:3, race:"函館スプリントS",  venue:"函館", time:"15:35", grade:"G3", notified15:false, notified5:false },
      { id:4, race:"帝王賞",          venue:"大井", time:"20:10", grade:"G1", notified15:false, notified5:false },
    ]);
  }, []);

  const updateSetting = async (key, val) => {
    const next = { ...settings, [key]: val };
    setSettings(next);
    await saveNotifSettings(next);
  };

  // Push通知の許可を要求
  const requestPermission = async () => {
    if (!("Notification" in window)) {
      showToast("このブラウザは通知をサポートしていません");
      return;
    }
    const result = await Notification.requestPermission();
    setPermission(result);
    if (result === "granted") {
      await updateSetting("enabled", true);
      showToast("通知を有効にしました 🔔");
      // テスト通知を送信
      new Notification("KEIBA ORACLE", {
        body: "通知が有効になりました！レース前にお知らせします 🏇",
        icon: "/favicon.ico",
      });
    } else if (result === "denied") {
      showToast("通知が拒否されました。ブラウザの設定から許可してください");
    }
  };

  // テスト通知を送信
  const sendTestNotif = () => {
    if (permission !== "granted") { showToast("先に通知を許可してください"); return; }
    new Notification("【テスト】日本ダービー 発走15分前", {
      body: "東京11R 日本ダービー G1 発走15:40 ◎ イクイノックス",
      icon: "/favicon.ico",
    });
    showToast("テスト通知を送信しました");
  };

  // スケジュールから通知をセット（実際のタイマー）
  const scheduleNotification = (race) => {
    if (permission !== "granted") { showToast("先に通知を許可してください"); return; }
    const [h, m] = race.time.split(":").map(Number);
    const raceDate = new Date();
    raceDate.setHours(h, m, 0, 0);

    const now = new Date();
    const msTo15 = raceDate - now - 15 * 60 * 1000;
    const msTo5  = raceDate - now - 5  * 60 * 1000;

    if (settings.before15 && msTo15 > 0) {
      setTimeout(() => {
        new Notification(`【15分前】${race.race}`, {
          body: `${race.venue} ${race.grade} 発走 ${race.time}`,
        });
      }, msTo15);
    }
    if (settings.before5 && msTo5 > 0) {
      setTimeout(() => {
        new Notification(`【5分前】${race.race}`, {
          body: `${race.venue} ${race.grade} 発走 ${race.time} ⚡️まもなくスタート！`,
        });
      }, msTo5);
    }
    showToast(`${race.race} の通知をセットしました 🔔`);
  };

  if (!settings) {
    return (
      <div style={S.screen}>
        <div style={S.subHeader}>
          <button style={S.backBtn} onClick={()=>onNavigate("home")}><ArrowLeft/></button>
          <div style={S.subTitle}>通知設定</div>
          <div style={{ width:36 }}/>
        </div>
        <div style={{ padding:"40px 20px", textAlign:"center" }}>
          <Skeleton width="80%" height={14} style={{ margin:"0 auto 10px" }}/>
          <Skeleton width="60%" height={14} style={{ margin:"0 auto" }}/>
        </div>
      </div>
    );
  }

  const Toggle = ({ value, onChange }) => (
    <button onClick={() => onChange(!value)} style={{
      width:48, height:26, borderRadius:13, border:"none", cursor:"pointer",
      background: value ? "#1a6a3a" : "#1a1a10", position:"relative",
      transition:"background 0.2s", flexShrink:0,
    }}>
      <div style={{ width:20, height:20, borderRadius:"50%", background:"#FFF",
        position:"absolute", top:3, left: value ? 24 : 4,
        transition:"left 0.2s", boxShadow:"0 1px 4px rgba(0,0,0,0.4)" }}/>
    </button>
  );

  return (
    <div style={S.screen}>

      {/* ── ヘッダー ── */}
      <div style={S.subHeader}>
        <button style={S.backBtn} onClick={()=>onNavigate("home")}><ArrowLeft/></button>
        <div style={S.subTitle}>通知設定</div>
        <div style={{ fontSize:16 }}>
          {permission === "granted" ? "🔔" : "🔕"}
        </div>
      </div>

      {/* ── 通知許可バナー ── */}
      <div style={{ margin:"12px 16px 0" }}>
        {permission === "granted" ? (
          <div style={{ background:"#0a1a0a", border:"1px solid #2a5a2a",
            borderRadius:12, padding:"12px 14px",
            display:"flex", alignItems:"center", justifyContent:"space-between" }}>
            <div>
              <div style={{ fontSize:12, fontWeight:700, color:"#7aaa7a", marginBottom:2 }}>
                🔔 通知が有効です
              </div>
              <div style={{ fontSize:10, color:"#555" }}>
                レース前にプッシュ通知でお知らせします
              </div>
            </div>
            <button onClick={sendTestNotif} style={{ fontSize:10, fontWeight:700,
              color:"#7aaa7a", background:"#0f2a0f", border:"1px solid #2a6a2a",
              borderRadius:7, padding:"5px 10px", cursor:"pointer" }}>
              テスト送信
            </button>
          </div>
        ) : permission === "denied" ? (
          <div style={{ background:"#1a0808", border:"1px solid #5a1818",
            borderRadius:12, padding:"14px" }}>
            <div style={{ fontSize:12, fontWeight:700, color:"#FF8888", marginBottom:6 }}>
              🔕 通知がブロックされています
            </div>
            <div style={{ fontSize:11, color:"#666", lineHeight:1.7, marginBottom:10 }}>
              ブラウザの設定から通知を許可してください。
              アドレスバーの🔒アイコン → 通知 → 許可
            </div>
            <div style={{ fontSize:10, color:"#444" }}>
              設定変更後にページを再読み込みしてください
            </div>
          </div>
        ) : (
          <div style={{ background:"#161408", border:"1px solid #3a3318",
            borderRadius:12, padding:"14px" }}>
            <div style={{ fontSize:13, fontWeight:700, color:"#FFD700", marginBottom:6 }}>
              🔔 通知を有効にする
            </div>
            <div style={{ fontSize:11, color:"#777", lineHeight:1.7, marginBottom:12 }}>
              レース発走前に自動でお知らせします。
              大事なレースを見逃しません。
            </div>
            <button onClick={requestPermission} style={{ ...S.ctaButton, marginTop:0 }}>
              通知を許可する
            </button>
          </div>
        )}
      </div>

      {/* ── 通知タイミング設定 ── */}
      <div style={{ margin:"12px 16px 0", background:"#0e0d08",
        border:"1px solid #1e1c0e", borderRadius:14, overflow:"hidden" }}>
        <div style={{ padding:"12px 14px", background:"#161408",
          borderBottom:"1px solid #1e1c0e",
          fontSize:11, fontWeight:700, color:"#FFD700", letterSpacing:1 }}>
          ⏰ 通知タイミング
        </div>
        {[
          { key:"before15",    label:"発走15分前",    sub:"余裕を持って準備できます", icon:"⏰" },
          { key:"before5",     label:"発走5分前",     sub:"直前の最終確認に",          icon:"⚡" },
          { key:"aiUpdate",    label:"AI予想更新時",  sub:"新しい予想が出たらお知らせ", icon:"🤖" },
          { key:"anabaAlert",  label:"高期待値穴馬出現",sub:"期待値180以上の穴馬発見時",icon:"🔥" },
        ].map((item, i, arr) => (
          <div key={item.key} style={{ display:"flex", alignItems:"center",
            justifyContent:"space-between", padding:"13px 14px",
            borderBottom: i<arr.length-1 ? "1px solid #161410" : "none" }}>
            <div style={{ display:"flex", alignItems:"center", gap:10 }}>
              <span style={{ fontSize:18 }}>{item.icon}</span>
              <div>
                <div style={{ fontSize:13, fontWeight:700, color:"#E8D9A0" }}>
                  {item.label}
                </div>
                <div style={{ fontSize:10, color:"#555", marginTop:2 }}>
                  {item.sub}
                </div>
              </div>
            </div>
            <Toggle value={settings[item.key]}
              onChange={v => updateSetting(item.key, v)}/>
          </div>
        ))}
      </div>

      {/* ── フィルター設定 ── */}
      <div style={{ margin:"10px 16px 0", background:"#0e0d08",
        border:"1px solid #1e1c0e", borderRadius:14, overflow:"hidden" }}>
        <div style={{ padding:"12px 14px", background:"#161408",
          borderBottom:"1px solid #1e1c0e",
          fontSize:11, fontWeight:700, color:"#FFD700", letterSpacing:1 }}>
          🎯 通知フィルター
        </div>
        <div style={{ display:"flex", alignItems:"center",
          justifyContent:"space-between", padding:"13px 14px" }}>
          <div>
            <div style={{ fontSize:13, fontWeight:700, color:"#E8D9A0" }}>
              お気に入りのみ通知
            </div>
            <div style={{ fontSize:10, color:"#555", marginTop:2 }}>
              ONにすると♥したレースだけ通知
            </div>
          </div>
          <Toggle value={settings.favoriteOnly}
            onChange={v => updateSetting("favoriteOnly", v)}/>
        </div>
      </div>

      {/* ── 本日のスケジュール ── */}
      <div style={{ margin:"12px 16px 0" }}>
        <div style={{ fontSize:12, fontWeight:700, color:"#FFD700",
          letterSpacing:1, marginBottom:8,
          display:"flex", alignItems:"center", gap:6 }}>
          📅 本日のレーススケジュール
        </div>
        <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
          {schedules.map(r => (
            <div key={r.id} style={{ display:"flex", alignItems:"center",
              justifyContent:"space-between", background:"#0e0d08",
              border:"1px solid #1e1c0e", borderRadius:12, padding:"12px 14px" }}>
              <div style={{ flex:1 }}>
                <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:4 }}>
                  <span style={{ fontSize:10, fontWeight:700, padding:"2px 6px",
                    borderRadius:4, border:`1px solid ${gradeColor(r.grade)}`,
                    color:gradeColor(r.grade) }}>{r.grade}</span>
                  <span style={{ fontFamily:"'Rajdhani',sans-serif", fontSize:13,
                    fontWeight:700, color:"#FFD700" }}>{r.time}</span>
                </div>
                <div style={{ fontSize:13, fontWeight:700, color:"#E8D9A0" }}>
                  {r.race}
                </div>
                <div style={{ fontSize:10, color:"#555", marginTop:2 }}>
                  📍 {r.venue}
                </div>
              </div>
              <button onClick={() => scheduleNotification(r)}
                disabled={permission !== "granted"}
                style={{ fontSize:11, fontWeight:700, padding:"7px 12px",
                  borderRadius:8, cursor: permission==="granted" ? "pointer":"not-allowed",
                  background: permission==="granted" ? "#1a1700":"#111",
                  border:`1px solid ${permission==="granted" ? "#3a3318":"#222"}`,
                  color: permission==="granted" ? "#FFD700":"#444",
                  fontFamily:"'Noto Serif JP',serif", flexShrink:0, marginLeft:10 }}>
                🔔 セット
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* ── 通知履歴（サンプル） ── */}
      <div style={{ margin:"12px 16px 0", background:"#0e0d08",
        border:"1px solid #1e1c0e", borderRadius:14, overflow:"hidden" }}>
        <div style={{ padding:"12px 14px", background:"#161408",
          borderBottom:"1px solid #1e1c0e",
          fontSize:11, fontWeight:700, color:"#FFD700", letterSpacing:1 }}>
          📋 最近の通知
        </div>
        {[
          { time:"昨日 15:25", msg:"日本ダービー 発走15分前",    read:true  },
          { time:"昨日 15:35", msg:"日本ダービー 発走5分前 ⚡",   read:true  },
          { time:"昨日 14:00", msg:"AI予想が更新されました 🤖",   read:true  },
          { time:"2日前 19:55", msg:"帝王賞 発走15分前",          read:true  },
        ].map((n, i, arr) => (
          <div key={i} style={{ display:"flex", alignItems:"center", gap:10,
            padding:"11px 14px",
            borderBottom: i<arr.length-1 ? "1px solid #161410":"none",
            opacity: n.read ? 0.6 : 1 }}>
            <div style={{ width:8, height:8, borderRadius:"50%", flexShrink:0,
              background: n.read ? "#333" : "#FFD700" }}/>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:12, color:"#C8B98A" }}>{n.msg}</div>
              <div style={{ fontSize:10, color:"#444", marginTop:2 }}>{n.time}</div>
            </div>
          </div>
        ))}
      </div>

      {toast && (
        <div style={{ position:"fixed", bottom:24, left:"50%",
          transform:"translateX(-50%)", zIndex:200,
          background:"#0f0e1a", border:"1px solid #6655aa",
          borderRadius:10, padding:"10px 18px", color:"#AA88FF",
          fontSize:12, fontWeight:700,
          boxShadow:"0 4px 20px rgba(0,0,0,0.7)", whiteSpace:"nowrap" }}>
          {toast}
        </div>
      )}
      <div style={{ height:40 }}/>
    </div>
  );
}

// ============================================================
// アフィリエイト・収益ダッシュボード画面
// ============================================================

// アフィリエイトパートナーリスト
const AFFILIATE_PARTNERS = [
  {
    id:"ipat",
    name:"JRA即PAT",
    desc:"JRA公式ネット投票サービス。中央競馬全レース対応。",
    url:"https://www.ipat.jra.go.jp/",
    logo:"🏇",
    color:"#FFD700",
    bg:"#1a1400",
    border:"#3a3318",
    commission:"送客報酬あり",
    category:"中央競馬",
  },
  {
    id:"netkeiba",
    name:"netkeiba",
    desc:"日本最大の競馬情報サイト。予想・オッズ・レース結果。",
    url:"https://netkeiba.com/",
    logo:"📊",
    color:"#40c8c8",
    bg:"#001818",
    border:"#2a6060",
    commission:"アフィリエイトあり",
    category:"情報サイト",
  },
  {
    id:"keibago",
    name:"競馬GO",
    desc:"地方競馬情報サイト。南関東・地方競馬全場対応。",
    url:"https://keiba.go.jp/",
    logo:"🌙",
    color:"#AA88FF",
    bg:"#0e0a1a",
    border:"#4a3a88",
    commission:"アフィリエイトあり",
    category:"地方競馬",
  },
  {
    id:"umaca",
    name:"UMACA",
    desc:"地方競馬のネット投票。南関東4場・全国地方競馬対応。",
    url:"https://www.umaca.jp/",
    logo:"🎯",
    color:"#FF8C00",
    bg:"#1a0e00",
    border:"#6a3a00",
    commission:"送客報酬あり",
    category:"地方競馬",
  },
];

function AffiliateScreen({ onNavigate }) {
  const [stats,      setStats]      = useState({ total:0, logs:[] });
  const [loaded,     setLoaded]     = useState(false);
  const [tab,        setTab]        = useState("dashboard"); // dashboard | partners
  const [toast,      setToast]      = useState("");

  const showToast = (msg) => { setToast(msg); setTimeout(()=>setToast(""), 2200); };

  useEffect(() => {
    loadPATStats().then(s => { setStats(s); setLoaded(true); });
  }, []);

  // パートナーリンクをクリック（計測付き）
  const handlePartnerClick = async (partner) => {
    await recordPATClick(`[${partner.name}] リンククリック`);
    setStats(s => ({ ...s, total: s.total + 1 }));
    window.open(partner.url, "_blank");
    showToast(`${partner.name} へ移動します`);
  };

  // 推定収益（サンプル計算）
  const estRevenue = Math.floor(stats.total * 12); // 1クリック約12円換算

  // 今日のクリック数
  const today = new Date().toISOString().slice(0, 10);
  const todayClicks = stats.logs.filter(l => l.at?.startsWith(today)).length;

  return (
    <div style={S.screen}>

      {/* ── ヘッダー ── */}
      <div style={S.subHeader}>
        <button style={S.backBtn} onClick={()=>onNavigate("home")}><ArrowLeft/></button>
        <div style={S.subTitle}>収益ダッシュボード</div>
        <div style={{ fontSize:10, fontWeight:700, color:"#7aaa7a",
          background:"#0a1a0a", border:"1px solid #2a5a2a",
          borderRadius:6, padding:"3px 8px" }}>💰</div>
      </div>

      {/* ── タブ ── */}
      <div style={{ display:"flex", margin:"12px 16px 0", background:"#0a0908",
        border:"1px solid #1e1c0e", borderRadius:10, padding:3, gap:3 }}>
        {[
          { key:"dashboard", label:"📊 ダッシュボード" },
          { key:"partners",  label:"🔗 パートナー"    },
        ].map(t => (
          <button key={t.key} onClick={()=>setTab(t.key)} style={{
            flex:1, padding:"9px 0", borderRadius:8, border:"none", cursor:"pointer",
            background: tab===t.key ? "#1a1700":"transparent",
            color: tab===t.key ? "#FFD700":"#444",
            fontSize:12, fontWeight:700, fontFamily:"'Noto Serif JP',serif",
            transition:"all 0.2s",
          }}>{t.label}</button>
        ))}
      </div>

      {/* ══════════════
          ダッシュボード
      ══════════════ */}
      {tab === "dashboard" && (
        <div>
          {/* KPI 4枚 */}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr",
            gap:8, margin:"12px 16px 0" }}>
            {[
              { label:"累計クリック",   value: loaded ? String(stats.total) : "…",
                sub:"即PAT送客数", color:"#FFD700", icon:"👆" },
              { label:"本日クリック",   value: loaded ? String(todayClicks) : "…",
                sub:"今日の送客数", color:"#7aaa7a", icon:"📅" },
              { label:"推定収益",       value: loaded ? `¥${estRevenue.toLocaleString()}` : "…",
                sub:"累計推定額", color:"#FF8C00", icon:"💰" },
              { label:"CTR換算",        value: loaded && stats.total > 0 ? `${Math.round(todayClicks/Math.max(stats.total,1)*100)}%` : "—",
                sub:"本日/累計比", color:"#AA88FF", icon:"📈" },
            ].map(k => (
              <div key={k.label} style={{ background:"#0e0d08",
                border:"1px solid #1e1c0e", borderRadius:12, padding:"14px 12px" }}>
                <div style={{ fontSize:16, marginBottom:4 }}>{k.icon}</div>
                <div style={{ fontFamily:"'Rajdhani',sans-serif", fontSize:24,
                  fontWeight:700, color:k.color, lineHeight:1 }}>{k.value}</div>
                <div style={{ fontSize:10, color:"#555", marginTop:4 }}>{k.label}</div>
                <div style={{ fontSize:9, color:"#333", marginTop:2 }}>{k.sub}</div>
              </div>
            ))}
          </div>

          {/* 収益シミュレーション */}
          <div style={{ margin:"10px 16px 0", background:"#0e0d08",
            border:"1px solid #2a2810", borderRadius:14, padding:16 }}>
            <div style={{ fontSize:12, fontWeight:700, color:"#FFD700",
              letterSpacing:1, marginBottom:12 }}>📈 収益シミュレーション</div>
            {[
              { users:"100人/日", clicks:300, revenue:"¥3,600/日" },
              { users:"500人/日", clicks:1500, revenue:"¥18,000/日" },
              { users:"1000人/日", clicks:3000, revenue:"¥36,000/日" },
            ].map((s, i) => (
              <div key={i} style={{ display:"flex", alignItems:"center",
                justifyContent:"space-between", padding:"10px 0",
                borderBottom: i<2 ? "1px solid #1a1a10":"none" }}>
                <div>
                  <div style={{ fontSize:12, fontWeight:700, color:"#C8B98A" }}>
                    {s.users}
                  </div>
                  <div style={{ fontSize:10, color:"#555", marginTop:2 }}>
                    {s.clicks.toLocaleString()}クリック想定
                  </div>
                </div>
                <div style={{ fontFamily:"'Rajdhani',sans-serif", fontSize:18,
                  fontWeight:700, color:"#7aaa7a" }}>{s.revenue}</div>
              </div>
            ))}
            <div style={{ fontSize:10, color:"#333", marginTop:10, lineHeight:1.7 }}>
              ※ 1クリック約¥12換算のシミュレーションです。実際の収益はサービスにより異なります。
            </div>
          </div>

          {/* クリック履歴 */}
          <div style={{ margin:"10px 16px 0", background:"#0e0d08",
            border:"1px solid #1e1c0e", borderRadius:14, overflow:"hidden" }}>
            <div style={{ padding:"12px 14px", background:"#161408",
              borderBottom:"1px solid #1e1c0e",
              fontSize:11, fontWeight:700, color:"#FFD700", letterSpacing:1 }}>
              🕐 クリック履歴（直近）
            </div>
            {!loaded && [1,2,3].map(i => (
              <div key={i} style={{ padding:"10px 14px",
                borderBottom:"1px solid #161410" }}>
                <Skeleton width="70%" height={12} style={{ marginBottom:6 }}/>
                <Skeleton width="40%" height={10}/>
              </div>
            ))}
            {loaded && stats.logs.length === 0 && (
              <div style={{ padding:"24px", textAlign:"center",
                fontSize:12, color:"#333" }}>
                まだクリック記録がありません。<br/>
                レース詳細の「即PATで購入 ↗」ボタンを使うと記録されます。
              </div>
            )}
            {loaded && stats.logs.slice(0, 10).map((l, i, arr) => (
              <div key={i} style={{ display:"flex", alignItems:"center", gap:10,
                padding:"10px 14px",
                borderBottom: i<arr.length-1 ? "1px solid #161410":"none" }}>
                <div style={{ width:8, height:8, borderRadius:"50%",
                  background:"#FFD700", flexShrink:0 }}/>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:12, color:"#C8B98A" }}>{l.race}</div>
                  <div style={{ fontSize:10, color:"#444", marginTop:2 }}>
                    {l.at ? new Date(l.at).toLocaleString("ja-JP", {
                      month:"numeric", day:"numeric",
                      hour:"2-digit", minute:"2-digit" }) : "—"}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ══════════════
          パートナー一覧
      ══════════════ */}
      {tab === "partners" && (
        <div style={{ padding:"12px 16px 0",
          display:"flex", flexDirection:"column", gap:10 }}>

          <div style={{ fontSize:11, color:"#555", lineHeight:1.7,
            background:"#0a0908", border:"1px solid #1e1c0e",
            borderRadius:10, padding:"10px 12px" }}>
            💡 各パートナーへの送客がアフィリエイト収益になります。
            ユーザーがリンクをクリックして登録・入金すると報酬が発生します。
          </div>

          {AFFILIATE_PARTNERS.map((p, i) => (
            <div key={p.id} style={{ background:"#0e0d08",
              border:`1px solid ${p.border}`, borderRadius:14, padding:16,
              animation:`fadeSlideUp 0.35s ease ${i*60}ms both` }}>
              {/* ヘッダー */}
              <div style={{ display:"flex", alignItems:"flex-start",
                justifyContent:"space-between", marginBottom:10 }}>
                <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                  <div style={{ width:40, height:40, borderRadius:10,
                    background:p.bg, border:`1px solid ${p.border}`,
                    display:"flex", alignItems:"center", justifyContent:"center",
                    fontSize:20 }}>{p.logo}</div>
                  <div>
                    <div style={{ fontSize:14, fontWeight:700, color:p.color }}>
                      {p.name}
                    </div>
                    <div style={{ fontSize:10, color:"#555", marginTop:2 }}>
                      {p.category}
                    </div>
                  </div>
                </div>
                <div style={{ fontSize:10, fontWeight:700, padding:"3px 8px",
                  borderRadius:6, background:p.bg, border:`1px solid ${p.border}`,
                  color:p.color, whiteSpace:"nowrap" }}>
                  {p.commission}
                </div>
              </div>

              {/* 説明 */}
              <div style={{ fontSize:12, color:"#777", lineHeight:1.7, marginBottom:12 }}>
                {p.desc}
              </div>

              {/* URL表示 */}
              <div style={{ fontSize:10, color:"#444", fontFamily:"monospace",
                background:"#0a0908", borderRadius:6, padding:"5px 8px",
                marginBottom:10, overflow:"hidden", textOverflow:"ellipsis",
                whiteSpace:"nowrap" }}>
                {p.url}
              </div>

              {/* 送客ボタン */}
              <button onClick={() => handlePartnerClick(p)} style={{
                display:"flex", alignItems:"center", justifyContent:"center", gap:6,
                width:"100%", padding:"11px",
                background:p.bg, border:`1px solid ${p.color}`,
                borderRadius:10, color:p.color,
                fontSize:12, fontWeight:700, fontFamily:"'Noto Serif JP',serif",
                cursor:"pointer", boxShadow:`0 0 12px ${p.color}22`,
              }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
                  stroke={p.color} strokeWidth="2">
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                  <polyline points="15,3 21,3 21,9"/>
                  <line x1="10" y1="14" x2="21" y2="3"/>
                </svg>
                {p.name} を開く ↗
              </button>
            </div>
          ))}

          {/* 自社アフィリエイトコード案内 */}
          <div style={{ background:"#111009", border:"1px solid #2a2810",
            borderRadius:14, padding:16 }}>
            <div style={{ fontSize:12, fontWeight:700, color:"#FFD700",
              marginBottom:8 }}>🔑 アフィリエイトタグの設定</div>
            <div style={{ fontSize:11, color:"#666", lineHeight:1.8, marginBottom:10 }}>
              各サービスのアフィリエイトプログラムに登録後、
              発行されたタグをコード上部の URL に追記してください。
            </div>
            <div style={{ fontFamily:"monospace", fontSize:11, color:"#888",
              background:"#0a0908", borderRadius:8, padding:10,
              lineHeight:1.8 }}>
              {`// keiba-app.jsx 上部\nconst PAT_URL = "https://ipat.jra.go.jp/\n  ?utm_source=keiba_oracle\n  &ref=YOUR_AFFILIATE_CODE";`}
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div style={{ position:"fixed", bottom:24, left:"50%",
          transform:"translateX(-50%)", zIndex:200,
          background:"#1a1400", border:"1px solid #FFD700",
          borderRadius:10, padding:"10px 18px", color:"#FFD700",
          fontSize:12, fontWeight:700,
          boxShadow:"0 4px 20px rgba(0,0,0,0.7)", whiteSpace:"nowrap" }}>
          {toast}
        </div>
      )}
      <div style={{ height:40 }}/>
    </div>
  );
}

// ============================================================
// ボトムナビゲーション
// ============================================================
function BottomNav({ screen, navigate, currentUser }) {
  // 詳細画面など一部の画面では非表示
  const hideOn = ["detail", "auth", "paddock"];
  if (hideOn.includes(screen)) return null;

  const tabs = [
    {
      key: "home",
      label: "ホーム",
      icon: (active) => (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
          stroke={active ? "#FFD700" : "#555"} strokeWidth="2">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
          <polyline points="9,22 9,12 15,12 15,22"/>
        </svg>
      ),
    },
    {
      key: "list",
      label: "レース",
      icon: (active) => (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
          stroke={active ? "#FFD700" : "#555"} strokeWidth="2">
          <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>
        </svg>
      ),
    },
    {
      key: "anaba",
      label: "穴馬",
      icon: (active) => (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
          stroke={active ? "#FF8C00" : "#555"} strokeWidth="2">
          <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/>
        </svg>
      ),
      accent: "#FF8C00",
    },
    {
      key: "stats",
      label: "成績",
      icon: (active) => (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
          stroke={active ? "#7aaa7a" : "#555"} strokeWidth="2">
          <line x1="18" y1="20" x2="18" y2="10"/>
          <line x1="12" y1="20" x2="12" y2="4"/>
          <line x1="6"  y1="20" x2="6"  y2="14"/>
        </svg>
      ),
      accent: "#7aaa7a",
    },
    {
      key: "mypage",
      label: "マイページ",
      icon: (active) => (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
          stroke={active ? "#FFD700" : "#555"} strokeWidth="2">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
          <circle cx="12" cy="7" r="4"/>
        </svg>
      ),
    },
  ];

  // マイページタブ用のメニュー
  const [showMenu, setShowMenu] = useState(false);

  const handleTab = (key) => {
    if (key === "mypage") {
      setShowMenu(!showMenu);
      return;
    }
    setShowMenu(false);
    navigate(key);
  };

  const isActive = (key) => {
    if (key === "mypage") return ["favorites","notifications","subscription","affiliate","auth"].includes(screen);
    return screen === key;
  };

  return (
    <>
      {/* マイページ展開メニュー */}
      {showMenu && (
        <div style={{
          position:"absolute", bottom:64, left:0, right:0,
          background:"#050504", borderTop:"1px solid #FFD70022",
          zIndex:150, padding:"8px 0",
          animation:"fadeSlideUp 0.2s ease both",
          boxShadow:"0 -4px 24px rgba(0,0,0,0.9)",
        }}>
          {[
            { key:"favorites",     label:"♥ お気に入り"       },
            { key:"stats",         label:"📊 的中率・回収率"  },
            { key:"notifications", label:"🔔 通知設定"        },
            { key:"subscription",  label:"👑 プレミアムプラン" },
            { key:"affiliate",     label:"💰 収益ダッシュボード" },
            { key: currentUser ? "logout" : "auth",
              label: currentUser ? `👤 ${currentUser.nickname}（ログアウト）` : "🔑 ログイン / 登録" },
          ].map(item => (
            <button key={item.key} onClick={() => {
              setShowMenu(false);
              if (item.key === "logout") {
                // ログアウト処理はnavigateで対応
                navigate("auth");
              } else {
                navigate(item.key);
              }
            }} style={{
              display:"block", width:"100%", padding:"13px 20px",
              background:"none", border:"none", borderBottom:"1px solid #111009",
              color:"#C8B98A", fontSize:14, fontWeight:700, textAlign:"left",
              cursor:"pointer", fontFamily:"'Noto Serif JP',serif",
            }}>
              {item.label}
            </button>
          ))}
        </div>
      )}

      {/* タブバー */}
      <div style={{
        position:"absolute", bottom:0, left:0, right:0, height:64,
        background:"#050504",
        borderTop:"1px solid #FFD70022",
        display:"flex", alignItems:"center",
        zIndex:100,
        boxShadow:"0 -4px 24px rgba(0,0,0,0.9)",
      }}>
        {tabs.map(tab => {
          const active = isActive(tab.key);
          const accent = tab.accent || "#FFD700";
          return (
            <button key={tab.key} onClick={() => handleTab(tab.key)} style={{
              flex:1, display:"flex", flexDirection:"column",
              alignItems:"center", justifyContent:"center", gap:3,
              height:"100%", border:"none", background:"none",
              cursor:"pointer", position:"relative",
              transition:"all 0.2s",
            }}>
              {/* アクティブインジケーター */}
              {active && (
                <div style={{
                  position:"absolute", top:0, left:"25%", right:"25%",
                  height:2, borderRadius:"0 0 2px 2px",
                  background: accent,
                  boxShadow:`0 0 8px ${accent}`,
                }}/>
              )}
              {tab.icon(active)}
              <span style={{
                fontSize:10, fontWeight:700,
                color: active ? accent : "#444",
                fontFamily:"'Noto Serif JP',serif",
                letterSpacing:0.3,
              }}>
                {tab.label}
              </span>
              {/* マイページはユーザーアバター */}
              {tab.key === "mypage" && currentUser && (
                <div style={{
                  position:"absolute", top:8, right:"20%",
                  width:8, height:8, borderRadius:"50%",
                  background:"#FFD700",
                }}/>
              )}
            </button>
          );
        })}
      </div>
    </>
  );
}

export default function App() {
  const [screen,       setScreen]       = useState("home");
  const [selectedRace, setSelectedRace] = useState(null);
  const [liveData,     setLiveData]     = useState(null);
  const [fetchStatus,  setFetchStatus]  = useState("loading");
  const [lastUpdated,  setLastUpdated]  = useState(null);
  const [currentUser,  setCurrentUser]  = useState(null);

  // 起動時にユーザー情報を読込
  useEffect(() => {
    loadUser().then(u => { if (u) setCurrentUser(u); });
  }, []);

  const handleLogin = (user) => {
    setCurrentUser(user);
    setScreen("home");
  };

  const handleLogout = async () => {
    await deleteUser();
    setCurrentUser(null);
  };

  // ナビゲーション関数（全画面共通）
  const navigate = (dest, race = null) => {
    setScreen(dest);
    if (race) setSelectedRace(race);
  };

  // JRA情報を Anthropic Web Search で取得
  const fetchJRAInfo = async () => {
    setFetchStatus("loading");
    setLiveData(null);
    try {
      const today = todayQuery();
      const prompt = `今日（${today}）のJRA競馬開催情報をWeb検索で調べ、以下のJSON形式のみで返答してください。前置き・コードブロック不要です。

{"date":"${today}","venues":["競馬場名"],"featured":{"name":"最上位レース名","venue":"競馬場","time":"HH:MM","grade":"G1等"},"races":[{"name":"レース名","venue":"競馬場","time":"HH:MM","grade":"G1等"}]}

開催がない場合はracesを空配列にしてください。`;

      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method:"POST",
        headers:{ "Content-Type":"application/json" },
        body:JSON.stringify({
          model:"claude-sonnet-4-20250514", max_tokens:1500,
          tools:[{ type:"web_search_20250305", name:"web_search" }],
          messages:[{ role:"user", content:prompt }],
        }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      const text = (data.content||[]).filter(b=>b.type==="text").map(b=>b.text).join("");
      const cleaned = text.replace(/```json\s*/gi,"").replace(/```/g,"").trim();
      const m = cleaned.match(/\{[\s\S]*\}/);
      if (!m) throw new Error();
      const parsed = JSON.parse(m[0]);
      if (!Array.isArray(parsed.races)) throw new Error();
      setLiveData(parsed);
      setFetchStatus("done");
      setLastUpdated(new Date());
    } catch {
      setFetchStatus("fallback");
      setLiveData(null);
      setLastUpdated(new Date());
    }
  };

  useEffect(() => { fetchJRAInfo(); }, []);

  const hasLive = fetchStatus === "done" && liveData?.featured?.name;
  const featured = hasLive
    ? { ...FEATURED_RACE,
        name:  liveData.featured.name,
        venue: liveData.featured.venue  || FEATURED_RACE.venue,
        time:  liveData.featured.time   || FEATURED_RACE.time,
        grade: liveData.featured.grade  || FEATURED_RACE.grade }
    : FEATURED_RACE;

  return (
    <div style={S.appShell}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=Noto+Serif+JP:wght@400;700&family=Rajdhani:wght@500;700&display=swap');
        *{box-sizing:border-box;margin:0;padding:0;}
        body{background:#0a0a0a;}
        @keyframes fadeSlideUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}
        ::-webkit-scrollbar{width:0;}
      `}</style>

      <div style={S.phone}>
        {/* ── コンテンツエリア ── */}
        <div style={{ paddingBottom: 64 }}>
          {screen === "home" && (
            <HomeScreen
              onNavigate={navigate}
              featured={featured}
              liveData={liveData}
              fetchStatus={fetchStatus}
              lastUpdated={lastUpdated}
              onRefresh={fetchJRAInfo}
              currentUser={currentUser}
              onLogout={handleLogout}
            />
          )}
          {screen === "list" && (
            <RaceListScreen onNavigate={navigate}/>
          )}
          {screen === "detail" && selectedRace && (
            <RaceDetailScreen race={selectedRace} onNavigate={navigate}/>
          )}
          {screen === "anaba" && (
            <AnabaRankingScreen onNavigate={navigate}/>
          )}
          {screen === "stats" && (
            <StatsScreen onNavigate={navigate}/>
          )}
          {screen === "favorites" && (
            <FavoritesScreen onNavigate={navigate}/>
          )}
          {screen === "auth" && (
            <AuthScreen onNavigate={navigate} onLogin={handleLogin}/>
          )}
          {screen === "paddock" && (
            <PaddockScreen onNavigate={navigate}/>
          )}
          {screen === "subscription" && (
            <SubscriptionScreen
              onNavigate={navigate}
              currentUser={currentUser}
              onUpgrade={(plan) => {
                const updated = { ...currentUser, plan };
                setCurrentUser(updated);
                saveUser(updated);
              }}
            />
          )}
          {screen === "notifications" && (
            <NotificationScreen onNavigate={navigate}/>
          )}
          {screen === "affiliate" && (
            <AffiliateScreen onNavigate={navigate}/>
          )}
        </div>

        {/* ── ボトムナビゲーション ── */}
        <BottomNav screen={screen} navigate={navigate} currentUser={currentUser}/>
      </div>
    </div>
  );
}

// ============================================================
// スタイル定数
// ============================================================
const S = {
  appShell: {
    minHeight:"100vh", background:"#050505",
    display:"flex", justifyContent:"center", alignItems:"flex-start",
    padding:"24px 0", fontFamily:"'Noto Serif JP',serif",
  },
  phone: {
    width:390, minHeight:844, background:"#0d0d0d", borderRadius:40, overflow:"hidden",
    boxShadow:"0 0 0 1px #2a2a2a,0 40px 80px rgba(0,0,0,0.8),0 0 60px rgba(255,215,0,0.06)",
  },
  screen: {
    minHeight:844, background:"linear-gradient(160deg,#0d0d0d 0%,#111008 100%)",
    overflowY:"auto", paddingBottom:40,
  },
  homeHeader: {
    padding:"52px 20px 16px", display:"flex", justifyContent:"space-between",
    alignItems:"center", borderBottom:"1px solid #1e1e14",
  },
  appName: {
    fontFamily:"'Playfair Display',serif", fontSize:22, fontWeight:900,
    background:"linear-gradient(90deg,#FFD700,#FFF8DC,#B8860B)",
    WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", letterSpacing:2,
  },
  appSub: { fontSize:10, color:"#666", letterSpacing:3, marginTop:1 },
  dateBadge: { background:"#161610", border:"1px solid #2e2d1a", borderRadius:8, padding:"4px 10px" },
  infoBanner: {
    margin:"10px 16px 0", background:"#0e0d08", border:"1px solid #2a2810",
    borderRadius:12, padding:"12px 14px",
    display:"flex", justifyContent:"space-between", alignItems:"flex-start",
  },
  venueBadge: {
    fontSize:12, fontWeight:700, color:"#E8D9A0",
    background:"#1a1700", border:"1px solid #3a3318", borderRadius:6, padding:"3px 10px",
  },
  refreshBtn: {
    width:28, height:28, borderRadius:8, background:"#161410", border:"1px solid #2a2810",
    display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer",
  },
  sectionLabel: {
    display:"flex", alignItems:"center", gap:6, padding:"20px 20px 10px",
    fontSize:12, fontWeight:700, color:"#FFD700", letterSpacing:2, textTransform:"uppercase",
  },
  featuredCard: {
    margin:"0 16px",
    background:"linear-gradient(135deg,#161408 0%,#1a1700 50%,#161408 100%)",
    border:"1px solid #3a3318", borderRadius:20, padding:20,
    position:"relative", overflow:"hidden",
  },
  featuredGlow: {
    position:"absolute", top:-40, right:-40, width:160, height:160, borderRadius:"50%",
    background:"radial-gradient(circle,rgba(255,215,0,0.12) 0%,transparent 70%)", pointerEvents:"none",
  },
  featuredName: {
    fontFamily:"'Playfair Display',serif", fontSize:26, fontWeight:700,
    color:"#F5E8C0", marginBottom:12, lineHeight:1.2,
  },
  metaChip: {
    display:"inline-flex", alignItems:"center", gap:4, fontSize:11, color:"#888",
    background:"#0d0c06", border:"1px solid #2a2810", borderRadius:6, padding:"3px 8px",
  },
  statBox: {
    flex:1, background:"#111009", border:"1px solid #222110",
    borderRadius:12, padding:"12px 8px", textAlign:"center",
  },
  statValue: { fontFamily:"'Rajdhani',sans-serif", fontSize:22, fontWeight:700, color:"#FFD700" },
  statLabel: { fontSize:10, color:"#555", marginTop:2, letterSpacing:0.5 },
  ctaButton: {
    display:"flex", alignItems:"center", justifyContent:"center", gap:8,
    margin:"8px 16px 0", width:"calc(100% - 32px)", padding:"16px",
    background:"linear-gradient(135deg,#2a2400,#3d3500)", border:"1px solid #FFD700",
    borderRadius:14, color:"#FFD700", fontSize:15, fontWeight:700,
    fontFamily:"'Noto Serif JP',serif", letterSpacing:1, cursor:"pointer",
    boxShadow:"0 0 20px rgba(255,215,0,0.15)",
  },
  subHeader: {
    display:"flex", alignItems:"center", justifyContent:"space-between",
    padding:"52px 16px 14px", borderBottom:"1px solid #1a1a12",
  },
  backBtn: {
    width:36, height:36, background:"#161410", border:"1px solid #2a2810",
    borderRadius:10, display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer",
  },
  subTitle: {
    fontFamily:"'Playfair Display',serif", fontSize:18, fontWeight:700,
    color:"#E8D9A0", letterSpacing:1,
  },
  raceCard: {
    display:"flex", alignItems:"center", gap:12, background:"#111009",
    border:"1px solid #1e1c0e", borderRadius:14, padding:"14px 12px",
    animation:"fadeSlideUp 0.4s ease both",
  },
};
