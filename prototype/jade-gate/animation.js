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
import { resolveFrame } from "./capscreens-fight-designs/vanguard-layers.mjs";
import { footStyle, fxStyle, layoutFor } from "./capscreens-fight-designs/vanguard-place.mjs";
import { lifeScale, poseAt } from "./capscreens-fight-designs/vanguard-phrase.mjs";
import { sampleCamera, sampleShot } from "./capscreens-fight-designs/vanguard-shots.mjs";

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
          { t: 20, who: "師父", text: "「劍快，是末技；肯等，才是守門人。雲兒，記住——鑄劍的人，先要守得住爐火。」" },
          { t: 36, who: "妹妹", text: "「哥，你說劍要快。等我長大，要鑄一柄更亮的劍——亮到能照著全村回家的路。師父那句『肯等』，我記得比你熟呢。」" },
          { t: 52, who: "灰旗兵", text: "「奉詔宣讀：凡江湖血統，編入『較善之約』，兵器入庫，永世不得出關——名冊第一頁，趙家。這個名字，排頭一個。」" },
          { t: 68, who: "妹妹", text: "「哥，去找我。找不到——就守著一道，會讓我回家的門。半塊玉你拿著：斷口向著你，就當我還牽著你。」" },
          { t: 86, who: "趙雲", text: "「師父，劍我帶走了。妹——等我。天亮之前，我把路找回來。」" },
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
          { t: 18, who: "灰旗兵", text: "「詔書念給你們聽：凡江湖血統，編入『較善之約』——寫得多溫柔啊。不識字的，跪著聽。」" },
          { t: 34, who: "魯智深", text: "「別擠了，山脊上都是人。回頭看一眼吧——關樓上，已經換了灰色的旗。」" },
          { t: 44, who: "趙雲", text: "「身後，是回不去的村；手心裡，是妹妹的半塊玉。我沒有退路——也不需要有。」" },
          { t: 54, who: "趙雲", text: "「山河有盡，寸刃不移。這一次，換我們守門。」" },
          { t: 64, who: "魯智深", text: "「嘿——人潮裡還有肯逆著走的？這年頭，稀罕。」" },
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
          { t: 18, who: "灰旗兵", text: "「跑不動的老東西，也配佔路？鞭子伺候！」" },
          { t: 34, who: "魯智深", text: "「三日前，詔令燒了灑家的五台山。灑家的寺可以燒，人不能跪——要押走他們，先從灑家身上踏過去。」" },
          { t: 46, who: "扈三娘", text: "「讓開——閃開！囚車進了關，我追了三日三夜，還是慢了一步。擋我刀的，都是拆我家的門的人！」" },
          { t: 60, who: "扈三娘", text: "「我家的門，是被這道關拆的。拆門的人，一個都別想全身走。」" },
          { t: 70, who: "魯智深", text: "「三件兵器湊在一處——劍護老人，杖擋箭雨，刀來開路。女娃娃，有默契啊！」" },
          { t: 82, who: "趙雲", text: "「原來不是只有我一個，不肯讓門就這樣關上。兩位——同路嗎？」" },
          { t: 94, who: "三人", text: "「同路。不入帝都，誓不下山。」" },
          { t: 106, who: "趙雲", text: "「那就讓今晚成為地標——三個失去家門的人，把彼此，認成了門。」" },
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
          { t: 4, who: "關羽", text: "「此關……由某家鎮守。你們是誰？某家……又為何在此？」" },
          { t: 16, who: "守衛", text: "「關將軍是被『謄抄』過七遍的人——抄一遍名字，忘一段自己。你們這些流民，也快入冊了。」" },
          { t: 30, who: "關羽", text: "「青龍刀在此。至於握刀的是誰……連某家自己，都聽命於別人的墨。」" },
          { t: 46, who: "趙雲", text: "「關將軍，你的刀在替別人寫字。讓我幫你鬆一鬆腕。」" },
          { t: 62, who: "趙雲", text: "「讀招、拆招、以氣破式——這一局，替你贏回你自己。」" },
          { t: 76, who: "關羽", text: "「（長刀拄地）這一覺……睡得太久了。」" },
        ],
        shots: [
          { t: 2, kind: "wide" },
          { t: 14, kind: "push", focus: "guan-yu" },
          { t: 28, kind: "push", focus: "guan-yu" },
          { t: 44, kind: "closeup", focus: "zhao-yun", pose: "focus", crop: "face" },
          { t: 60, kind: "fight", focus: "zhao-yun", rival: "guan-yu", cut: "vanguard" },
          { t: 79, kind: "pan", from: "right" },
        ],
      },
      {
        id: "warden", chapter: "第一章 · 灰旗守將", duration: 95,
        backdrop: art.gate, pan: "in-slow",
        cast: [{ id: "zhao-yun", side: "left" }, { id: "warden", side: "right", scale: 1.25 }],
        beats: [
          { t: 6, who: "灰旗守將", text: "「常山的年輕劍士……為了一個不顧你的帝國，流血到死？」" },
          { t: 28, who: "趙雲", text: "「帝國欠的賬，江湖來收。你的關，今日換主人。」" },
          { t: 46, who: "灰旗守將", text: "「巨戟劈樓又如何——你這貼地的小子，專挑本將的手腕！」" },
          { t: 68, who: "魯智深", text: "「第二式更狠？好——禪杖硬接！虎口裂了，灑家笑著接！」" },
          { t: 84, who: "灰旗守將", text: "「這一跪……不是輸給你們。是輸給關外，那些不肯熄的燈。」" },
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
          { t: 6, who: "扈三娘", text: "「守將倒了——翠門關，回到百姓手裡了！」" },
          { t: 22, who: "關羽", text: "「墨跡散了，我想起自己是誰了。前面的路，一起走。」" },
          { t: 40, who: "魯智深", text: "「茶棚一壺茶的工夫，江湖上多了幾個名字。這種茶，灑家喜歡。」" },
          { t: 54, who: "趙雲", text: "「抬頭看——血月，只是暗了一分。路還長，走吧。」" },
        ],
      },
      {
        id: "bamboo", chapter: "第二章 · 竹林低語", duration: 85,
        backdrop: art.bamboo, pan: "left",
        cast: [{ id: "hu-sanniang", side: "left" }, { id: "shadow-assassin", side: "right", delay: 1 }],
        beats: [
          { t: 5, who: "", text: "過了關，是竹林。竹子會說話——用箭、用絲、用你聽不見的琴音。" },
          { t: 24, who: "影刺客", text: "「（霧中低語）箭在筍霧裡，絲在露水下——過路的人，把命留下來買路。」" },
          { t: 42, who: "扈三娘", text: "「霧裡的東西，交給我的雙刀。你們只管走直線。」" },
          { t: 60, who: "趙雲", text: "「淺灘慢了步速，箭雨卻密了——背靠背！一步一步，把竹林走成路。」" },
          { t: 76, who: "魯智深", text: "「琴聲停了。停琴的地方，站著一個看不見的人——灑家最不喜歡，看不見的對手。」" },
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
          { t: 28, who: "夜鷺", text: "「看不見又如何？我聽得見血的方向——絲弦封三路，毒霧封第四路。三把好兵器，乖乖躺下吧。」" },
          { t: 48, who: "魯智深", text: "「以杖作鐘——鐘聲一起，就亂了她琴音的拍子！盲眼的，看你還聽不聽得見！」" },
          { t: 66, who: "扈三娘", text: "「拍子一亂，盲者的世界就碎了——雙刀自側翼落下，如月分海！」" },
          { t: 80, who: "夜鷺", text: "「琴落地，弦未斷。這一局，算你們的。」" },
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
          { t: 5, who: "武松", text: "「河的對岸，被詔令改寫的英雄一個一個醒來——打虎的、擂鼓的、執旗的，都在。」" },
          { t: 26, who: "武松", text: "「既然醒了，就別再跪。你們去哪，我去哪。」" },
          { t: 44, who: "魯智深", text: "「渡船破浪——船頭立著的，已經不止三個身影了。」" },
          { t: 58, who: "趙雲", text: "「血月，又暗了一分。每多一個醒來的人，它就再暗一分。」" },
        ],
      },
      {
        id: "clouds", chapter: "第三章 · 滄嵐雲階", duration: 85,
        backdrop: art.mountain, pan: "in-slow",
        cast: [{ id: "lu-zhishen", side: "left" }, { id: "canglan-monk", side: "right" }],
        beats: [
          { t: 5, who: "魯智深", text: "「滄嵐山的雲階，一級一級行上去——鐵僧攔路，鐘聲當盾。都抖擻精神！」" },
          { t: 26, who: "魯智深", text: "「同是出家人，你的鐘渡不了他。讓我的杖試試。」" },
          { t: 44, who: "魯智深", text: "「雲裡落石，風裡藏刀——走一步，還一步。灑家開路，你們跟上。」" },
          { t: 62, who: "趙雲", text: "「雲階盡頭——方天畫戟插在石裡。戟的主人，眼睛是灰色的。……呂將軍？」" },
        ],
      },
      {
        id: "lubu", chapter: "第三章 · 咒將呂布", duration: 95,
        backdrop: art.mountain, pan: "in",
        cast: [{ id: "zhao-yun", side: "left" }, { id: "lu-bu-rival", side: "right", scale: 1.3 }],
        beats: [
          { t: 6, who: "呂布", text: "「灰帝的詛咒餵著我的戟。要斷咒，先斷我——來。」" },
          { t: 28, who: "呂布", text: "「戟風過處，雲退三尺！小子的劍快——本爺的戟，更快！」" },
          { t: 48, who: "魯智深", text: "「禪杖壓肩！三件兵器織成一張網——將軍，你逃不出自己的咒。」" },
          { t: 68, who: "趙雲", text: "「網收緊的一刻，青釭點在眉心——不是殺，是斬咒。呂布，回來！」" },
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
          { t: 42, who: "呂布", text: "「抬頭看。血月懸在城上——那不是天象，是他的硯。飲的，都是天下人的誓。」" },
          { t: 60, who: "趙雲", text: "「那就打翻它。墨再深，也深不過寫它的人心。」" },
          { t: 72, who: "呂布", text: "「飛將軍並轡而行——雲開處，帝都在望。這一程，本爺的戟，跟你們走。」" },
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
          { t: 5, who: "天脈侍者", text: "「天脈城在血月下開著門——吾主早知你們要來。氣漩沿城牆唱歌，唱的是送葬的歌。」" },
          { t: 26, who: "趙雲", text: "「那就讓他看我們走進去。他毀掉的每一個誓，都在月亮這一邊等著。」" },
          { t: 46, who: "翠衛", text: "「玉衛列陣，供奉結印。牌局一場接一場——讀招者生，硬拼者死。」" },
          { t: 66, who: "灰帝", text: "「（大殿深處）來了。……朕等這一筆，等了很久。抬頭吧——讓朕看看，砍朕的墨的人。」" },
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
          { t: 58, who: "灰帝", text: "「朕起身了——血月，也跟著朕起身。」" },
          { t: 74, who: "趙雲", text: "「王座之後……是沒有邊的暗。他在等月亮落下——我們，就在這之前。」" },
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
          { t: 6, who: "灰帝", text: "「第一擊，碎三重殿門；第二擊，月亮暗了半分——爾等的劍，倒是配得上朕的墨。」" },
          { t: 26, who: "灰帝", text: "「看好了——爾等砍斷的每一個誓，此刻一條一條亮起，像鎖鏈一樣纏上來。跪下的，朕免他一死。」" },
          { t: 46, who: "灰帝", text: "「破約者……被約所噬！這是朕親筆寫的規矩——爾等，也要試嗎？！」（聲音第一次發顫）" },
          { t: 64, who: "呂布", text: "「戟、月、鐘、龍——四刃，同時落下！」" },
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
          { t: 32, who: "趙雲", text: "「血月褪了……天脈城的門，開向一個平凡的黎明。走吧——趁燈還亮著。」" },
          { t: 46, who: "趙雲", text: "「（歸鞘，朝常山一禮）師父——門，守住了。」" },
          { t: 58, who: "魯智深", text: "「江湖從此屬於善待它的人。誓言——踐行了。」" },
          { t: 68, who: "趙雲", text: "「半塊玉還貼在胸口。妹——下一道門，哥去找你。」" },
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
          { t: 20, who: "關羽", text: "「看天上——他飲下的誓，還有一筆懸在半空。沒有落款的故事，不會自己結束。」" },
          { t: 36, who: "趙雲", text: "「那道金縫，飲盡了血月最後的光。所有人——離開城門！」" },
          { t: 52, who: "扈三娘", text: "「他們三個——被帶走了！像河流帶走落葉……」" },
          { t: 68, who: "裂口", text: "「詔令未完，故事改寫續篇——」" },
          { t: 80, who: "關羽", text: "「翠門關的風，甚麼都沒留下。除了三個空了的兵器位，和一塊貼著體溫的半玉。」" },
          { t: 88, who: "趙雲", text: "「（墜落中，按住胸口）被墨追討的，和我要找的……原來是同一筆。妹，等我。」" },
        ],
      },
      {
        id: "corpse-street", chapter: "第一章 · 亂世街", duration: 90,
        backdrop: art.maze, pan: "right",
        cast: [{ id: "zhao-yun", side: "left" }, { id: "lu-zhishen", side: "right" }],
        beats: [
          { t: 6, who: "魯智深", text: "「背上是石板，四面是霧——還有一條散著舊煙味的街。這裡，不是天脈城。」" },
          { t: 26, who: "扈三娘", text: "「星象是錯的。看這枚銅錢——年號來自我們從未侍奉過的朝代。」" },
          { t: 46, who: "趙雲", text: "「離我們救下的那座關——大概一百年，或者兩百年。我們，跌過了時間。」" },
          { t: 56, who: "扈三娘", text: "「牆上這紙約——名字不同，墨，是同一種黑。」" },
          { t: 68, who: "趙雲", text: "「那我們就用同樣的辦法，救這條街。起身的時候，看好彼此的背。」" },
          { t: 82, who: "賈雨村", text: "「（霧的深處）有趣。異世流民三名……備好簿冊，等他們自己走進估值。」" },
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
          { t: 6, who: "賈雨村", text: "「第一座營，帳中四人——本官的算盤、范進的墨、匡忠的槍、魯肅的禮。流民，報到。」" },
          { t: 28, who: "賈雨村", text: "「異世流民三名，估值……嗯，值得一局。」" },
          { t: 46, who: "魯智深", text: "「他們不是惡人——是被詔令從各自書頁裡撕出來的人。跟當年關前那些，一樣。」" },
          { t: 64, who: "趙雲", text: "「一場牌局，鬆開一條綁著他們的線——線斷之處，他們想起了自己的故事。」" },
          { t: 78, who: "賈雨村", text: "「（收起算盤）去吧，往深處走——那座殿，等這個故事等了很久了。」" },
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
          { t: 28, who: "懿妃", text: "「二十張臉，同時轉向你們——判官、相國、妃嬪、名將、名臣。散頁們，好大的膽子。」" },
          { t: 50, who: "懿妃", text: "「閉卷裡的散頁們。詔令把我們集合於此，寫成一個較善的宫廷——也會這樣對你們。跪下，被溫柔地改寫；或者站著，打贏二十人，贏回去的橋。」" },
          { t: 78, who: "趙雲", text: "「滿殿無聲——燈芯爆了一朵花。看來，我們的答案，他們不喜歡。」" },
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
          { t: 44, who: "扈三娘", text: "「二十張案，同時翻起——來得好！我的刀，等不及了。」" },
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
          { t: 6, who: "林黛玉", text: "「廿賢離案，散入格子屏風的迷宮——絲袖、判官刃、半開的扇，藏在每一片後面。散頁們，入陣吧。」" },
          { t: 30, who: "貂蟬", text: "「燈最暗處，第一輪開始——請吧，刀客們。」" },
          { t: 48, who: "林黛玉", text: "「葬花的鋤，也葬得了刀客的銳氣。請。」" },
          { t: 66, who: "扈三娘", text: "「一屏一局。每贏一局，就有一個人，從別人的故事裡回到自己的故事裡。」" },
          { t: 80, who: "吳用", text: "「二十張案，一張一張地空——這一輪，散頁贏了。」" },
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
          { t: 6, who: "吳用", text: "「賈政的家法、荀彧的布局、宋江的義、在下的謀——判官一脈，以『理』為刃。散頁們，講理嗎？」" },
          { t: 30, who: "扈三娘", text: "「理是死的，人是活的。雙刀只跟活人講。」" },
          { t: 50, who: "吳用", text: "「牌桌之上，在下算無遺策——卻輸給了不肯按牌理出牌的刀。有意思。」" },
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
          { t: 30, who: "狄仁杰", text: "「月牙額燈照謊言，在下的推理剝偽裝——開棺驗屍之前，先驗這座殿。」" },
          { t: 50, who: "狄仁杰", text: "「真相只有一個：這座殿，本身就是偽證。」" },
          { t: 66, who: "包拯", text: "「斷獄者認出了獄……本官輸這一局，勝這一生。去吧——最後的案，在雲上。」" },
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
          { t: 6, who: "王熙鳳", text: "「元春的宮儀、我的算計、甄嬛的隱忍、華妃的驕焰——深宮一脈，各有各的戲。看戲吧。」" },
          { t: 30, who: "王熙鳳", text: "「從沒見過輸了還這麼開心的。也罷——刀客，替我看看宮牆外的天。」" },
          { t: 52, who: "王熙鳳", text: "「一局終了——看：我倚案大笑，華妃擲扇，元春垂淚而笑。」" },
          { t: 68, who: "王熙鳳", text: "「原來輸一次，比贏一輩子輕。」" },
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
          { t: 6, who: "楊玉環", text: "「貂蟬的裙、我的霓裳、黛玉的鋤、寶釵的扇——美人一脈，被詔令撕出了自己的書頁。」" },
          { t: 30, who: "楊玉環", text: "「霓裳一曲，從此只為自己跳。多謝你的刀。」" },
          { t: 50, who: "貂蟬", text: "「每斷一線，殿裡就亮一盞燈。二十盞——只剩最後一盞，未亮。」" },
          { t: 68, who: "趙雲", text: "「殿的盡頭是雲，雲上有座橋——橋頭，站著一個笑著的人。……那身形，好熟。」" },
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
          { t: 48, who: "趙雲", text: "「師父的話……這世上聽過這句話的人，應該只剩兩個。（握劍的手，慢慢收緊）」" },
          { t: 58, who: "趙雲", text: "「……守橋人。這一局我非打不可。打完——你欠我一個答案。」" },
          { t: 74, who: "扈三娘", text: "「雙劍出鞘，雲棧之上，風停了。大哥——我們看著你。」" },
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
          { t: 6, who: "趙敏", text: "「我的劍，走的是『謀』——每一招留三條退路，每一條退路，都是殺局。」" },
          { t: 26, who: "趙雲", text: "「我們走的是『誓』——三件兵器，一條路。」" },
          { t: 44, who: "趙敏", text: "……袖扣。你挑落的，是我的袖扣——" },
          { t: 60, who: "趙敏", text: "「……撿起來吧。斷口向你——是那年爐火邊，我先掰開的那一半。哥。」" },
          { t: 74, who: "趙雲", text: "「我找了你三道關、一座帝都、一百年。原來回家的橋，一直是你守的。」" },
          { t: 86, who: "趙敏", text: "「兩塊半玉，在劍脊上輕輕相扣……哥，雲開了。回家吧。」" },
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
          { t: 24, who: "扈三娘", text: "「第二十張案，空了——棧下雲開，露出他們自己的早晨。」" },
          { t: 40, who: "魯智深", text: "「一百年，分毫未動。一座關——依然值得守。」" },
          { t: 54, who: "趙雲", text: "「（回頭）妹——保重。你抬手的樣子，還像小時候，催我回家吃飯。」" },
          { t: 66, who: "趙敏", text: "「橋頭與關下，隔著一百年，各站著一個趙家的守門人——師父那句話，我們兄妹，各守了一半。」" },
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
    { t: 66, base: "shot/ep1-warden-s04", talk: "expression/ep1-warden-s04-talk", blink: "expression/ep1-warden-s04-blink", until: 80 },  // t: 80 第二場決鬥 → FIGHT_FRAMES["warden:80"] 七拍幀
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
    // t: 46 決鬥七拍 → FIGHT_FRAMES["lubu:46"]（standoff 在 PR #127）
    { t: 46, base: "shot/ep1-lubu-s03", until: 66 },
    { t: 66, base: "shot/ep1-lubu-s04", talk: "expression/ep1-lubu-s04-talk", blink: "expression/ep1-lubu-s04-blink" },
    { t: 68, base: "insert/ep1-lubu-insert-curse-release" },
    { t: 82, base: "shot/ep1-lubu-s05", talk: "expression/ep1-lubu-s05-talk", blink: "expression/ep1-lubu-s05-blink" },
  ],
  freed: [
    { t: 4, base: "shot/ep1-freed-s01", talk: "expression/ep1-freed-s01-talk", blink: "expression/ep1-freed-s01-blink" },
    { t: 18, base: "shot/ep1-freed-s02", talk: "expression/ep1-freed-s02-talk", blink: "expression/ep1-freed-s02-blink" },
    { t: 20, base: "insert/ep1-freed-insert-historian-ink" },
    { t: 40, base: "shot/ep1-freed-s03" },
    { t: 58, base: "shot/ep1-freed-s04", talk: "expression/ep1-freed-s04-talk", blink: "expression/ep1-freed-s04-blink" },
    { t: 70, base: "shot/ep1-freed-s05" },
  ],
  bloodmoon: [
    { t: 4, base: "shot/ep1-bloodmoon-s01" },
    { t: 24, base: "shot/ep1-bloodmoon-s02", talk: "expression/ep1-bloodmoon-s02-talk", blink: "expression/ep1-bloodmoon-s02-blink", until: 44 },
    // t: 44 決鬥七拍 → FIGHT_FRAMES["bloodmoon:44"]（standoff、windup、charge 在 PR #128）
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
    { t: 64, base: "insert/ep1-final-duel-insert-four-weapons" },
    { t: 80, base: "shot/ep1-final-duel-s05" },
  ],
  epilogue: [
    { t: 4, base: "shot/ep1-epilogue-s01", talk: "expression/ep1-epilogue-s01-talk", blink: "expression/ep1-epilogue-s01-blink" },
    { t: 32, base: "shot/ep1-epilogue-s02" },
    { t: 46, base: "insert/ep1-epilogue-insert-sheathe-bow" },
  ],
  rift: [
    { t: 0, base: "shot/ep2-rift-s01" },
    { t: 20, base: "shot/ep2-rift-s02" },
    { t: 20, base: "insert/ep2-rift-insert-unfinished-decree" },
    { t: 36, base: "shot/ep2-rift-s03" },
    { t: 52, base: "shot/ep2-rift-s04" },
    { t: 52, base: "insert/ep2-rift-insert-three-fall" },
    { t: 68, base: "shot/ep2-rift-s05" },
    { t: 80, base: "shot/ep2-rift-s06" },
    { t: 88, base: "shot/ep2-rift-s07" },
  ],
  "corpse-street": [
    { t: 4, base: "shot/ep2-corpse-street-s01" },
    { t: 24, base: "shot/ep2-corpse-street-s02" },
    { t: 26, base: "insert/ep2-corpse-street-insert-strange-coin" },
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
    { t: 28, base: "insert/ep2-hall-insert-twenty-seats" },
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
    { t: 52, base: "insert/ep2-court-insert-court-release" },
  ],
  legends: [
    { t: 4, base: "shot/ep2-legends-s01" },
    { t: 28, base: "shot/ep2-legends-s02", talk: "expression/ep2-legends-s02-talk", blink: "expression/ep2-legends-s02-blink" },
    { t: 48, base: "shot/ep2-legends-s03" },
    { t: 50, base: "insert/ep2-legends-insert-nineteen-lamps" },
  ],
  final: [
    // t: 4 決鬥七拍 → FIGHT_FRAMES["final:4"]
    { t: 24, base: "shot/ep2-final-s02" },
    // t: 42 決鬥七拍 → FIGHT_FRAMES["final:42"]
    { t: 44, base: "insert/ep2-final-insert-jade-falls" },
    { t: 58, base: "shot/ep2-final-s04", talk: "expression/ep2-final-s04-talk", blink: "expression/ep2-final-s04-blink" },
    { t: 60, base: "insert/ep2-final-insert-sister-recognition" },
    { t: 72, base: "shot/ep2-final-s05", talk: "expression/ep2-final-s05-talk", blink: "expression/ep2-final-s05-blink" },
    { t: 84, base: "shot/ep2-final-s06" },
    { t: 86, base: "insert/ep2-final-insert-jade-reunites" },
  ],
  home: [
    { t: 4, base: "shot/ep2-home-s01", talk: "expression/ep2-home-s01-talk", blink: "expression/ep2-home-s01-blink" },
    { t: 22, base: "shot/ep2-home-s02" },
    { t: 52, base: "shot/ep2-home-s03" },
    { t: 54, base: "insert/ep2-home-insert-farewell-reverse" },
    { t: 66, base: "insert/ep2-home-insert-two-gatekeepers" },
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
  "lubu:46": {
    standoff: "shot/ep1-lubu-s03",
    windup: "fight/ep1-lubu-s03-windup",
    charge: "fight/ep1-lubu-s03-charge",
    impact: "fight/ep1-lubu-s03-impact",
    pass: "fight/ep1-lubu-s03-pass",
    hold: "fight/ep1-lubu-s03-hold",
    aftermath: "fight/ep1-lubu-s03-aftermath",
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

function motionReduced() {
  return typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function clashRel(src) {
  const mark = "ep1-vanguard/";
  const i = src.indexOf(mark);
  return i < 0 ? src : src.slice(i + mark.length);
}

function paintFighter(id, shadowId, src, slot, frame, who, pw, ph, ghost) {
  const el = $(id);
  if (!el) return;
  const shadow = shadowId ? $(shadowId) : null;
  if (!src || !slot) {
    el.hidden = true;
    if (shadow) shadow.hidden = true;
    return;
  }
  el.hidden = false;
  if (el.dataset.src !== src) {
    el.dataset.src = src;
    el.src = src;
  }
  const ready = el.complete && el.naturalWidth > 0 && el.src.includes(clashRel(src).split("/").pop());
  const box = footStyle(
    clashRel(src),
    slot,
    ready ? pw : 0,
    ready ? ph : 0,
    ready ? el.naturalWidth : 0,
    ready ? el.naturalHeight : 0,
  );
  el.style.height = box.height;
  el.style.bottom = box.bottom;
  el.style.left = box.left;
  el.style.transformOrigin = box.origin;
  if (!motionReduced()) {
    const scale = lifeScale(frame.phase);
    const life = { y: Math.sin(performance.now() / 480) * 2.2 * scale, rot: 0 };
    const pose = poseAt(frame, who, life, { x: 0, y: 0 });
    if (ghost) {
      pose.x = (pose.x || 0) + (who === "hero" ? -16 : 16);
      pose.blur = (pose.blur || 0) + 0.35;
      el.style.opacity = "0.42";
    }
    const filters = [];
    const motion = frame.motion?.[who];
    const changing = motion && motion.from !== motion.to && motion.blend > 0.001;
    if (changing) {
      pose.blur = 0;
      pose.skew = (pose.skew || 0) * 0.2;
      el.style.opacity = String(1 - motion.blend);
    } else el.style.opacity = "";
    if (pose.blur) filters.push(`blur(${pose.blur.toFixed(2)}px)`);
    el.style.filter = filters.join(" ");
    el.style.transform = `translate(${(pose.x || 0).toFixed(2)}px, ${(pose.y || 0).toFixed(2)}px) rotate(${(pose.rot || 0).toFixed(2)}deg) skewX(${(pose.skew || 0).toFixed(2)}deg) scale(${pose.sx || 1})`;
  }
  if (shadow) {
    shadow.hidden = false;
    shadow.style.left = `${slot.x}%`;
    shadow.style.bottom = `${(100 - slot.foot).toFixed(2)}%`;
    shadow.style.width = `${Math.max(10, slot.h * 0.28).toFixed(2)}%`;
  }
}

function paintClashSmear(mainId, smearId, motion, srcFrom, srcTo, slot, frame, who, pw, ph) {
  const smear = $(smearId);
  const main = $(mainId);
  if (!smear) return;
  const changing = motion && motion.from !== motion.to && motion.blend > 0.001 && srcTo && slot;
  if (!changing) {
    smear.hidden = true;
    smear.style.opacity = "0";
    return;
  }
  smear.hidden = false;
  if (smear.dataset.src !== srcTo) {
    smear.dataset.src = srcTo;
    smear.src = srcTo;
  }
  const ready = smear.complete && smear.naturalWidth > 0;
  const box = footStyle(
    clashRel(srcTo),
    slot,
    ready ? pw : 0,
    ready ? ph : 0,
    ready ? smear.naturalWidth : 0,
    ready ? smear.naturalHeight : 0,
  );
  smear.style.height = box.height;
  smear.style.bottom = box.bottom;
  smear.style.left = box.left;
  smear.style.transformOrigin = box.origin;
  const pose = poseAt(frame, who, { y: 0, rot: 0 }, { x: 0, y: 0 });
  smear.style.opacity = String(motion.blend);
  const filters = [];
  if (pose.blur) filters.push(`blur(${pose.blur.toFixed(2)}px)`);
  smear.style.filter = filters.join(" ");
  smear.style.transform = `translate(${(pose.x || 0).toFixed(2)}px, ${(pose.y || 0).toFixed(2)}px) rotate(${(pose.rot || 0).toFixed(2)}deg) skewX(${(pose.skew || 0).toFixed(2)}deg) scale(${pose.sx || 1})`;
  if (main) main.style.opacity = String(1 - motion.blend);
}

/** Gate Vanguard on the animation page: the layered phrase, not the seven held plates. */
function paintClash(elapsed) {
  const { shot, local } = sampleShot(Math.max(0, elapsed));
  const frame = resolveFrame(shot.id, local);
  const cam = $("clash-cam");
  if (!frame || !cam) return;
  if (!motionReduced()) {
    let view = sampleCamera(shot, local);
    if (frame.phase === "stop") {
      const holdKey = `${shot.id}:${frame.heroPose}`;
      if (cam.dataset.holdKey !== holdKey) {
        cam.dataset.holdKey = holdKey;
        cam.dataset.held = JSON.stringify(view);
      }
      view = JSON.parse(cam.dataset.held);
    } else cam.dataset.holdKey = "";
    cam.style.transformOrigin = `${view.x}% ${view.y}%`;
    cam.style.transform = `scale(${view.zoom})`;
  }
  const flash = $("clash-flash");
  const bg = $("clash-bg");
  if (frame.flash) {
    if (flash) {
      flash.hidden = false;
      if (flash.dataset.src !== frame.flash) {
        flash.dataset.src = frame.flash;
        flash.src = frame.flash;
      }
    }
    if (bg) bg.hidden = true;
    for (const id of ["clash-hero", "clash-rival", "clash-hero-smear", "clash-rival-smear", "clash-fx", "clash-light"]) {
      const el = $(id);
      if (el) el.hidden = true;
    }
    return;
  }
  if (flash) flash.hidden = true;
  if (bg) {
    bg.hidden = false;
    if (bg.dataset.src !== frame.bg) {
      bg.dataset.src = frame.bg;
      bg.src = frame.bg;
    }
  }
  const layout = layoutFor(shot.id, local, shot.ms, {
    hero: frame.heroPose,
    rival: frame.rivalPose,
  });
  const pw = cam.clientWidth;
  const ph = cam.clientHeight;
  paintFighter("clash-hero", "clash-shadow-hero", frame.heroFrom || frame.hero, layout?.hero, frame, "hero", pw, ph, false);
  paintFighter("clash-rival", "clash-shadow-rival", frame.rivalFrom || frame.rival, layout?.rival, frame, "rival", pw, ph, false);
  paintClashSmear("clash-hero", "clash-hero-smear", frame.motion?.hero, frame.heroFrom, frame.heroTo, layout?.hero, frame, "hero", pw, ph);
  paintClashSmear("clash-rival", "clash-rival-smear", frame.motion?.rival, frame.rivalFrom, frame.rivalTo, layout?.rival, frame, "rival", pw, ph);
  const light = $("clash-light");
  if (light && layout?.hero && frame.motion?.hero?.light) {
    const body = frame.motion.hero;
    light.hidden = false;
    light.style.left = `${layout.hero.x + (body.smear || 0) * 6}%`;
    light.style.top = `${(layout.hero.foot - layout.hero.h * 0.52).toFixed(2)}%`;
    light.style.opacity = String(body.hold ? 0.55 : 0.22 + (body.smear || 0) * 0.6);
  } else if (light) light.hidden = true;
  const fx = $("clash-fx");
  const box = frame.fx ? fxStyle(layout) : null;
  if (fx) {
    fx.hidden = !box;
    if (box) {
      if (fx.dataset.src !== frame.fx) {
        fx.dataset.src = frame.fx;
        fx.src = frame.fx;
      }
      fx.style.left = box.left;
      fx.style.top = box.top;
      fx.style.width = box.width;
      fx.style.height = box.height;
    }
  }
  const clash = $("clash");
  const hitKey = `${shot.id}:${frame.phase}:${frame.heroPose}`;
  if (frame.phase === "stop" && clash && clash.dataset.hit !== hitKey) {
    clash.dataset.hit = hitKey;
    if (!motionReduced()) restartAnimation(clash, "bump");
  }
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
  const clashOn = shot.cut === "vanguard";
  const fightFrames = shot.kind === "fight" && !clashOn ? FIGHT_FRAMES[`${scene.id}:${shot.t}`] || null : null;
  const keyframe = clashOn || fightFrames ? null : frameFor(scene, local);
  const onFrames = !!(keyframe || fightFrames || clashOn);
  const shotKey = `${scene.id}:${shot.t}:${clashOn ? "clash" : onFrames ? "frame" : shot.kind}:${shot.focus || ""}:${shot.rival || ""}`;
  if (stage.dataset.shotKey !== shotKey) {
    stage.dataset.shotKey = shotKey;
    stage.dataset.shot = clashOn ? "clash" : onFrames ? "frame" : shot.kind;
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
  const clash = $("clash");
  if (clash) {
    clash.hidden = !clashOn;
    if (clashOn) paintClash((local - shot.t) * 1000);
  }

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
