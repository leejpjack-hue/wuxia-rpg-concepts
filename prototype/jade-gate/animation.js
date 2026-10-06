/**
 * 四人の刃 — 兩集動畫 Demo（第一集約 23 分鐘、第二集約 19 分鐘 · 分鏡版）
 * Episode 1「破帝」：三俠於古代擊敗灰帝的完整經過——由常山趙家村說起。
 * Episode 2「裂口 · 廿賢殿」：裂口將三俠擲入異世界，遇上二十賢的故事。
 *
 * 分鏡語言：每場由鏡頭（shots）組成 — wide 全景、pan 橫搖、push 推近、
 * closeup 講話大頭（裁切動作 asset：focus/windup 蓄勢、strike/special 出招）、
 * duel 對峙雙機位。講話節拍自動切講者大頭；動作節拍可指名用招式 asset。
 */

import manifest from "./docs/asset-manifest.json" with { type: "json" };
import { loadDuelPoses, applyDuelPose, clearDuelPose } from "./src/platform/duel-poses.js";

const art = {
  gate: "assets/arena.png",
  bamboo: "assets/bamboo-roam.png",
  river: "assets/bamboo-river.png",
  maze: "assets/bamboo-maze-natural.png",
  mountain: "assets/mount-canglan.png",
  citadel: "assets/meridian-citadel.png",
};
const sprite = (id) => `assets/${id}-sprite.png`;

/** 講者名 → 角色 id（分鏡特寫用；旁白與環境聲不切鏡）。 */
const SPEAKERS = {
  "趙雲": "zhao-yun", "魯智深": "lu-zhishen", "扈三娘": "hu-sanniang",
  "關羽": "guan-yu", "武松": "wu-song", "呂布": "lu-bu-rival",
  "灰旗守將": "warden", "夜鷺": "night-heron", "灰帝": "sovereign", "趙敏": "zhao-min",
  "賈雨村": "jia-yucun", "林黛玉": "lin-daiyu", "狄仁杰": "di-renjie", "包拯": "bao-zheng",
  "王熙鳳": "wang-xifeng", "楊玉環": "yang-yuhuan", "吳用": "wu-yong", "懿妃": "empress-yixiu",
  "貂蟬": "diaochan", "守衛": "guard", "灰旗兵": "guard", "影刺客": "shadow-assassin",
  "翠衛": "jade-sentinel", "天脈侍者": "meridian-acolyte",
};

/** 大頭鏡用畫：頭像 `{id}.png` / `{id}.jpg` 最靚 → 動作單張 → atlas 裁切 → sprite 推近。 */
function portraitSrc(id) {
  for (const ext of ["png", "jpg"]) {
    const file = `assets/${id}.${ext}`;
    if (manifest.some((row) => row.file === file && row.runtimeApproved !== false)) return file;
  }
  return null;
}

/** 每個角色塊面喺圖入面嘅位置（研究結論：面要填滿畫面、眼喺上面三分一）。
 *  唔靠估：canvas 掃描 alpha 量度人形頂（頭頂）同腳底，眼線 = 頭頂 + 7% 身高。
 *  下面只係掃描失敗時嘅後備值。 */
const FACE_FOCUS = { painted: "13%", wide: "10%", square: "9%" };

/** 頭部錨點快取：src+pose → {x, y}（圖像百分比）。 */
const anchorCache = new Map();

function scanFigureRegion(data, w, h) {
  const solid = (x, y) => data[(y * w + x) * 4 + 3] > 16;
  let top = -1, bottom = -1;
  for (let y = 0; y < h && top < 0; y++)
    for (let x = 0; x < w; x++) if (solid(x, y)) { top = y; break; }
  for (let y = h - 1; y >= 0 && bottom < 0; y--)
    for (let x = 0; x < w; x++) if (solid(x, y)) { bottom = y; break; }
  if (top < 0 || bottom - top < h * 0.2) return null; // 冇掃到人形
  const headBottom = Math.min(h - 1, top + Math.round((bottom - top) * 0.16));
  let xMin = w, xMax = -1;
  for (let y = top; y <= headBottom; y++)
    for (let x = 0; x < w; x++) if (solid(x, y)) { if (x < xMin) xMin = x; if (x > xMax) xMax = x; }
  if (xMax < 0) return null;
  const height = bottom - top || 1;
  return {
    x: (((xMin + xMax) / 2) / w) * 100,          // 頭心中線
    y: ((top + height * 0.07) / h) * 100,        // 眼線
  };
}

/** atlas 姿勢只掃該格：poseRects 有實際框，冇就用格仔座標（新 2×2 / 舊 4×3）。 */
function poseRegionOf(atlas, pose, naturalW, naturalH) {
  if (!atlas) return null;
  const rect = atlas.poseRects?.[pose];
  if (rect) return { x: rect[0], y: rect[1], w: rect[2], h: rect[3] };
  const cell = atlas.duelPoses?.[pose];
  if (!cell || !naturalW || !naturalH) return null;
  const legacy = atlas.id.endsWith("-sheet");
  const [cols, rows] = legacy ? [4, 3] : [2, 2];
  const w = naturalW / cols, h = naturalH / rows;
  return { x: cell[0] * w, y: cell[1] * h, w, h };
}

function measureAnchor(src, regionOf) {
  if (/\.jpe?g$/i.test(src)) return Promise.resolve(null);
  return new Promise((resolve) => {
    const image = new Image();
    image.onload = () => {
      try {
        const r = regionOf ? regionOf(image) : { x: 0, y: 0, w: image.naturalWidth, h: image.naturalHeight };
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(r.w));
        canvas.height = Math.max(1, Math.round(r.h));
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        ctx.drawImage(image, r.x, r.y, r.w, r.h, 0, 0, canvas.width, canvas.height);
        resolve(scanFigureRegion(ctx.getImageData(0, 0, canvas.width, canvas.height).data, canvas.width, canvas.height));
      } catch { resolve(null); }
    };
    image.onerror = () => resolve(null);
    image.src = src;
  });
}

/** 套用頭部錨點：即時用後備值，量度完（或命中快取）先覆寫 CSS 變數。
 *  以 dataset.anchorKey 防止快 seek 時舊結果寫落新角色度。 */
function applyAnchor(closeup, key, src, regionOf, fallbackY) {
  closeup.dataset.anchorKey = key;
  const cached = anchorCache.get(key);
  if (cached) {
    closeup.style.setProperty("--face-y", cached.y + "%");
    closeup.style.setProperty("--head-x", cached.x + "%");
    return;
  }
  closeup.style.setProperty("--face-y", fallbackY);
  closeup.style.setProperty("--head-x", "50%");
  measureAnchor(src, regionOf).then((anchor) => {
    anchorCache.set(key, anchor || { x: 50, y: parseFloat(fallbackY) });
    if (closeup.dataset.anchorKey !== key) return; // 鏡頭已經切咗
    const hit = anchorCache.get(key);
    closeup.style.setProperty("--face-y", hit.y + "%");
    closeup.style.setProperty("--head-x", hit.x + "%");
  });
}

/** 錨點要掃邊張圖：poseFiles 行用單張姿勢檔；atlas 行掃該格；其他掃全圖。 */
function anchorTargetOf(id, pose) {
  const entry = poseArt(id, pose);
  const file = entry.atlas?.poseFiles?.[pose] || entry.src;
  const regionOf = entry.atlas
    ? entry.atlas.poseFiles?.[pose] ? null
      : (image) => poseRegionOf(entry.atlas, pose, image.naturalWidth, image.naturalHeight)
    : null;
  return { file, regionOf, key: `${file}|${pose}` };
}

/** 播放前預熱：所有講者嘅錨點先量定，正式播放一刀落位。 */
function warmAnchors(episode) {
  for (const scene of episode.scenes)
    for (const shot of shotsOf(scene)) {
      if (shot.kind !== "closeup" || !shot.focus) continue;
      const portrait = portraitSrc(shot.focus);
      if (portrait) {
        if (!anchorCache.has(portrait))
          measureAnchor(portrait, null).then((a) => anchorCache.set(portrait, a || { x: 50, y: 13 }));
      } else {
        const { file, regionOf, key } = anchorTargetOf(shot.focus, shot.pose || "focus");
        if (!anchorCache.has(key))
          measureAnchor(file, regionOf).then((a) => anchorCache.set(key, a || { x: 50, y: 9 }));
      }
    }
}

/** 裁切級別（研究自對白鏡頭文法）：head 面部填滿、face 頭加肩、bust 半身。 */
const CROP_ZOOM = {
  // height%（相對舞台）：2:3 畫面部約佔全圖 15% 高 → head 用 ~420%。
  painted: { head: "420%", face: "300%", bust: "190%" },
  wide:    { head: "360%", face: "260%", bust: "170%" },
  square:  { head: "440%", face: "310%", bust: "200%" },
};

function artKind(id) {
  const row = manifest.find((entry) => entry.file === `assets/${id}.png` || entry.file === `assets/${id}.jpg`);
  if (!row) return "square";
  const wide = /\.jpg$/.test(row.file); // 橫幅 key art
  return wide ? "wide" : "painted";
}

/** 動作 asset 解析：單張 `{id}-duel-{pose}.png` → atlas 裁切 → sprite 後備。 */
const poseAtlases = new Map();
function poseArt(id, pose) {
  const single = `assets/${id}-duel-${pose}.png`;
  const inManifest = manifest.some((row) => row.file === single);
  if (inManifest) return { src: single, atlas: null };
  let atlas = poseAtlases.get(id);
  if (atlas === undefined) {
    atlas = loadDuelPoses(manifest, id);
    poseAtlases.set(id, atlas);
  }
  return { src: atlas ? atlas.file : sprite(id), atlas };
}

/** 場景結構：{ id, chapter, duration, backdrop, pan, cast, shots?, beats }
 *  shot: { t, kind: wide|pan|push|closeup|duel, focus, pose, side, crop: bust|face } */
export const EPISODES = [
  {
    id: "ep1", number: "第一集", title: "破帝",
    subtitle: "三俠如何在世界淪陷之夜，走到灰帝座前",
    scenes: [
      {
        id: "zhaovillage", chapter: "序章 · 常山趙家村", duration: 105,
        backdrop: art.bamboo, pan: "in",
        cast: [{ id: "zhao-yun", side: "left" }, { id: "guard", side: "right", delay: 1.4 }],
        beats: [
          { t: 4, who: "", text: "故事開始之前，常山腳下有條趙家村。村裡的少年姓趙名雲，白日鑄劍，夜裡替全村守燈。" },
          { t: 20, who: "", text: "師父臨終前，把家傳的青釭劍交到他手上：「劍快，是末技；肯等，才是守門人。」" },
          { t: 36, who: "", text: "他有個妹妹，小他六歲，總蹲在劍爐邊看火星，說長大了要鑄一柄比青釭更亮的劍。師父那句「肯等」，她記得比哥哥還熟。" },
          { t: 52, who: "", text: "三年後，朝廷的詔書到了村口——凡江湖血統，編入「較善之約」，兵器入庫，永世不得出關。名冊第一頁是趙家；妹妹的名字，排在頭一個。" },
          { t: 68, who: "", text: "押走的隊伍連夜出村。妹妹掙脫半刻，把半塊玉塞進哥哥手心：「哥，去找我。找不到——就守著一道，會讓我回家的門。」" },
          { t: 86, who: "", text: "趙雲連夜北上。行囊裡是師父的一句話，手心裡，是半塊玉。" },
          { t: 98, who: "", text: "他抵達翠門關外的那一夜，關樓上的燈，一盞一盞地熄了。" },
        ],
        shots: [
          { t: 4, kind: "pan", from: "left" },
          { t: 18, kind: "push", focus: "zhao-yun" },
          { t: 34, kind: "wide" },
          { t: 50, kind: "push", focus: "guard" },
          { t: 66, kind: "closeup", focus: "zhao-yun", pose: "focus", crop: "face" },
          { t: 84, kind: "wide" },
          { t: 96, kind: "wide" },
        ],
      },
      {
        id: "prologue", chapter: "序章 · 血月照關", duration: 75,
        backdrop: art.gate, pan: "in", cast: [],
        beats: [
          { t: 4, who: "", text: "灰旗軍來的那一夜，翠門關的燈火逐一熄滅。" },
          { t: 18, who: "", text: "朝廷的詔書寫得溫柔：凡江湖血統，編入「較善之約」，永世不得出關。" },
          { t: 34, who: "", text: "逃難的百姓翻過山脊，回頭望——關樓上，已換了灰色的旗。" },
          { t: 44, who: "", text: "剛趕到關下的趙雲站在人潮裡，握緊行囊中的劍。他身後是回不去的村，手心裡，是妹妹的半塊玉。" },
          { t: 54, who: "趙雲", text: "「山河有盡，寸刃不移。這一次，換我們守門。」" },
          { t: 64, who: "", text: "而在人潮的另一頭，還有兩個逆流而行的身影——他們還不知道，彼此會在今夜相遇。" },
        ],
      },
      {
        id: "oath", chapter: "第一章 · 三俠結誓", duration: 115,
        backdrop: art.gate, pan: "left",
        cast: [
          { id: "zhao-yun", side: "left" },
          { id: "lu-zhishen", side: "center" },
          { id: "hu-sanniang", side: "right" },
        ],
        beats: [
          { t: 4, who: "", text: "關下的流民營，亂得像一鍋沸水。灰旗兵驅趕人群，鞭子落在跑不動的老人身上。" },
          { t: 18, who: "", text: "一條水磨禪杖橫裡伸出，接住了鞭子。出手的和尚來自五台山——三日前，詔令焚了他的寺。他背著燒焦的半截山門下山，一路南來。" },
          { t: 34, who: "魯智深", text: "「灑家的寺可以燒，人不能跪。要押走他們，先從灑家身上踏過去。」" },
          { t: 46, who: "", text: "灰旗兵層層圍上。人群裡又殺出一對日月雙刀——獨龍岡的扈三娘。她追著押走全家的囚車走了三日三夜，追到關前，囚車還是進了關。" },
          { t: 60, who: "扈三娘", text: "「我家的門，是被這道關拆的。拆門的人，一個都別想全身走。」" },
          { t: 70, who: "", text: "亂軍之中，三件兵器第一次碰在一起：劍護著老人，杖擋著箭雨，雙刀開路。三扇被拆的家門——焚了的寺、追不上的囚車、名冊上排第一的名字——在刀光裡認出了彼此。" },
          { t: 82, who: "趙雲", text: "「原來不是只有我一個，不肯讓門就這樣關上。兩位——同路嗎？」" },
          { t: 94, who: "三人", text: "「同路。不入帝都，誓不下山。」" },
          { t: 106, who: "", text: "誓言落地之處，後來成了江湖的地標。三個失去家門的人，把彼此認成了門。" },
        ],
        shots: [
          { t: 4, kind: "pan", from: "left" },
          { t: 32, kind: "closeup", focus: "lu-zhishen", pose: "focus", crop: "face" },
          { t: 44, kind: "push", focus: "hu-sanniang" },
          { t: 58, kind: "closeup", focus: "hu-sanniang", pose: "windup", crop: "face" },
          { t: 68, kind: "wide" },
          { t: 80, kind: "closeup", focus: "zhao-yun", pose: "focus", crop: "face" },
          { t: 92, kind: "wide" },
        ],
      },
      {
        id: "vanguard", chapter: "第一章 · 破先鋒", duration: 85,
        backdrop: art.gate, pan: "right",
        cast: [
          { id: "guan-yu", side: "left" },
          { id: "gu-dasao", side: "right" },
          { id: "guard", side: "far-right", delay: 1.2 },
        ],
        beats: [
          { t: 4, who: "", text: "關前的第一道營，由被詔令改寫的英雄鎮守——他們自己，已不記得自己是誰。" },
          { t: 16, who: "", text: "不肯跪的英雄，被押去「謄抄」：抄一遍自己的名字，便忘記一段自己。鎮守此關的關羽，已被抄過七遍。" },
          { t: 30, who: "", text: "青龍偃月刀攔路。刀是好刀，握刀的手，卻聽命於灰帝的墨。" },
          { t: 46, who: "趙雲", text: "「關將軍，你的刀在替別人寫字。讓我幫你鬆一鬆腕。」" },
          { t: 62, who: "", text: "一場牌局般的決鬥：讀招、拆招、以氣破式。守衛倒下之處，營火四散。" },
          { t: 76, who: "", text: "被斬斷的不只是繩，還有寫在血裡的約。" },
        ],
        shots: [
          { t: 2, kind: "wide" },
          { t: 14, kind: "push", focus: "guan-yu" },
          { t: 28, kind: "push", focus: "guan-yu" },
          { t: 44, kind: "closeup", focus: "zhao-yun", pose: "focus", crop: "face" },
          { t: 60, kind: "fight", focus: "zhao-yun", rival: "guan-yu" },
          { t: 74, kind: "pan", from: "right" },
        ],
      },
      {
        id: "warden", chapter: "第一章 · 灰旗守將", duration: 95,
        backdrop: art.gate, pan: "in-slow",
        cast: [{ id: "zhao-yun", side: "left" }, { id: "warden", side: "right", scale: 1.25 }],
        beats: [
          { t: 6, who: "灰旗守將", text: "「常山的年輕劍士……為了一個不顧你的帝國，流血到死？」" },
          { t: 28, who: "趙雲", text: "「帝國欠的賬，江湖來收。你的關，今日換主人。」" },
          { t: 46, who: "", text: "守將的巨戟劈碎了半座箭樓。趙雲貼地而進——青釭劍只取一處：執戟的手腕。" },
          { t: 68, who: "", text: "第二式來得更狠。魯智深橫杖硬接，虎口迸裂，笑聲不停。" },
          { t: 84, who: "", text: "第三式未出，雙刀已至。守將單膝落地的一刻，關門開了。" },
        ],
        shots: [
          { t: 4, kind: "closeup", focus: "warden", pose: "focus", crop: "face" },
          { t: 26, kind: "closeup", focus: "zhao-yun", pose: "focus", crop: "face" },
          { t: 44, kind: "fight", focus: "zhao-yun", rival: "warden", winner: "rival", rivalPose: "strike" },
          { t: 66, kind: "closeup", focus: "lu-zhishen", pose: "windup", crop: "face" },
          { t: 80, kind: "fight", focus: "hu-sanniang", rival: "warden", pose: "special" },
        ],
      },
      {
        id: "act1-fall", chapter: "第一章 · 關開", duration: 65,
        backdrop: art.gate, pan: "out",
        cast: [{ id: "guan-yu", side: "left" }, { id: "zhao-yun", side: "right" }],
        beats: [
          { t: 6, who: "", text: "守將倒下，翠門關回到了百姓手裡。" },
          { t: 22, who: "關羽", text: "「墨跡散了，我想起自己是誰了。前面的路，一起走。」" },
          { t: 40, who: "", text: "茶棚裡一壺茶的工夫，江湖上多了幾個名字。" },
          { t: 54, who: "", text: "而血月，只是暗了一分。" },
        ],
      },
      {
        id: "bamboo", chapter: "第二章 · 竹林低語", duration: 85,
        backdrop: art.bamboo, pan: "left",
        cast: [{ id: "hu-sanniang", side: "left" }, { id: "shadow-assassin", side: "right", delay: 1 }],
        beats: [
          { t: 5, who: "", text: "過了關，是竹林。竹子會說話——用箭、用絲、用你聽不見的琴音。" },
          { t: 24, who: "", text: "影刺客在筍霧裡來去，毒師的蛇信藏在露水下面。" },
          { t: 42, who: "扈三娘", text: "「霧裡的東西，交給我的雙刀。你們只管走直線。」" },
          { t: 60, who: "", text: "淺灘減了步速，箭雨卻密了。三人背靠背，一步一步，把竹林走成了路。" },
          { t: 76, who: "", text: "然後，琴聲停了。停琴的地方，站著一個看不見的人。" },
        ],
        shots: [
          { t: 4, kind: "pan", from: "left" },
          { t: 22, kind: "push", focus: "shadow-assassin" },
          { t: 40, kind: "closeup", focus: "hu-sanniang", pose: "focus", crop: "face" },
          { t: 58, kind: "wide" },
          { t: 74, kind: "push", focus: "hu-sanniang" },
        ],
      },
      {
        id: "heron", chapter: "第二章 · 盲琴師", duration: 90,
        backdrop: art.river, pan: "in",
        cast: [{ id: "zhao-yun", side: "left" }, { id: "night-heron", side: "right" }],
        beats: [
          { t: 6, who: "夜鷺", text: "「琴弦一動，就是你們最後一次並肩。可惜了，三把好兵器。」" },
          { t: 28, who: "", text: "她看不見，卻聽得見血的方向。絲弦封了三路，毒霧封了第四路。" },
          { t: 48, who: "", text: "趙雲棄攻為守，魯智深以杖作鐘——鐘聲亂了琴音的拍子。" },
          { t: 66, who: "", text: "拍子一亂，盲者的世界就碎了。雙刀自側翼落下，如月分海。" },
          { t: 80, who: "", text: "琴落地，弦未斷。夜鷺笑著走進霧裡：「這一局，算你們的。」" },
        ],
        shots: [
          { t: 4, kind: "closeup", focus: "night-heron", pose: "focus", crop: "face" },
          { t: 26, kind: "pan", from: "right" },
          { t: 46, kind: "closeup", focus: "lu-zhishen", pose: "windup", crop: "face" },
          { t: 63, kind: "fight", focus: "hu-sanniang", rival: "night-heron", pose: "special" },
          { t: 78, kind: "push", focus: "night-heron" },
        ],
      },
      {
        id: "crossing", chapter: "第二章 · 渡河", duration: 70,
        backdrop: art.river, pan: "right",
        cast: [
          { id: "wu-song", side: "left" },
          { id: "sun-shangxiang", side: "center" },
          { id: "qin-liangyu", side: "right" },
        ],
        beats: [
          { t: 5, who: "", text: "河的對岸，被詔令改寫的英雄一個一個醒來：打虎的行者、擂鼓的娘子、執旗的女將。" },
          { t: 26, who: "武松", text: "「既然醒了，就別再跪。你們去哪，我去哪。」" },
          { t: 44, who: "", text: "渡船破浪。船頭立著的，已經不止三個身影。" },
          { t: 58, who: "", text: "血月，又暗了一分。" },
        ],
      },
      {
        id: "clouds", chapter: "第三章 · 滄嵐雲階", duration: 85,
        backdrop: art.mountain, pan: "in-slow",
        cast: [{ id: "lu-zhishen", side: "left" }, { id: "canglan-monk", side: "right" }],
        beats: [
          { t: 5, who: "", text: "滄嵐山的雲階，一級一級，走向被咒的將軍。鐵僧攔路，鐘聲當盾。" },
          { t: 26, who: "魯智深", text: "「同是出家人，你的鐘渡不了他。讓我的杖試試。」" },
          { t: 44, who: "", text: "雲裡落石，風裡藏刀。走一步，還一步。" },
          { t: 62, who: "", text: "雲階盡頭，一把方天畫戟插在石裡——戟的主人，眼睛是灰色的。" },
        ],
      },
      {
        id: "lubu", chapter: "第三章 · 咒將呂布", duration: 95,
        backdrop: art.mountain, pan: "in",
        cast: [{ id: "zhao-yun", side: "left" }, { id: "lu-bu-rival", side: "right", scale: 1.3 }],
        beats: [
          { t: 6, who: "呂布", text: "「灰帝的詛咒餵著我的戟。要斷咒，先斷我——來。」" },
          { t: 28, who: "", text: "戟風過處，雲都退了三尺。趙雲的劍快，呂布的戟更快。" },
          { t: 48, who: "", text: "三娘的紅纓纏戟，魯智深的禪杖壓肩——三件兵器，織成一張網。" },
          { t: 68, who: "", text: "網收緊的一刻，青釭劍點在戟主的眉心：不是殺，是斬咒。" },
          { t: 84, who: "呂布", text: "「……灰色散了。此刃，重歸於我。」" },
        ],
        shots: [
          { t: 4, kind: "closeup", focus: "lu-bu-rival", pose: "focus", crop: "face" },
          { t: 26, kind: "fight", focus: "zhao-yun", rival: "lu-bu-rival", winner: "rival", rivalPose: "strike" },
          { t: 46, kind: "fight", focus: "hu-sanniang", rival: "lu-bu-rival" },
          { t: 66, kind: "closeup", focus: "zhao-yun", pose: "special", crop: "face" },
          { t: 82, kind: "closeup", focus: "lu-bu-rival", pose: "windup", crop: "face" },
        ],
      },
      {
        id: "freed", chapter: "第三章 · 同行", duration: 80,
        backdrop: art.mountain, pan: "out",
        cast: [{ id: "lu-bu-rival", side: "left" }, { id: "zhao-yun", side: "right" }],
        beats: [
          { t: 5, who: "呂布", text: "「詛咒已斷，我的戟自己作主。天脈城一戰——算我一份。」" },
          { t: 20, who: "呂布", text: "「在咒裡的十年，我看過他的真身——前朝一個史官，一支筆。寫下的約會自己行走，這就是詔令。而被墨改寫的人沒有死——他們被寫進了，別的書頁。」" },
          { t: 42, who: "", text: "眾人抬頭。血月懸在城上，像一隻不肯眨的眼——原來那不是天象，是他的硯。" },
          { t: 60, who: "趙雲", text: "「那就打翻它。墨再深，也深不過寫它的人心。」" },
          { t: 72, who: "", text: "飛將軍並轡而行。雲開處，帝都已經看得見了。" },
        ],
        shots: [
          { t: 4, kind: "closeup", focus: "lu-bu-rival", pose: "focus", crop: "face" },
          { t: 18, kind: "closeup", focus: "lu-bu-rival", pose: "windup", crop: "face" },
          { t: 40, kind: "wide" },
          { t: 58, kind: "closeup", focus: "zhao-yun", pose: "focus", crop: "face" },
          { t: 70, kind: "pan", from: "right" },
        ],
      },
      {
        id: "bloodmoon", chapter: "第四章 · 血月天脈城", duration: 85,
        backdrop: art.citadel, pan: "in-slow",
        cast: [
          { id: "jade-sentinel", side: "left" },
          { id: "zhao-yun", side: "center" },
          { id: "meridian-acolyte", side: "right" },
        ],
        beats: [
          { t: 5, who: "", text: "天脈城在血月下開著門——灰帝知道他們來了，氣漩沿著城牆唱歌。" },
          { t: 26, who: "趙雲", text: "「那就讓他看我們走進去。他毀掉的每一個誓，都在月亮這一邊等著。」" },
          { t: 46, who: "", text: "玉衛列陣，供奉結印。牌局一場接一場——讀招者生，硬拼者死。" },
          { t: 66, who: "", text: "大殿深處，王座上的人，終於抬起了頭。" },
        ],
        shots: [
          { t: 4, kind: "pan", from: "right" },
          { t: 24, kind: "closeup", focus: "zhao-yun", pose: "focus", crop: "face" },
          { t: 44, kind: "fight", focus: "zhao-yun", rival: "jade-sentinel" },
          { t: 64, kind: "push", focus: "meridian-acolyte" },
        ],
      },
      {
        id: "throne", chapter: "第四章 · 灰帝", duration: 95,
        backdrop: art.citadel, pan: "in",
        cast: [{ id: "zhao-yun", side: "left" }, { id: "sovereign", side: "right", scale: 1.35 }],
        beats: [
          { t: 6, who: "灰帝", text: "「四把刀，一個借來的月亮。你們砍斷的每一個誓，都是朕寫的——跪下，朕給你們寫個好一點的。」" },
          { t: 34, who: "趙雲", text: "「你的墨是別人的血。今夜，墨用完了。現出真身——在月亮落下之前，結束這一切。」" },
          { t: 58, who: "", text: "灰帝起身。血月跟著他起身。" },
          { t: 74, who: "", text: "王座之後，是沒有邊的暗。" },
        ],
        shots: [
          { t: 4, kind: "closeup", focus: "sovereign", pose: "focus", crop: "head" },
          { t: 32, kind: "closeup", focus: "zhao-yun", pose: "focus", crop: "head" },
          { t: 56, kind: "push", focus: "sovereign" },
          { t: 72, kind: "wide" },
        ],
      },
      {
        id: "final-duel", chapter: "第四章 · 終戰", duration: 95,
        backdrop: art.citadel, pan: "in-slow",
        cast: [
          { id: "zhao-yun", side: "left" },
          { id: "sovereign", side: "right", scale: 1.35 },
          { id: "lu-zhishen", side: "far-left" },
          { id: "hu-sanniang", side: "far-right" },
        ],
        beats: [
          { t: 6, who: "", text: "第一擊，碎了三重殿門。第二擊，月亮暗了半分。" },
          { t: 26, who: "", text: "他的誓約一條一條亮起，像鎖鏈一樣纏上來——三人各斷其一。" },
          { t: 46, who: "", text: "「破約者，被約所噬。」灰帝的聲音第一次發顫。" },
          { t: 64, who: "", text: "呂布的戟、雙刀的月、禪杖的鐘、青釭的龍——四刃同時落下。" },
          { t: 82, who: "", text: "王座，空了。" },
        ],
        shots: [
          { t: 4, kind: "fight", focus: "zhao-yun", rival: "sovereign", winner: "rival", rivalPose: "strike" },
          { t: 24, kind: "closeup", focus: "sovereign", pose: "focus", crop: "face" },
          { t: 44, kind: "closeup", focus: "sovereign", pose: "windup", crop: "face" },
          { t: 62, kind: "fight", focus: "zhao-yun", rival: "sovereign", pose: "special" },
          { t: 80, kind: "push", focus: "zhao-yun" },
        ],
      },
      {
        id: "epilogue", chapter: "終章 · 平凡的黎明", duration: 90,
        backdrop: art.citadel, pan: "out",
        cast: [{ id: "zhao-yun", side: "left" }, { id: "hu-sanniang", side: "center" }, { id: "lu-zhishen", side: "right" }],
        beats: [
          { t: 8, who: "灰帝", text: "「月亮……落了。江湖，留給你們吧。朕怕的從來不是失去王座——是之後的寂靜。」" },
          { t: 32, who: "", text: "血月褪去。天脈城的門，開向一個平凡的黎明。" },
          { t: 46, who: "", text: "趙雲把青釭劍歸鞘，朝常山的方向行了一禮——師父，門守住了。" },
          { t: 58, who: "", text: "江湖，從此屬於善待它的人。誓言，踐行了。" },
          { t: 68, who: "", text: "半塊玉，仍貼在胸口。妹——下一道門，哥去找你。" },
          { t: 78, who: "", text: "——如果故事在這裡結束。" },
          { t: 86, who: "", text: "（第一集 完）" },
        ],
        shots: [
          { t: 4, kind: "closeup", focus: "sovereign", pose: "windup", crop: "face" },
          { t: 32, kind: "pan", from: "left" },
        ],
      },
    ],
  },
  {
    id: "ep2", number: "第二集", title: "裂口 · 廿賢殿",
    subtitle: "裂口將三俠擲入異世界，二十賢等待著他們",
    scenes: [
      {
        id: "rift", chapter: "序章 · 一息的黎明", duration: 95,
        backdrop: art.citadel, pan: "in", cast: [],
        beats: [
          { t: 5, who: "", text: "灰帝倒下之後的黎明，只維持了一次心跳。" },
          { t: 20, who: "", text: "他飲下的誓，有一筆還懸在半空——沒有落款的故事，不會自己結束。" },
          { t: 36, who: "", text: "一道金色的縫，在破碎的城門上空撕開，飲盡血月最後的光。" },
          { t: 52, who: "", text: "斬誓的人，被未完的墨追討。縫帶走了三個人，像河流帶走落葉。" },
          { t: 68, who: "裂口", text: "「詔令未完，故事改寫續篇——」" },
          { t: 80, who: "", text: "翠門關的風，甚麼都沒有留下。除了三個空了的兵器位。" },
          { t: 88, who: "", text: "趙雲按住胸口的半塊玉——被墨追討的，和他要找的，原來是同一筆。" },
        ],
      },
      {
        id: "corpse-street", chapter: "第一章 · 亂世街", duration: 90,
        backdrop: art.maze, pan: "right",
        cast: [{ id: "zhao-yun", side: "left" }, { id: "lu-zhishen", side: "right" }],
        beats: [
          { t: 6, who: "", text: "背上是石板。四面是霧，和一條散著舊煙味的街。" },
          { t: 26, who: "", text: "星象是錯的。銅錢上的年號，來自一個他們從未侍奉過的朝代。" },
          { t: 46, who: "", text: "離他們救下的那座關——大概一百年，或者兩百年。" },
          { t: 56, who: "", text: "而這個朝代的牆上，也貼著一紙寫得溫柔的約。名字不同，墨是同一種黑。" },
          { t: 68, who: "趙雲", text: "「那我們就用同樣的辦法，救這條街。起身的時候，看好彼此的背。」" },
          { t: 82, who: "", text: "霧的深處，有人早已備好簿冊，等著「估價」這三個流民。" },
        ],
        shots: [
          { t: 4, kind: "pan", from: "right" },
          { t: 24, kind: "push", focus: "zhao-yun" },
          { t: 62, kind: "closeup", focus: "zhao-yun", pose: "focus", crop: "face" },
        ],
      },
      {
        id: "inspectors", chapter: "第一章 · 廿賢的巡查者", duration: 90,
        backdrop: art.maze, pan: "left",
        cast: [
          { id: "jia-yucun", side: "far-left" },
          { id: "fan-jin", side: "left" },
          { id: "kuang-zhong", side: "right" },
          { id: "lu-su", side: "far-right" },
        ],
        beats: [
          { t: 6, who: "", text: "第一座營，帳中四人：賈雨村的算盤、范進的墨、匡忠的槍、魯肅的禮。" },
          { t: 28, who: "賈雨村", text: "「異世流民三名，估值……嗯，值得一局。」" },
          { t: 46, who: "", text: "他們不是惡人——他們是被詔令從各自的書頁裡撕出來的人。" },
          { t: 64, who: "", text: "一場牌局，鬆開一條綁著他們的線。線斷之處，他們想起自己的故事。" },
          { t: 78, who: "", text: "而故事提醒他們：更深處，還有一座殿。" },
        ],
        shots: [
          { t: 4, kind: "wide" },
          { t: 26, kind: "closeup", focus: "jia-yucun", pose: "focus", crop: "face" },
          { t: 44, kind: "pan", from: "left" },
        ],
      },
      {
        id: "hall", chapter: "第二章 · 廿賢殿", duration: 95,
        backdrop: art.citadel, pan: "in-slow",
        cast: [
          { id: "bao-zheng", side: "far-left" },
          { id: "di-renjie", side: "left" },
          { id: "song-jiang", side: "right" },
          { id: "wu-yong", side: "far-right" },
        ],
        beats: [
          { t: 6, who: "", text: "穿過大門：一座大如科舉考場的殿。二十張案，列成品字。" },
          { t: 28, who: "", text: "二十張臉，同時轉向他們——判官、相國、妃嬪、名妓、名將、名臣。" },
          { t: 50, who: "懿妃", text: "「閉卷裡的散頁們。詔令把我們集合於此，寫成一個較善的宫廷——也會這樣對你們。跪下，被溫柔地改寫；或者站著，打贏二十人，贏回去的橋。」" },
          { t: 78, who: "", text: "滿殿無聲。燈芯爆了一朵花。" },
        ],
        shots: [
          { t: 4, kind: "pan", from: "left" },
          { t: 26, kind: "wide" },
          { t: 48, kind: "closeup", focus: "empress-yixiu", pose: "focus", crop: "face" },
        ],
      },
      {
        id: "refuse", chapter: "第二章 · 不跪", duration: 65,
        backdrop: art.citadel, pan: "in",
        cast: [{ id: "zhao-yun", side: "center" }],
        beats: [
          { t: 8, who: "趙雲", text: "「寧可站著打完二十場，不跪著受一次審。」" },
          { t: 30, who: "", text: "「開屏吧——第一輪。」" },
          { t: 44, who: "", text: "二十張案，同時翻起。" },
        ],
        shots: [
          { t: 4, kind: "closeup", focus: "zhao-yun", pose: "focus", crop: "head" },
          { t: 28, kind: "closeup", focus: "zhao-yun", pose: "windup", crop: "face" },
          { t: 42, kind: "wide" },
        ],
      },
      {
        id: "lattice", chapter: "第二章 · 格子廳第一輪", duration: 90,
        backdrop: art.maze, pan: "right",
        cast: [
          { id: "xue-baochai", side: "far-left" },
          { id: "lin-daiyu", side: "left" },
          { id: "diaochan", side: "right" },
          { id: "yang-yuhuan", side: "far-right" },
        ],
        beats: [
          { t: 6, who: "", text: "廿賢離案，散入格子屏風的迷宮——絲袖、判官刃、半開的扇，藏在每一片後面。" },
          { t: 30, who: "", text: "燈最暗處，第一輪開始。" },
          { t: 48, who: "林黛玉", text: "「葬花的鋤，也葬得了刀客的銳氣。請。」" },
          { t: 66, who: "", text: "一屏一局。每贏一局，就有一個人從別人的故事裡，回到自己的故事裡。" },
          { t: 80, who: "", text: "二十張案，一張一張地空。" },
        ],
        shots: [
          { t: 4, kind: "pan", from: "right" },
          { t: 46, kind: "closeup", focus: "lin-daiyu", pose: "focus", crop: "face" },
          { t: 63, kind: "fight", focus: "zhao-yun", rival: "lin-daiyu" },
          { t: 78, kind: "wide" },
        ],
      },
      {
        id: "judges", chapter: "第三章 · 判官一脈", duration: 85,
        backdrop: art.citadel, pan: "left",
        cast: [
          { id: "jia-zheng", side: "left" },
          { id: "xun-yu", side: "center" },
          { id: "hu-sanniang", side: "right" },
        ],
        beats: [
          { t: 6, who: "", text: "賈政的家法、荀彧的布局、宋江的義、吳用的謀——判官一脈，以「理」為刃。" },
          { t: 30, who: "扈三娘", text: "「理是死的，人是活的。雙刀只跟活人講。」" },
          { t: 50, who: "", text: "牌桌之上，算無遺策的軍師，輸給了不肯按牌理出牌的刀。" },
          { t: 68, who: "吳用", text: "「……輸得不冤。回去我把這一局寫進書裡。」" },
        ],
        shots: [
          { t: 4, kind: "pan", from: "left" },
          { t: 28, kind: "closeup", focus: "hu-sanniang", pose: "focus", crop: "face" },
          { t: 47, kind: "fight", focus: "hu-sanniang", rival: "wu-yong" },
          { t: 66, kind: "closeup", focus: "wu-yong", pose: "windup", crop: "face" },
        ],
      },
      {
        id: "investigators", chapter: "第三章 · 斷獄之刀", duration: 80,
        backdrop: art.citadel, pan: "in",
        cast: [{ id: "bao-zheng", side: "left" }, { id: "di-renjie", side: "right" }],
        beats: [
          { t: 6, who: "包拯", text: "「本殿斷案百年，未見過不肯認罪的月亮。你們的案子——本官親自審。」" },
          { t: 30, who: "", text: "包龍圖的月牙額燈，照謊言；狄仁杰的推理，剝偽裝。" },
          { t: 50, who: "狄仁杰", text: "「真相只有一個：這座殿，本身就是偽證。」" },
          { t: 66, who: "", text: "斷獄者認出了獄。他們輸得一局，勝了一生。" },
        ],
        shots: [
          { t: 4, kind: "closeup", focus: "bao-zheng", pose: "focus", crop: "face" },
          { t: 28, kind: "pan", from: "right" },
          { t: 48, kind: "closeup", focus: "di-renjie", pose: "focus", crop: "face" },
        ],
      },
      {
        id: "court", chapter: "第三章 · 深宮一脈", duration: 85,
        backdrop: art.citadel, pan: "right",
        cast: [
          { id: "jia-yuanchun", side: "far-left" },
          { id: "wang-xifeng", side: "left" },
          { id: "zhen-huan", side: "right" },
          { id: "hua-fei", side: "far-right" },
        ],
        beats: [
          { t: 6, who: "", text: "元春的宮儀、熙鳳的算計、甄嬛的隱忍、華妃的驕焰——深宮一脈，各有一段未完的故事。" },
          { t: 30, who: "王熙鳳", text: "「從沒見過輸了還這麼開心的。也罷——刀客，替我看看宮牆外的天。」" },
          { t: 52, who: "", text: "一局終了，鳳姐倚案大笑；華妃擲扇；元春垂淚而笑。" },
          { t: 68, who: "", text: "「原來輸一次，比贏一輩子輕。」" },
        ],
        shots: [
          { t: 4, kind: "wide" },
          { t: 28, kind: "closeup", focus: "wang-xifeng", pose: "focus", crop: "face" },
          { t: 50, kind: "pan", from: "left" },
        ],
      },
      {
        id: "legends", chapter: "第三章 · 被撕出書頁的人", duration: 85,
        backdrop: art.river, pan: "in-slow",
        cast: [
          { id: "diaochan", side: "left" },
          { id: "yang-yuhuan", side: "center" },
          { id: "lin-daiyu", side: "right" },
        ],
        beats: [
          { t: 6, who: "", text: "貂蟬的裙、玉環的霓裳、黛玉的鋤、寶釵的扇——美人一脈，被詔令撕出自己的書頁。" },
          { t: 30, who: "楊玉環", text: "「霓裳一曲，從此只為自己跳。多謝你的刀。」" },
          { t: 50, who: "", text: "每斷一線，殿裡就亮一盞燈。二十盞——只剩最後一盞未亮。" },
          { t: 68, who: "", text: "殿的盡頭，是雲。雲上有一座橋。橋頭，站著一個笑著的人。" },
        ],
        shots: [
          { t: 4, kind: "pan", from: "left" },
          { t: 28, kind: "closeup", focus: "yang-yuhuan", pose: "focus", crop: "face" },
          { t: 48, kind: "push", focus: "diaochan" },
        ],
      },
      {
        id: "causeway", chapter: "終章 · 守橋人", duration: 90,
        backdrop: art.mountain, pan: "in",
        cast: [{ id: "zhao-yun", side: "left" }, { id: "zhao-min", side: "right" }],
        beats: [
          { t: 6, who: "趙敏", text: "「我的二十人，倒了你們十九個——詔令也快用完了。我是趙敏，最後的守橋人。回家的橋，跨過我的影子。」" },
          { t: 34, who: "趙敏", text: "「大殿安靜下來之後，我就一直等著這一局。等一個故事，來還它欠我的那一筆——肯等的人，才守得住門。」" },
          { t: 48, who: "", text: "師父的話。這世上聽過這句話的人，應該只剩兩個。趙雲握劍的手，慢慢收緊。" },
          { t: 58, who: "趙雲", text: "「……守橋人。這一局我非打不可。打完——你欠我一個答案。」" },
          { t: 74, who: "", text: "雙劍出鞘。雲棧之上，風停了。" },
        ],
        shots: [
          { t: 4, kind: "closeup", focus: "zhao-min", pose: "focus", crop: "face" },
          { t: 32, kind: "closeup", focus: "zhao-min", pose: "focus", crop: "face" },
          { t: 46, kind: "push", focus: "zhao-yun" },
          { t: 56, kind: "closeup", focus: "zhao-yun", pose: "focus", crop: "face" },
          { t: 74, kind: "fight", focus: "zhao-yun", rival: "zhao-min", rivalPose: "strike", winner: "rival" },
        ],
      },
      {
        id: "final", chapter: "終章 · 第二十張案", duration: 95,
        backdrop: art.mountain, pan: "in-slow",
        cast: [
          { id: "zhao-yun", side: "left" },
          { id: "zhao-min", side: "right" },
          { id: "hu-sanniang", side: "far-left" },
          { id: "lu-zhishen", side: "far-right" },
        ],
        beats: [
          { t: 6, who: "", text: "趙敏的劍走的是「謀」——每一招都留三條退路，每一條退路都是殺局。" },
          { t: 26, who: "", text: "三俠走的是「誓」——三件兵器，一條路。" },
          { t: 44, who: "", text: "第十九次交鋒。青釭劍的劍脊，挑落了她的袖扣——半塊玉，墜在兩人之間的雲上。" },
          { t: 60, who: "趙敏", text: "「……撿起來吧。斷口向你——是那年爐火邊，我先掰開的那一半。哥。」" },
          { t: 74, who: "趙雲", text: "「我找了你三道關、一座帝都、一百年。原來回家的橋，一直是你守的。」" },
          { t: 86, who: "", text: "兩塊半玉在劍脊上輕輕相扣。雲，開了。" },
        ],
        shots: [
          { t: 4, kind: "fight", focus: "zhao-min", rival: "zhao-yun", winner: "rival", rivalPose: "strike" },
          { t: 24, kind: "wide" },
          { t: 42, kind: "fight", focus: "zhao-yun", rival: "zhao-min", pose: "special" },
          { t: 58, kind: "closeup", focus: "zhao-min", pose: "focus", crop: "face" },
          { t: 72, kind: "closeup", focus: "zhao-yun", pose: "focus", crop: "face" },
          { t: 84, kind: "push", focus: "zhao-yun" },
        ],
      },
      {
        id: "home", chapter: "終章 · 歸途", duration: 95,
        backdrop: art.gate, pan: "out",
        cast: [{ id: "zhao-yun", side: "left" }, { id: "hu-sanniang", side: "center" }, { id: "lu-zhishen", side: "right" }],
        beats: [
          { t: 8, who: "趙敏", text: "「趁天還記得你們的名字，過橋吧。守橋的人，不能離橋——這是我用一百年學會的規矩。」" },
          { t: 24, who: "", text: "第二十張案，空了。棧下雲開——露出他們自己的早晨。" },
          { t: 40, who: "", text: "一百年，分毫未動。一座關，依然值得守。" },
          { t: 54, who: "", text: "趙雲回頭。妹妹在橋的那一端抬了抬手，像小時候催他回家吃飯。" },
          { t: 66, who: "", text: "橋頭與關下，隔著一百年，各站著一個趙家的守門人。師父那句話，兩兄妹各守了一半。" },
          { t: 78, who: "", text: "故事在他們身後，把自己摺好。" },
          { t: 88, who: "", text: "（第二集 完）" },
        ],
        shots: [
          { t: 4, kind: "closeup", focus: "zhao-min", pose: "focus", crop: "face" },
          { t: 22, kind: "pan", from: "right" },
          { t: 52, kind: "push", focus: "zhao-yun" },
        ],
      },
    ],
  },
];

/* ---------------- 動畫圖像包（docs/animation-image-pack-2026-10-05） ----------------
 *  人手繪 keyframe 直接做鏡頭：有幀嘅場景播繪製鏡頭（講嘢/眨眼用變體幀，
 *  有限動畫），決鬥七拍用逐拍幀；所有場景背景換專用場景板。 */
const PACK = "assets/animation";
const BG_PACK = {
  zhaovillage: "bg-village", prologue: "bg-gate-night", oath: "bg-refugee-camp",
  vanguard: "bg-gate-camp", warden: "bg-gate-courtyard", "act1-fall": "bg-gate-dawn",
  bamboo: "bg-bamboo", heron: "bg-river-mist", crossing: "bg-ferry",
  clouds: "bg-cloud-stairs", lubu: "bg-cloud-terrace", freed: "bg-cloud-terrace",
  bloodmoon: "bg-citadel-approach", throne: "bg-throne", "final-duel": "bg-throne-broken",
  epilogue: "bg-citadel-dawn",
  rift: "bg-rift", "corpse-street": "bg-other-street", inspectors: "bg-inspection",
  hall: "bg-twenty-hall", refuse: "bg-twenty-hall", lattice: "bg-lattice",
  judges: "bg-judges", investigators: "bg-court", court: "bg-garden", legends: "bg-garden",
  causeway: "bg-bridge", final: "bg-bridge", home: "bg-bridge-home",
};
for (const ep of EPISODES)
  for (const scene of ep.scenes) {
    const plate = BG_PACK[scene.id];
    if (plate) scene.backdrop = `${PACK}/background/${plate}.png`;
  }

const FRAME_PACK = {
  zhaovillage: [
    { t: 4, base: "shot/ep1-zhaovillage-s01" },
    { t: 18, base: "shot/ep1-zhaovillage-s02" },
    { t: 20, base: "insert/ep1-zhaovillage-insert-master-sword" },
    { t: 34, base: "shot/ep1-zhaovillage-s03" },
    { t: 36, base: "insert/ep1-zhaovillage-insert-sister-forge" },
    { t: 50, base: "shot/ep1-zhaovillage-s04" },
    { t: 66, base: "shot/ep1-zhaovillage-s05", talk: "expression/ep1-zhaovillage-s05-talk", blink: "expression/ep1-zhaovillage-s05-blink" },
    { t: 68, base: "insert/ep1-zhaovillage-insert-sister-half-jade" },
    { t: 84, base: "shot/ep1-zhaovillage-s06" },
    { t: 96, base: "shot/ep1-zhaovillage-s07" },
  ],
  prologue: [
    { t: 0, base: "shot/ep1-prologue-s01" },
    { t: 18, base: "shot/ep1-prologue-s02" },
    { t: 34, base: "shot/ep1-prologue-s03" },
    { t: 44, base: "shot/ep1-prologue-s04" },
    { t: 52, base: "shot/ep1-prologue-s05", talk: "expression/ep1-prologue-s05-talk", blink: "expression/ep1-prologue-s05-blink" },
    { t: 64, base: "shot/ep1-prologue-s06" },
  ],
  oath: [
    { t: 4, base: "shot/ep1-oath-s01" },
    { t: 18, base: "insert/ep1-oath-insert-staff-catches-whip" },
    { t: 32, base: "shot/ep1-oath-s02", talk: "expression/ep1-oath-s02-talk", blink: "expression/ep1-oath-s02-blink" },
    { t: 44, base: "shot/ep1-oath-s03" },
    { t: 58, base: "shot/ep1-oath-s04", talk: "expression/ep1-oath-s04-talk", blink: "expression/ep1-oath-s04-blink" },
    { t: 68, base: "shot/ep1-oath-s05" },
    { t: 70, base: "insert/ep1-oath-insert-three-protect" },
    { t: 80, base: "shot/ep1-oath-s06", talk: "expression/ep1-oath-s06-talk", blink: "expression/ep1-oath-s06-blink" },
    { t: 92, base: "shot/ep1-oath-s07" },
  ],
  vanguard: [
    { t: 2, base: "shot/ep1-vanguard-s01" },
    { t: 14, base: "shot/ep1-vanguard-s02" },
    { t: 28, base: "shot/ep1-vanguard-s03" },
    { t: 44, base: "shot/ep1-vanguard-s04", talk: "expression/ep1-vanguard-s04-talk", blink: "expression/ep1-vanguard-s04-blink" },
    { t: 74, base: "shot/ep1-vanguard-s06" },
  ],
  warden: [
    { t: 4, base: "shot/ep1-warden-s01", talk: "expression/ep1-warden-s01-talk", blink: "expression/ep1-warden-s01-blink" },
    { t: 26, base: "shot/ep1-warden-s02", talk: "expression/ep1-warden-s02-talk", blink: "expression/ep1-warden-s02-blink" },
    // t: 44 決鬥七拍 → FIGHT_FRAMES["warden:44"]
    { t: 66, base: "shot/ep1-warden-s04", until: 80 },  // t: 80 第二場決鬥 → FIGHT_FRAMES["warden:80"] 七拍幀
    { t: 68, base: "insert/ep1-warden-insert-monk-block", until: 80 },
  ],
  causeway: [
    { t: 4, base: "shot/ep2-causeway-s01", talk: "expression/ep2-causeway-s01-talk", blink: "expression/ep2-causeway-s01-blink" },
    { t: 32, base: "shot/ep2-causeway-s02", talk: "expression/ep2-causeway-s02-talk", blink: "expression/ep2-causeway-s02-blink" },
    { t: 46, base: "shot/ep2-causeway-s03" },
    { t: 56, base: "shot/ep2-causeway-s04", talk: "expression/ep2-causeway-s04-talk", blink: "expression/ep2-causeway-s04-blink", until: 74 },
    // t: 74 決鬥七拍 → FIGHT_FRAMES["causeway:74"]
  ],
  "act1-fall": [
    { t: 0, base: "shot/ep1-act1-fall-s01" },
    { t: 20.5, base: "shot/ep1-act1-fall-s02", talk: "expression/ep1-act1-fall-s02-talk", blink: "expression/ep1-act1-fall-s02-blink" },
    { t: 40, base: "shot/ep1-act1-fall-s03" },
    { t: 54, base: "shot/ep1-act1-fall-s04" },
  ],
  bamboo: [
    { t: 4, base: "shot/ep1-bamboo-s01" },
    { t: 22, base: "shot/ep1-bamboo-s02" },
    { t: 40, base: "shot/ep1-bamboo-s03", talk: "expression/ep1-bamboo-s03-talk", blink: "expression/ep1-bamboo-s03-blink" },
    { t: 58, base: "shot/ep1-bamboo-s04" },
    { t: 74, base: "shot/ep1-bamboo-s05" },
  ],
  heron: [
    { t: 4, base: "shot/ep1-heron-s01", talk: "expression/ep1-heron-s01-talk", blink: "expression/ep1-heron-s01-blink" },
    { t: 26, base: "shot/ep1-heron-s02" },
    { t: 46, base: "shot/ep1-heron-s03", talk: "expression/ep1-heron-s03-talk", blink: "expression/ep1-heron-s03-blink" },
    { t: 48, base: "insert/ep1-heron-insert-staff-bell", until: 63 },
    // t: 63 決鬥七拍 → FIGHT_FRAMES["heron:63"]
    { t: 78, base: "shot/ep1-heron-s05" },
  ],
  "act1-fall": [
    { t: 0, base: "shot/ep1-act1-fall-s01" },
    { t: 20.5, base: "shot/ep1-act1-fall-s02", talk: "expression/ep1-act1-fall-s02-talk", blink: "expression/ep1-act1-fall-s02-blink" },
    { t: 40, base: "shot/ep1-act1-fall-s03" },
    { t: 54, base: "shot/ep1-act1-fall-s04" },
  ],
  bamboo: [
    { t: 4, base: "shot/ep1-bamboo-s01" },
    { t: 22, base: "shot/ep1-bamboo-s02" },
    { t: 40, base: "shot/ep1-bamboo-s03", talk: "expression/ep1-bamboo-s03-talk", blink: "expression/ep1-bamboo-s03-blink" },
    { t: 58, base: "shot/ep1-bamboo-s04" },
    { t: 74, base: "shot/ep1-bamboo-s05" },
  ],
  heron: [
    { t: 4, base: "shot/ep1-heron-s01", talk: "expression/ep1-heron-s01-talk", blink: "expression/ep1-heron-s01-blink" },
    { t: 26, base: "shot/ep1-heron-s02" },
    { t: 46, base: "shot/ep1-heron-s03", talk: "expression/ep1-heron-s03-talk", blink: "expression/ep1-heron-s03-blink" },
    { t: 48, base: "insert/ep1-heron-insert-staff-bell", until: 63 },
    // t: 63 決鬥七拍 → FIGHT_FRAMES["heron:63"]
    { t: 78, base: "shot/ep1-heron-s05" },
  ],
  crossing: [
    { t: 0, base: "shot/ep1-crossing-s01" },
    { t: 24.5, base: "shot/ep1-crossing-s02", talk: "expression/ep1-crossing-s02-talk", blink: "expression/ep1-crossing-s02-blink" },
    { t: 44, base: "shot/ep1-crossing-s03" },
    { t: 58, base: "shot/ep1-crossing-s04" },
  ],
  clouds: [
    { t: 0, base: "shot/ep1-clouds-s01" },
    { t: 24.5, base: "shot/ep1-clouds-s02", talk: "expression/ep1-clouds-s02-talk", blink: "expression/ep1-clouds-s02-blink" },
    { t: 44, base: "shot/ep1-clouds-s03" },
    { t: 62, base: "shot/ep1-clouds-s04" },
  ],
  lubu: [
    { t: 4, base: "shot/ep1-lubu-s01", talk: "expression/ep1-lubu-s01-talk", blink: "expression/ep1-lubu-s01-blink", until: 26 },
    // t: 26 決鬥七拍 → FIGHT_FRAMES["lubu:26"]
    { t: 46, base: "shot/ep1-lubu-s03", until: 66 },
  ],
  lubu: [
    // t: 46 決鬥七拍 → FIGHT_FRAMES["lubu:46"]（standoff 在 PR #127）
    { t: 66, base: "shot/ep1-lubu-s04", talk: "expression/ep1-lubu-s04-talk", blink: "expression/ep1-lubu-s04-blink" },
    { t: 82, base: "shot/ep1-lubu-s05", talk: "expression/ep1-lubu-s05-talk", blink: "expression/ep1-lubu-s05-blink" },
  ],
  freed: [
    { t: 4, base: "shot/ep1-freed-s01", talk: "expression/ep1-freed-s01-talk", blink: "expression/ep1-freed-s01-blink" },
    { t: 18, base: "shot/ep1-freed-s02", talk: "expression/ep1-freed-s02-talk", blink: "expression/ep1-freed-s02-blink" },
    { t: 40, base: "shot/ep1-freed-s03" },
    { t: 58, base: "shot/ep1-freed-s04", talk: "expression/ep1-freed-s04-talk", blink: "expression/ep1-freed-s04-blink" },
    { t: 70, base: "shot/ep1-freed-s05" },
  ],
  bloodmoon: [
    { t: 4, base: "shot/ep1-bloodmoon-s01" },
    { t: 24, base: "shot/ep1-bloodmoon-s02", talk: "expression/ep1-bloodmoon-s02-talk", blink: "expression/ep1-bloodmoon-s02-blink", until: 44 },
    // t: 44 決鬥 → FIGHT_FRAMES["bloodmoon:44"]（缺拍退回 standoff）
  ],
  bloodmoon: [
    // t: 44 決鬥 → FIGHT_FRAMES["bloodmoon:44"]（standoff 在 PR #128；缺拍退回 standoff）
    { t: 64, base: "shot/ep1-bloodmoon-s04" },
  ],
  throne: [
    { t: 4, base: "shot/ep1-throne-s01", talk: "expression/ep1-throne-s01-talk", blink: "expression/ep1-throne-s01-blink" },
    { t: 32, base: "shot/ep1-throne-s02", talk: "expression/ep1-throne-s02-talk", blink: "expression/ep1-throne-s02-blink" },
    { t: 56, base: "shot/ep1-throne-s03" },
    { t: 72, base: "shot/ep1-throne-s04" },
  ],
  "final-duel": [
    // t: 4 決鬥七拍 → FIGHT_FRAMES["final-duel:4"]
    { t: 24, base: "shot/ep1-final-duel-s02", talk: "expression/ep1-final-duel-s02-talk", blink: "expression/ep1-final-duel-s02-blink" },
    { t: 44, base: "shot/ep1-final-duel-s03", talk: "expression/ep1-final-duel-s03-talk", blink: "expression/ep1-final-duel-s03-blink", until: 62 },
    // t: 62 決鬥七拍 → FIGHT_FRAMES["final-duel:62"]
    { t: 80, base: "shot/ep1-final-duel-s05" },
  ],
  epilogue: [
    { t: 4, base: "shot/ep1-epilogue-s01", talk: "expression/ep1-epilogue-s01-talk", blink: "expression/ep1-epilogue-s01-blink" },
    { t: 32, base: "shot/ep1-epilogue-s02" },
  ],
  rift: [
    { t: 0, base: "shot/ep2-rift-s01" },
    { t: 20, base: "shot/ep2-rift-s02" },
    { t: 36, base: "shot/ep2-rift-s03" },
    { t: 52, base: "shot/ep2-rift-s04" },
    { t: 68, base: "shot/ep2-rift-s05" },
    { t: 80, base: "shot/ep2-rift-s06" },
    { t: 88, base: "shot/ep2-rift-s07" },
  ],
  "corpse-street": [
    { t: 4, base: "shot/ep2-corpse-street-s01" },
    { t: 24, base: "shot/ep2-corpse-street-s02" },
    { t: 62, base: "shot/ep2-corpse-street-s03", talk: "expression/ep2-corpse-street-s03-talk", blink: "expression/ep2-corpse-street-s03-blink" },
  ],
  inspectors: [
    { t: 4, base: "shot/ep2-inspectors-s01" },
    { t: 26, base: "shot/ep2-inspectors-s02", talk: "expression/ep2-inspectors-s02-talk", blink: "expression/ep2-inspectors-s02-blink" },
    { t: 44, base: "shot/ep2-inspectors-s03" },
  ],
  hall: [
    { t: 4, base: "shot/ep2-hall-s01" },
    { t: 26, base: "shot/ep2-hall-s02" },
    { t: 48, base: "shot/ep2-hall-s03", talk: "expression/ep2-hall-s03-talk", blink: "expression/ep2-hall-s03-blink" },
  ],
  refuse: [
    { t: 4, base: "shot/ep2-refuse-s01", talk: "expression/ep2-refuse-s01-talk", blink: "expression/ep2-refuse-s01-blink" },
    { t: 28, base: "shot/ep2-refuse-s02", talk: "expression/ep2-refuse-s02-talk", blink: "expression/ep2-refuse-s02-blink" },
    { t: 42, base: "shot/ep2-refuse-s03" },
  ],
  lattice: [
    { t: 4, base: "shot/ep2-lattice-s01" },
    { t: 46, base: "shot/ep2-lattice-s02", talk: "expression/ep2-lattice-s02-talk", blink: "expression/ep2-lattice-s02-blink", until: 63 },
    // t: 63 決鬥七拍 → FIGHT_FRAMES["lattice:63"]
    { t: 78, base: "shot/ep2-lattice-s04" },
  ],
  judges: [
    { t: 4, base: "shot/ep2-judges-s01" },
    { t: 28, base: "shot/ep2-judges-s02", talk: "expression/ep2-judges-s02-talk", blink: "expression/ep2-judges-s02-blink", until: 47 },
    // t: 47 決鬥七拍 → FIGHT_FRAMES["judges:47"]
    { t: 66, base: "shot/ep2-judges-s04", talk: "expression/ep2-judges-s04-talk", blink: "expression/ep2-judges-s04-blink" },
  ],
  investigators: [
    { t: 4, base: "shot/ep2-investigators-s01", talk: "expression/ep2-investigators-s01-talk", blink: "expression/ep2-investigators-s01-blink" },
    { t: 28, base: "shot/ep2-investigators-s02" },
    { t: 48, base: "shot/ep2-investigators-s03", talk: "expression/ep2-investigators-s03-talk", blink: "expression/ep2-investigators-s03-blink" },
  ],
  court: [
    { t: 4, base: "shot/ep2-court-s01" },
    { t: 28, base: "shot/ep2-court-s02", talk: "expression/ep2-court-s02-talk", blink: "expression/ep2-court-s02-blink" },
    { t: 50, base: "shot/ep2-court-s03" },
  ],
  legends: [
    { t: 4, base: "shot/ep2-legends-s01" },
    { t: 28, base: "shot/ep2-legends-s02", talk: "expression/ep2-legends-s02-talk", blink: "expression/ep2-legends-s02-blink" },
    { t: 48, base: "shot/ep2-legends-s03" },
  ],
  final: [
    // t: 4 決鬥七拍 → FIGHT_FRAMES["final:4"]
    { t: 24, base: "shot/ep2-final-s02" },
    // t: 42 決鬥七拍 → FIGHT_FRAMES["final:42"]
    { t: 58, base: "shot/ep2-final-s04", talk: "expression/ep2-final-s04-talk", blink: "expression/ep2-final-s04-blink" },
    { t: 72, base: "shot/ep2-final-s05", talk: "expression/ep2-final-s05-talk", blink: "expression/ep2-final-s05-blink" },
    { t: 84, base: "shot/ep2-final-s06" },
  ],
  home: [
    { t: 4, base: "shot/ep2-home-s01", talk: "expression/ep2-home-s01-talk", blink: "expression/ep2-home-s01-blink" },
    { t: 22, base: "shot/ep2-home-s02" },
    { t: 52, base: "shot/ep2-home-s03" },
  ],
};

/** 決鬥七拍，以「場景:鏡頭時間」索引。standoff 用該鏡頭基礎幀。
 *  缺拍時退回 standoff，避免半套幀指到不存在的檔。 */
const FIGHT_FRAMES = {
  "causeway:74": {
    standoff: "shot/ep2-causeway-s05",
    windup: "fight/ep2-causeway-s05-windup",
    charge: "fight/ep2-causeway-s05-charge",
    impact: "fight/ep2-causeway-s05-impact",
    pass: "fight/ep2-causeway-s05-pass",
    hold: "fight/ep2-causeway-s05-hold",
    aftermath: "fight/ep2-causeway-s05-aftermath",
  },
  "vanguard:60": {
    standoff: "shot/ep1-vanguard-s05",
    windup: "fight/ep1-vanguard-s05-windup",
    charge: "fight/ep1-vanguard-s05-charge",
    impact: "fight/ep1-vanguard-s05-impact",
    pass: "fight/ep1-vanguard-s05-pass",
    hold: "fight/ep1-vanguard-s05-hold",
    aftermath: "fight/ep1-vanguard-s05-aftermath",
  },
  "warden:44": {
    standoff: "shot/ep1-warden-s03",
    windup: "fight/ep1-warden-s03-windup",
    charge: "fight/ep1-warden-s03-charge",
    impact: "fight/ep1-warden-s03-impact",
    pass: "fight/ep1-warden-s03-pass",
    hold: "fight/ep1-warden-s03-hold",
    aftermath: "fight/ep1-warden-s03-aftermath",
  },
  "warden:80": {
    standoff: "shot/ep1-warden-s05",
    windup: "fight/ep1-warden-s05-windup",
    charge: "fight/ep1-warden-s05-charge",
    impact: "fight/ep1-warden-s05-impact",
    pass: "fight/ep1-warden-s05-pass",
    hold: "fight/ep1-warden-s05-hold",
    aftermath: "fight/ep1-warden-s05-aftermath",
  },
  "final-duel:4": {
    standoff: "shot/ep1-final-duel-s01",
    windup: "fight/ep1-final-duel-s01-windup",
    charge: "fight/ep1-final-duel-s01-charge",
    impact: "fight/ep1-final-duel-s01-impact",
    pass: "fight/ep1-final-duel-s01-pass",
    hold: "fight/ep1-final-duel-s01-hold",
    aftermath: "fight/ep1-final-duel-s01-aftermath",
  },
  "lubu:46": {
    standoff: "shot/ep1-lubu-s03",
    windup: "fight/ep1-lubu-s03-windup",
    charge: "fight/ep1-lubu-s03-charge",
    impact: "fight/ep1-lubu-s03-impact",
    pass: "fight/ep1-lubu-s03-pass",
    hold: "fight/ep1-lubu-s03-hold",
    aftermath: "fight/ep1-lubu-s03-aftermath",
  },
  "bloodmoon:44": {
    standoff: "shot/ep1-bloodmoon-s03",
    windup: "fight/ep1-bloodmoon-s03-windup",
    charge: "fight/ep1-bloodmoon-s03-charge",
    impact: "fight/ep1-bloodmoon-s03-impact",
    pass: "fight/ep1-bloodmoon-s03-pass",
    hold: "fight/ep1-bloodmoon-s03-hold",
    aftermath: "fight/ep1-bloodmoon-s03-aftermath",
  },
  "final-duel:62": {
    standoff: "shot/ep1-final-duel-s04",
    windup: "fight/ep1-final-duel-s04-windup",
    charge: "fight/ep1-final-duel-s04-charge",
    impact: "fight/ep1-final-duel-s04-impact",
    pass: "fight/ep1-final-duel-s04-pass",
    hold: "fight/ep1-final-duel-s04-hold",
    aftermath: "fight/ep1-final-duel-s04-aftermath",
  },
  "heron:63": {
    standoff: "shot/ep1-heron-s04",
    windup: "fight/ep1-heron-s04-windup",
    charge: "fight/ep1-heron-s04-charge",
    impact: "fight/ep1-heron-s04-impact",
    pass: "fight/ep1-heron-s04-pass",
    hold: "fight/ep1-heron-s04-hold",
    aftermath: "fight/ep1-heron-s04-aftermath",
  },
  "lubu:26": {
    standoff: "shot/ep1-lubu-s02",
    windup: "fight/ep1-lubu-s02-windup",
    charge: "fight/ep1-lubu-s02-charge",
    impact: "fight/ep1-lubu-s02-impact",
    pass: "fight/ep1-lubu-s02-pass",
    hold: "fight/ep1-lubu-s02-hold",
    aftermath: "fight/ep1-lubu-s02-aftermath",
  },
  "lattice:63": {
    standoff: "shot/ep2-lattice-s03",
    windup: "fight/ep2-lattice-s03-windup",
    charge: "fight/ep2-lattice-s03-charge",
    impact: "fight/ep2-lattice-s03-impact",
    pass: "fight/ep2-lattice-s03-pass",
    hold: "fight/ep2-lattice-s03-hold",
    aftermath: "fight/ep2-lattice-s03-aftermath",
  },
  "judges:47": {
    standoff: "shot/ep2-judges-s03",
    windup: "fight/ep2-judges-s03-windup",
    charge: "fight/ep2-judges-s03-charge",
    impact: "fight/ep2-judges-s03-impact",
    pass: "fight/ep2-judges-s03-pass",
    hold: "fight/ep2-judges-s03-hold",
    aftermath: "fight/ep2-judges-s03-aftermath",
  },
  "final:4": {
    standoff: "shot/ep2-final-s01",
    windup: "fight/ep2-final-s01-windup",
    charge: "fight/ep2-final-s01-charge",
    impact: "fight/ep2-final-s01-impact",
    pass: "fight/ep2-final-s01-pass",
    hold: "fight/ep2-final-s01-hold",
    aftermath: "fight/ep2-final-s01-aftermath",
  },
  "final:42": {
    standoff: "shot/ep2-final-s03",
    windup: "fight/ep2-final-s03-windup",
    charge: "fight/ep2-final-s03-charge",
    impact: "fight/ep2-final-s03-impact",
    pass: "fight/ep2-final-s03-pass",
    hold: "fight/ep2-final-s03-hold",
    aftermath: "fight/ep2-final-s03-aftermath",
  },
};

/** 選當前 keyframe：有幀用幀（until = 幀嘅生效下限，過咗就跌返 sprite 鏡頭）；
 *  講嘢幀喺對白期間 ~2.4Hz 開合口、週期眨眼（有限動畫，全部由 clock 決定——
 *  seek 都係確定性重現）。baseKey 只計基礎幀，變體切換唔重啟鏡頭呼吸。 */
function frameFor(scene, local) {
  const frames = FRAME_PACK[scene.id];
  if (!frames) return null;
  let frame = null;
  for (const f of frames) if (local >= f.t) frame = f;
  if (!frame || (frame.until !== undefined && local >= frame.until)) return null;
  let src = frame.base;
  const speaking = frame.talk && local < frame.t + 14;
  const blinkNow = frame.blink && local % 4.3 < 0.14;
  if (blinkNow) src = frame.blink;
  else if (speaking && Math.floor((local - frame.t) * 2.4) % 2 === 0) src = frame.talk;
  return { baseKey: `${scene.id}:${frame.t}`, src: `${PACK}/${src}.png` };
}
/** 決戰七拍（研究自 chambara／武俠「一刀兩斷」與 sakuga 衝擊格文法）：
 *  對峙 stand-off（落花觸發）→ 蓄勢 wind-up → 突進 charge →
 *  交鋒 impact（衝擊格 + 定格 + 震屏）→ 擦身 pass（換位）→
 *  靜止 hold（背對背定格）→ 分勝 aftermath（傷口浮現、敗者倒下）。 */
const FIGHT_PHASES = [
  ["standoff", 3.0], ["windup", 2.0], ["charge", 0.7], ["impact", 0.4],
  ["pass", 1.4], ["hold", 2.4], ["aftermath", 2.8],
];
function fightPhase(elapsed) {
  let start = 0;
  for (const [name, length] of FIGHT_PHASES) {
    if (elapsed < start + length) return { name, index: FIGHT_PHASES.findIndex(([n]) => n === name) };
    start += length;
  }
  return { name: "aftermath", index: FIGHT_PHASES.length - 1 };
}

/* ---------------- 分鏡推導與播放器 ---------------- */
const $ = (id) => document.getElementById(id);
const fmt = (s) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
const total = (ep) => ep.scenes.reduce((sum, scene) => sum + scene.duration, 0);

/** 每場的鏡頭表：手寫 shots 優先；否則由節拍推導 —
 *  有講者 → 講者大頭（focus 蓄勢）；旁白 → 全景／橫搖交替。 */
const derivedShots = new WeakMap();
function shotsOf(scene) {
  if (scene.shots) return scene.shots;
  let shots = derivedShots.get(scene);
  if (shots) return shots;
  shots = [{ t: 0, kind: "wide" }];
  scene.beats.forEach((beat, i) => {
    const focus = SPEAKERS[beat.who];
    if (beat.shot && focus) shots.push({ t: Math.max(0, beat.t - 1.5), kind: "closeup", focus, pose: "focus", crop: "face", ...beat.shot });
    else if (focus) shots.push({ t: Math.max(0, beat.t - 1.5), kind: "closeup", focus, pose: "focus", crop: "face" });
    else if (i > 0) shots.push({ t: beat.t, kind: i % 2 ? "pan" : "wide", from: i % 4 === 1 ? "left" : "right" });
  });
  shots.sort((a, b) => a.t - b.t);
  derivedShots.set(scene, shots);
  return shots;
}

let episode = EPISODES[0];
let playing = false;
let clock = 0;
let lastTick = 0;
let speed = 1;

function sceneAt(time) {
  let start = 0;
  for (const scene of episode.scenes) {
    if (time < start + scene.duration) return { scene, start, local: time - start };
    start += scene.duration;
  }
  const last = episode.scenes.at(-1);
  return { scene: last, start: total(episode) - last.duration, local: last.duration };
}
function shotAt(scene, local) {
  let current = shotsOf(scene)[0];
  for (const shot of shotsOf(scene)) if (local >= shot.t) current = shot;
  return current;
}

function nameOf(id) {
  const entry = Object.entries(SPEAKERS).find(([, sid]) => sid === id);
  return entry ? entry[0] : id;
}

/** Shot/reverse-shot: within a scene, the first speaker takes screen-left
 *  (facing right), and each different speaker flips the side — the two sides
 *  of the conversation never face the same way (180-degree rule). */
const speakerSides = new Map();
function sideFor(scene, focus) {
  const last = speakerSides.get(scene.id);
  const side = last && last.focus !== focus && last.side === "left" ? "right"
    : last && last.focus !== focus && last.side === "right" ? "left"
    : last?.side || "left";
  speakerSides.set(scene.id, { focus, side });
  return side;
}

/** 把動作 asset 套上節點：單張直用；atlas 由 duel-poses 裁切。 */
function applyPoseArt(node, id, pose) {
  clearDuelPose(node);
  node.removeAttribute("style");
  const { src, atlas } = poseArt(id, pose || "focus");
  if (atlas) applyDuelPose(node, atlas, pose || "focus");
  else {
    node.src = src;
    node.style.objectFit = "contain";
  }
}

function render() {
  const { scene, local } = sceneAt(clock);
  $("episode-label").textContent = `${episode.number} · ${episode.title}`;
  $("chapter").textContent = scene.chapter;
  const totalS = total(episode);
  $("film-time").textContent = `${fmt(clock)} / ${fmt(totalS)}`;
  $("timer").textContent = `${fmt(clock)} / ${fmt(totalS)}`;
  $("progress").style.width = `${(clock / totalS) * 100}%`;
  const track = $("track");
  if (track) {
    track.style.setProperty("--progress", `${(clock / totalS) * 100}%`);
    track.setAttribute("aria-valuenow", String(Math.floor(clock)));
    track.setAttribute("aria-valuemin", "0");
    track.setAttribute("aria-valuemax", String(Math.floor(totalS)));
  }
  document.querySelectorAll("#chapters button").forEach((btn, i) =>
    btn.classList.toggle("current", episode.scenes[i] === scene));

  const stage = $("stage");
  if (stage.dataset.scene !== scene.id) {
    stage.dataset.scene = scene.id;
    const backdrop = stage.querySelector(".backdrop");
    backdrop.src = scene.backdrop;
    const cast = stage.querySelector(".cast");
    cast.innerHTML = "";
    for (const member of scene.cast) {
      const img = document.createElement("img");
      img.src = sprite(member.id);
      img.className = `actor side-${member.side}`;
      if (member.scale) img.style.setProperty("--scale", member.scale);
      img.style.animationDelay = `${member.delay || 0}s`;
      cast.appendChild(img);
    }
    stage.querySelector(".chapter-card").textContent = scene.chapter;
  }
  stage.querySelector(".chapter-card").classList.toggle("shown", local < 4);

  // 分鏡：當前鏡頭決定機位。切鏡硬切（cut dip）。
  const shot = shotAt(scene, local);
  // 圖像包優先：有手繪幀嘅鏡頭直接成圖出街（對白/眨眼用變體幀）；決鬥七拍幀優先過定鏡幀。
  const fightFrames = shot.kind === "fight" ? FIGHT_FRAMES[`${scene.id}:${shot.t}`] || null : null;
  const keyframe = fightFrames ? null : frameFor(scene, local);
  const onFrames = !!(keyframe || fightFrames);
  const shotKey = `${scene.id}:${shot.t}:${onFrames ? "frame" : shot.kind}:${shot.focus || ""}:${shot.rival || ""}`;
  if (stage.dataset.shotKey !== shotKey) {
    stage.dataset.shotKey = shotKey;
    stage.dataset.shot = onFrames ? "frame" : shot.kind;
    const closeup = stage.querySelector(".closeup");
    const duel = stage.querySelector(".duel-stage");
    closeup.hidden = onFrames || shot.kind !== "closeup";
    duel.hidden = onFrames || (shot.kind !== "duel" && shot.kind !== "fight");
    if (shot.kind === "closeup" && shot.focus) {
      const img = closeup.querySelector("img");
      const portrait = portraitSrc(shot.focus);
      const kind = portrait ? artKind(shot.focus) : "square";
      const crop = shot.crop || "face";
      if (portrait) {
        clearDuelPose(img);
        img.removeAttribute("style");
        img.className = "";
        img.src = portrait;
      } else {
        applyPoseArt(img, shot.focus, shot.pose);
        img.style.height = CROP_ZOOM.square[crop === "head" ? "face" : crop];
      }
      closeup.dataset.crop = crop;
      closeup.dataset.kind = kind;
      // 180 度軸線（shot/reverse-shot）：同一場戲兩個講者輪流講，左右機位對調。
      const speakerSide = sideFor(scene, shot.focus);
      closeup.dataset.side = speakerSide;
      closeup.querySelector(".plate").textContent = nameOf(shot.focus);
      // 頭部錨點（canvas 實測）：個頭永遠喺畫面入面，眼線落喺上面三分一。
      if (portrait) {
        applyAnchor(closeup, portrait, portrait, null, FACE_FOCUS[kind]);
      } else {
        const { file, regionOf, key } = anchorTargetOf(shot.focus, shot.pose || "focus");
        applyAnchor(closeup, key, file, regionOf, FACE_FOCUS.square);
      }
      restartAnimation(closeup, "cut");
    }
    if (!fightFrames && (shot.kind === "duel" || shot.kind === "fight")) {
      applyPoseArt(duel.querySelector("img.hero"), shot.focus, shot.focusPose || "focus");
      applyPoseArt(duel.querySelector("img.rival"), shot.rival, shot.rivalPose || "focus");
      duel.querySelector(".plate.hero").textContent = nameOf(shot.focus);
      duel.querySelector(".plate.rival").textContent = nameOf(shot.rival);
      duel.dataset.winner = shot.winner === "rival" ? "rival" : "hero";
      duel.dataset.phase = shot.kind === "fight" ? "standoff" : "clash";
      duel.dataset.shotT = String(shot.t);
      restartAnimation(duel, "cut");
    }
    const camera = stage.querySelector(".camera");
    if (camera) {
      const panKey = (p) => (p ? (p.startsWith("pan-") ? p : `pan-${p}`) : "pan-in");
      camera.dataset.camera = onFrames ? panKey(scene.pan)
        : shot.kind === "pan" ? `pan-${shot.from || "left"}`
        : shot.kind === "push" ? "push"
        : shot.kind === "wide" ? panKey(scene.pan.replace("-slow", ""))
        : panKey(scene.pan);
    }
  }

  // keyframe 層：基礎幀切換先重啟鏡頭微推近；講嘢/眨眼/決鬥拍數只換 src。
  const kfImg = stage.querySelector(".keyframe");
  const fightName = fightFrames ? fightFrames[fightPhase(local - shot.t).name] || fightFrames.standoff : null;
  const kfSrc = keyframe ? keyframe.src
    : fightName ? `${PACK}/${fightName}.png`
    : null;
  kfImg.hidden = !kfSrc;
  if (kfSrc) {
    if (kfImg.dataset.base !== (keyframe ? keyframe.baseKey : `fight:${shot.t}`)) {
      kfImg.dataset.base = keyframe ? keyframe.baseKey : `fight:${shot.t}`;
      restartAnimation(kfImg, "drift");
    }
    if (kfImg.dataset.src !== kfSrc) {
      kfImg.dataset.src = kfSrc;
      kfImg.src = kfSrc;
    }
  }

  // 決戰推進：按拍切 phase（蓄勢換招式、交鋒衝擊格、擦身換位、分勝倒下）。
  // 有手繪幀嘅決鬥（守橋人）唔行 sprite 舞台——phase 直接由 keyframe 層換幀。
  const duelStage = stage.querySelector(".duel-stage");
  if (!duelStage.hidden && shot.kind === "fight") {
    const elapsed = local - shot.t;
    const { name } = fightPhase(elapsed);
    if (duelStage.dataset.phase !== name) {
      duelStage.dataset.phase = name;
      const heroArt = duelStage.querySelector("img.hero");
      const rivalArt = duelStage.querySelector("img.rival");
      if (name === "standoff") {
        applyPoseArt(heroArt, shot.focus, shot.focusPose || "focus");
        applyPoseArt(rivalArt, shot.rival, shot.rivalPose || "focus");
      }
      if (name === "windup") {
        applyPoseArt(heroArt, shot.focus, "windup");
        applyPoseArt(rivalArt, shot.rival, "windup");
      }
      if (name === "impact" || name === "pass" || name === "hold" || name === "aftermath") {
        applyPoseArt(heroArt, shot.focus, shot.pose || "strike");
        applyPoseArt(rivalArt, shot.rival, shot.rivalPose || "windup");
        if (name === "impact") {
          restartAnimation(duelStage.querySelector(".impact-frame"), "boom");
          restartAnimation(duelStage.querySelector(".fx"), "slash");
          restartAnimation(duelStage, "quake");
        }
      }
    }
  }

  const beats = stage.querySelectorAll(".beat");
  for (let i = 0; i < beats.length; i++) {
    const node = beats[i];
    if (i < scene.beats.length) {
      const beat = scene.beats[i];
      const nextBeat = scene.beats[i + 1];
      const endTime = nextBeat ? Math.min(nextBeat.t, beat.t + 14) : Math.min(scene.duration, beat.t + 14);
      node.classList.toggle("shown", local >= beat.t && local < endTime);
      const cacheKey = `${scene.id}:${i}`;
      if (node.dataset.beat !== cacheKey) {
        node.dataset.beat = cacheKey;
        node.querySelector(".who").textContent = beat.who ? `${beat.who}：` : "";
        node.querySelector(".text").textContent = beat.text;
      }
    } else {
      node.classList.remove("shown");
      node.dataset.beat = "";
    }
  }
}

/** 重播一個 CSS 動畫 class（強制 reflow 重啟）。 */
function restartAnimation(node, cls) {
  node.classList.remove(cls);
  void node.offsetWidth;
  node.classList.add(cls);
}

function frame(now) {
  if (playing) {
    clock += Math.min(0.25, (now - lastTick) / 1000) * speed;
    const totalS = total(episode);
    if (clock >= totalS) { clock = totalS - 0.01; playing = false; $("play").textContent = "▶ 重播"; }
    render();
  }
  lastTick = now;
  requestAnimationFrame(frame);
}

function buildBeats(maxBeats) {
  const track = $("beats");
  track.innerHTML = "";
  for (let i = 0; i < maxBeats; i++) {
    const p = document.createElement("p");
    p.className = "beat";
    p.innerHTML = `<span class="who"></span><span class="text"></span>`;
    track.appendChild(p);
  }
}

function loadEpisode(next) {
  episode = next;
  clock = 0;
  playing = false;
  $("play").textContent = "▶ 播放";
  warmAnchors(next);
  buildBeats(Math.max(...episode.scenes.map((scene) => scene.beats.length)));
  const chapters = $("chapters");
  chapters.innerHTML = "";
  let start = 0;
  for (const scene of episode.scenes) {
    const sceneStart = start; // per-scene capture: every chapter seeks to its own beat
    const btn = document.createElement("button");
    btn.textContent = scene.chapter;
    btn.onclick = () => { clock = sceneStart + 0.01; render(); };
    btn.ondblclick = () => { clock = sceneStart + 0.01; playing = true; $("play").textContent = "⏸ 暫停"; render(); };
    chapters.appendChild(btn);
    start += scene.duration;
  }
  document.querySelectorAll(".episode-tab").forEach((tab) =>
    tab.classList.toggle("current", tab.dataset.ep === episode.id));
  $("stage").dataset.scene = "";
  $("stage").dataset.shotKey = "";
  // 完整腳本：章節 + 每拍（連分鏡提示），方便直接讀完整個故仔。
  const shotLine = (shot) =>
    !shot ? "〔全景〕"
    : shot.kind === "closeup" ? `〔大頭 · ${nameOf(shot.focus)}〕`
    : shot.kind === "fight" ? `〔決戰七拍 · ${nameOf(shot.focus)} 對 ${nameOf(shot.rival)}${shot.winner === "rival" ? " · 先失一招" : ""}〕`
    : shot.kind === "duel" ? `〔對峙 · ${nameOf(shot.focus)} 對 ${nameOf(shot.rival)}〕`
    : shot.kind === "push" ? `〔推近 · ${shot.focus ? nameOf(shot.focus) : "主體"}〕`
    : shot.kind === "pan" ? `〔橫搖 · ${shot.from === "left" ? "左→右" : "右→左"}〕`
    : "〔全景〕";
  $("transcript").textContent = `【${episode.number} · ${episode.title}】（約 ${Math.round(total(episode) / 60)} 分鐘）\n` +
    episode.scenes.map((scene) => {
      const shots = shotsOf(scene);
      const flow = scene.beats.map((beat) => {
        const shot = shots.filter((s) => s.t <= beat.t).at(-1);
        return `　${shotLine(shot)}${beat.who ? `${beat.who}：${beat.text}` : beat.text}`;
      }).join("\n");
      return `\n◆ ${scene.chapter}（${scene.duration} 秒 · ${scene.backdrop.replace("assets/", "")}）\n${flow}`;
    }).join("\n");
  render();
}

function boot() {
  document.querySelectorAll(".episode-tab").forEach((tab) => {
    tab.onclick = () => loadEpisode(EPISODES.find((ep) => ep.id === tab.dataset.ep));
  });
  const togglePlay = () => {
    if (clock >= total(episode) - 0.1) clock = 0;
    playing = !playing;
    $("play").textContent = playing ? "⏸ 暫停" : "▶ 播放";
    render();
  };
  $("play").onclick = togglePlay;
  $("stage").onclick = (e) => {
    if (e.target.closest("button, a")) return;
    togglePlay();
  };
  const speeds = [1, 2, 4, 8];
  $("speed").onclick = () => {
    const nextIdx = (speeds.indexOf(speed) + 1) % speeds.length;
    speed = speeds[nextIdx];
    $("speed").textContent = speed === 1 ? "×1" : `×${speed} 預覽`;
    $("speed").classList.toggle("fast", speed !== 1);
  };
  $("track").onclick = (event) => {
    const rect = event.currentTarget.getBoundingClientRect();
    clock = Math.max(0, Math.min(total(episode) - 0.01, ((event.clientX - rect.left) / rect.width) * total(episode)));
    render();
  };
  document.addEventListener("keydown", (event) => {
    if (["INPUT", "BUTTON", "SELECT", "TEXTAREA"].includes(event.target.tagName)) return;
    if (event.code === "Space" || event.code === "KeyK") {
      event.preventDefault();
      togglePlay();
    } else if (event.code === "ArrowLeft") {
      event.preventDefault();
      clock = Math.max(0, clock - 5);
      render();
    } else if (event.code === "ArrowRight") {
      event.preventDefault();
      clock = Math.min(total(episode) - 0.01, clock + 5);
      render();
    } else if (event.code === "KeyR") {
      event.preventDefault();
      clock = 0;
      playing = true;
      $("play").textContent = "⏸ 暫停";
      render();
    }
  });
  buildBeats(6);
  loadEpisode(EPISODES[0]);
  requestAnimationFrame((now) => { lastTick = now; frame(now); });
}
if (typeof document !== "undefined") boot();

export {
  SPEAKERS,
  FIGHT_PHASES,
  fightPhase,
  shotsOf,
  total,
  art,
  portraitSrc,
};
