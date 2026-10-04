/**
 * 四人の刃 — 兩集動畫 Demo（每集約 20 分鐘 · 分鏡版）
 * Episode 1「破帝」：三俠於古代擊敗灰帝的完整經過。
 * Episode 2「裂口 · 廿賢殿」：裂口將三俠擲入異世界，遇上二十賢的故事。
 *
 * 分鏡語言：每場由鏡頭（shots）組成 — wide 全景、pan 橫搖、push 推近、
 * closeup 講話大頭（裁切動作 asset：focus/windup 蓄勢、strike/special 出招）、
 * duel 對峙雙機位。講話節拍自動切講者大頭；動作節拍可指名用招式 asset。
 */

import manifest from "./docs/asset-manifest.json" with { type: "json" };
import { loadDuelPoses, applyDuelPose } from "./src/platform/duel-poses.js";

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
};

/** 大頭鏡用畫：頭像 `{id}.png` 最靚 → 動作單張 → atlas 裁切 → sprite 推近。 */
function portraitSrc(id) {
  const file = `assets/${id}.png`;
  return manifest.some((row) => row.file === file && row.runtimeApproved !== false) ? file : null;
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
        id: "prologue", chapter: "序章 · 血月照關", duration: 75,
        backdrop: art.gate, pan: "in", cast: [],
        beats: [
          { t: 4, who: "", text: "灰旗軍來的那一夜，翠門關的燈火逐一熄滅。" },
          { t: 18, who: "", text: "朝廷的詔書寫得溫柔：凡江湖血統，編入「較善之約」，永世不得出關。" },
          { t: 34, who: "", text: "逃難的百姓翻過山脊，回頭望——關樓上，已換了灰色的旗。" },
          { t: 50, who: "趙雲", text: "「山河有盡，寸刃不移。這一次，換我們守門。」" },
          { t: 62, who: "", text: "三個人，三柄兵器，逆著人潮，走向關去。" },
        ],
      },
      {
        id: "oath", chapter: "第一章 · 三俠結誓", duration: 70,
        backdrop: art.gate, pan: "left",
        cast: [
          { id: "zhao-yun", side: "left" },
          { id: "lu-zhishen", side: "center" },
          { id: "hu-sanniang", side: "right" },
        ],
        beats: [
          { t: 5, who: "", text: "常山劍士趙雲——青釭劍出，如白龍過澗。" },
          { t: 20, who: "", text: "花和尚魯智深——水磨禪杖六十斤，專打不平。" },
          { t: 35, who: "", text: "日月雙刀扈三娘——紅纓一轉，敵陣自開。" },
          { t: 50, who: "三人", text: "「不入帝都，誓不下山。」" },
          { t: 60, who: "", text: "誓言落地之處，後來成了江湖的地標。" },
        ],
        shots: [
          { t: 4, kind: "pan", from: "left" },
          { t: 18, kind: "push", focus: "lu-zhishen" },
          { t: 33, kind: "push", focus: "hu-sanniang" },
          { t: 48, kind: "wide" },
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
          { t: 5, who: "", text: "關前的第一道營，由被詔令改寫的英雄鎮守——他們自己，已不記得自己是誰。" },
          { t: 24, who: "", text: "青龍偃月刀攔路。刀是好刀，握刀的手，卻聽命於灰帝的墨。" },
          { t: 42, who: "趙雲", text: "「關將軍，你的刀在替別人寫字。讓我幫你鬆一鬆腕。」" },
          { t: 60, who: "", text: "一場牌局般的決鬥：讀招、拆招、以氣破式。守衛倒下之處，營火四散。" },
          { t: 74, who: "", text: "被斬斷的不只是繩，還有寫在血裡的約。" },
        ],
        shots: [
          { t: 4, kind: "wide" },
          { t: 22, kind: "push", focus: "guan-yu" },
          { t: 40, kind: "closeup", focus: "zhao-yun", pose: "focus", crop: "bust" },
          { t: 58, kind: "duel", focus: "zhao-yun", rival: "guan-yu", pose: "strike", at: 64 },
          { t: 72, kind: "pan", from: "right" },
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
          { t: 4, kind: "closeup", focus: "warden", pose: "focus", crop: "bust" },
          { t: 26, kind: "closeup", focus: "zhao-yun", pose: "focus", crop: "bust" },
          { t: 44, kind: "duel", focus: "zhao-yun", rival: "warden", pose: "strike", at: 48 },
          { t: 66, kind: "closeup", focus: "lu-zhishen", pose: "windup", crop: "face" },
          { t: 82, kind: "duel", focus: "hu-sanniang", rival: "warden", pose: "special", at: 86 },
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
          { t: 40, kind: "closeup", focus: "hu-sanniang", pose: "focus", crop: "bust" },
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
          { t: 46, kind: "closeup", focus: "lu-zhishen", pose: "windup", crop: "bust" },
          { t: 64, kind: "duel", focus: "hu-sanniang", rival: "night-heron", pose: "special", at: 68 },
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
          { t: 4, kind: "closeup", focus: "lu-bu-rival", pose: "focus", crop: "bust" },
          { t: 26, kind: "duel", focus: "zhao-yun", rival: "lu-bu-rival", pose: "strike", at: 32 },
          { t: 46, kind: "duel", focus: "hu-sanniang", rival: "lu-bu-rival", pose: "strike", at: 52 },
          { t: 66, kind: "closeup", focus: "zhao-yun", pose: "special", crop: "bust" },
          { t: 82, kind: "closeup", focus: "lu-bu-rival", pose: "windup", crop: "face" },
        ],
      },
      {
        id: "freed", chapter: "第三章 · 同行", duration: 65,
        backdrop: art.mountain, pan: "out",
        cast: [{ id: "lu-bu-rival", side: "left" }, { id: "zhao-yun", side: "right" }],
        beats: [
          { t: 6, who: "呂布", text: "「詛咒已斷，我的戟自己作主。天脈城一戰——算我一份。」" },
          { t: 26, who: "", text: "飛將軍並轡而行。雲開處，帝都已經看得見了。" },
          { t: 44, who: "", text: "血月懸在城上，像一隻不肯眨的眼。" },
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
          { t: 24, kind: "closeup", focus: "zhao-yun", pose: "focus", crop: "bust" },
          { t: 44, kind: "duel", focus: "zhao-yun", rival: "jade-sentinel", pose: "strike", at: 50 },
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
          { t: 4, kind: "closeup", focus: "sovereign", pose: "focus", crop: "face" },
          { t: 32, kind: "closeup", focus: "zhao-yun", pose: "focus", crop: "bust" },
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
          { t: 4, kind: "duel", focus: "zhao-yun", rival: "sovereign", pose: "strike", at: 8 },
          { t: 24, kind: "closeup", focus: "sovereign", pose: "focus", crop: "bust" },
          { t: 44, kind: "closeup", focus: "sovereign", pose: "windup", crop: "face" },
          { t: 62, kind: "duel", focus: "zhao-yun", rival: "sovereign", pose: "special", at: 68 },
          { t: 80, kind: "push", focus: "zhao-yun" },
        ],
      },
      {
        id: "epilogue", chapter: "終章 · 平凡的黎明", duration: 90,
        backdrop: art.citadel, pan: "out",
        cast: [{ id: "zhao-yun", side: "left" }, { id: "hu-sanniang", side: "center" }, { id: "lu-zhishen", side: "right" }],
        beats: [
          { t: 8, who: "灰帝", text: "「月亮……落了。江湖，留給你們吧。朕怕的從來不是失去王座——是之後的寂靜。」" },
          { t: 34, who: "", text: "血月褪去。天脈城的門，開向一個平凡的黎明。" },
          { t: 52, who: "", text: "江湖，從此屬於善待它的人。誓言，踐行了。" },
          { t: 68, who: "", text: "——如果故事在這裡結束。" },
          { t: 78, who: "", text: "（第一集 完）" },
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
        id: "rift", chapter: "序章 · 一息的黎明", duration: 80,
        backdrop: art.citadel, pan: "in", cast: [],
        beats: [
          { t: 6, who: "", text: "灰帝倒下之後的黎明，只維持了一次心跳。" },
          { t: 24, who: "", text: "一道金色的縫，在破碎的城門上空撕開——飲盡血月最後的光。" },
          { t: 42, who: "", text: "然後它帶走了三個人。像河流帶走落葉。" },
          { t: 60, who: "裂口", text: "「詔令未完，故事改寫續篇——」" },
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
          { t: 64, who: "趙雲", text: "「那我們就用同樣的辦法，救這條街。起身的時候，看好彼此的背。」" },
          { t: 80, who: "", text: "霧的深處，有人早已備好簿冊，等著「估價」這三個流民。" },
        ],
        shots: [
          { t: 4, kind: "pan", from: "right" },
          { t: 24, kind: "push", focus: "zhao-yun" },
          { t: 62, kind: "closeup", focus: "zhao-yun", pose: "focus", crop: "bust" },
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
          { t: 26, kind: "closeup", focus: "jia-yucun", pose: "focus", crop: "bust" },
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
          { t: 48, kind: "closeup", focus: "empress-yixiu", pose: "focus", crop: "bust" },
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
          { t: 4, kind: "closeup", focus: "zhao-yun", pose: "focus", crop: "bust" },
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
          { t: 46, kind: "closeup", focus: "lin-daiyu", pose: "focus", crop: "bust" },
          { t: 64, kind: "duel", focus: "zhao-yun", rival: "lin-daiyu", pose: "strike", at: 68 },
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
          { t: 28, kind: "closeup", focus: "hu-sanniang", pose: "focus", crop: "bust" },
          { t: 48, kind: "duel", focus: "hu-sanniang", rival: "wu-yong", pose: "strike", at: 54 },
          { t: 66, kind: "closeup", focus: "wu-yong", pose: "windup", crop: "bust" },
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
          { t: 48, kind: "closeup", focus: "di-renjie", pose: "focus", crop: "bust" },
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
          { t: 28, kind: "closeup", focus: "wang-xifeng", pose: "focus", crop: "bust" },
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
          { t: 36, who: "趙敏", text: "「大殿安靜下來之後，我就一直等著這一局。」" },
          { t: 56, who: "趙雲", text: "「在自家門前笑著的守橋人——那就打一場值得過橋的。你之後，雲開。」" },
          { t: 74, who: "", text: "雙劍出鞘。雲棧之上，風停了。" },
        ],
        shots: [
          { t: 4, kind: "closeup", focus: "zhao-min", pose: "focus", crop: "bust" },
          { t: 34, kind: "closeup", focus: "zhao-min", pose: "focus", crop: "face" },
          { t: 54, kind: "closeup", focus: "zhao-yun", pose: "focus", crop: "bust" },
          { t: 72, kind: "duel", focus: "zhao-yun", rival: "zhao-min", pose: "windup", at: 76 },
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
          { t: 28, who: "", text: "三俠走的是「誓」——三件兵器，一條路。" },
          { t: 48, who: "", text: "第十九次交鋒，雙劍與青釭同時遞出。" },
          { t: 66, who: "趙敏", text: "「好劍……羈絆斷了——你也感覺到了吧？這座殿是籠，橋本來就是你們的。」" },
          { t: 84, who: "", text: "雲，開了。" },
        ],
        shots: [
          { t: 4, kind: "duel", focus: "zhao-min", rival: "zhao-yun", pose: "strike", at: 10 },
          { t: 26, kind: "wide" },
          { t: 46, kind: "duel", focus: "zhao-yun", rival: "zhao-min", pose: "special", at: 52 },
          { t: 64, kind: "closeup", focus: "zhao-min", pose: "windup", crop: "face" },
        ],
      },
      {
        id: "home", chapter: "終章 · 歸途", duration: 95,
        backdrop: art.gate, pan: "out",
        cast: [{ id: "zhao-yun", side: "left" }, { id: "hu-sanniang", side: "center" }, { id: "lu-zhishen", side: "right" }],
        beats: [
          { t: 8, who: "趙敏", text: "「趁天還記得你們的名字，過橋吧。」" },
          { t: 26, who: "", text: "第二十張案，空了。棧下雲開——露出他們自己的早晨。" },
          { t: 46, who: "", text: "一百年，分毫未動。一座關，依然值得守。" },
          { t: 62, who: "", text: "二十位賢者，站在橋的那一端，各自回到自己的書頁裡。" },
          { t: 76, who: "", text: "故事在他們身後，把自己摺好。" },
          { t: 86, who: "", text: "（第二集 完）" },
        ],
        shots: [
          { t: 4, kind: "closeup", focus: "zhao-min", pose: "focus", crop: "bust" },
          { t: 24, kind: "pan", from: "right" },
        ],
      },
    ],
  },
];

/* ---------------- 分鏡推導與播放器 ---------------- */
const $ = (id) => document.getElementById(id);
const fmt = (s) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
const total = (ep) => ep.scenes.reduce((sum, scene) => sum + scene.duration, 0);

/** 每場的鏡頭表：手寫 shots 優先；否則由節拍推導 —
 *  有講者 → 講者大頭（focus 蓄勢）；旁白 → 全景／橫搖交替。 */
function shotsOf(scene) {
  if (scene.shots) return scene.shots;
  const shots = [{ t: 0, kind: "wide" }];
  scene.beats.forEach((beat, i) => {
    const focus = SPEAKERS[beat.who];
    if (focus) shots.push({ t: Math.max(0, beat.t - 1.5), kind: "closeup", focus, pose: "focus", crop: "bust" });
    else if (i > 0) shots.push({ t: beat.t, kind: i % 2 ? "pan" : "wide", from: i % 4 === 1 ? "left" : "right" });
  });
  return shots.sort((a, b) => a.t - b.t);
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

/** 把動作 asset 套上節點：單張直用；atlas 由 duel-poses 裁切。 */
function applyPoseArt(node, id, pose) {
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
  const shotKey = `${scene.id}:${shot.t}:${shot.kind}:${shot.focus || ""}`;
  if (stage.dataset.shotKey !== shotKey) {
    stage.dataset.shotKey = shotKey;
    stage.dataset.shot = shot.kind;
    const closeup = stage.querySelector(".closeup");
    const duel = stage.querySelector(".duel-stage");
    closeup.hidden = shot.kind !== "closeup";
    duel.hidden = shot.kind !== "duel";
    if (shot.kind === "closeup" && shot.focus) {
      const img = closeup.querySelector("img");
      const portrait = portraitSrc(shot.focus);
      if (portrait) {
        img.removeAttribute("style");
        img.className = "";
        img.src = portrait;
        img.style.objectFit = "cover";
        img.style.objectPosition = shot.crop === "face" ? "50% 8%" : "50% 16%";
      } else applyPoseArt(img, shot.focus, shot.pose);
      closeup.dataset.crop = shot.crop || "bust";
      closeup.querySelector(".plate").textContent = nameOf(shot.focus);
      restartAnimation(closeup, "cut");
    }
    if (shot.kind === "duel") {
      applyPoseArt(duel.querySelector("img.hero"), shot.focus, shot.pose);
      applyPoseArt(duel.querySelector("img.rival"), shot.rival, shot.pose === "special" ? "windup" : "focus");
      duel.querySelector(".plate.hero").textContent = nameOf(shot.focus);
      duel.querySelector(".plate.rival").textContent = nameOf(shot.rival);
      restartAnimation(duel.querySelector(".fx"), shot.pose === "special" ? "flash" : "slash");
      restartAnimation(duel, "cut");
    }
    const camera = stage.querySelector(".camera");
    if (camera) {
      camera.dataset.camera = shot.kind === "pan" ? `pan-${shot.from || "left"}`
        : shot.kind === "push" ? "push"
        : shot.kind === "wide" ? "pan-" + scene.pan.replace("-slow", "")
        : scene.pan;
    }
  }

  const beats = stage.querySelectorAll(".beat");
  scene.beats.forEach((beat, i) => {
    const node = beats[i];
    node.classList.toggle("shown", local >= beat.t && local < beat.t + 14);
    const cacheKey = `${scene.id}:${i}`;
    if (node.dataset.beat !== cacheKey) {
      node.dataset.beat = cacheKey;
      node.querySelector(".who").textContent = beat.who ? `${beat.who}：` : "";
      node.querySelector(".text").textContent = beat.text;
    }
  });
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
  buildBeats(Math.max(...episode.scenes.map((scene) => scene.beats.length)));
  const chapters = $("chapters");
  chapters.innerHTML = "";
  let start = 0;
  for (const scene of episode.scenes) {
    const sceneStart = start; // per-scene capture: every chapter seeks to its own beat
    const btn = document.createElement("button");
    btn.textContent = scene.chapter;
    btn.onclick = () => { clock = sceneStart + 0.01; render(); };
    btn.ondblclick = () => { clock = sceneStart + 0.01; playing = true; render(); };
    chapters.appendChild(btn);
    start += scene.duration;
  }
  document.querySelectorAll(".episode-tab").forEach((tab) =>
    tab.classList.toggle("current", tab.dataset.ep === episode.id));
  $("stage").dataset.scene = "";
  $("stage").dataset.shotKey = "";
  // 完整腳本：章節 + 每拍（連分鏡提示），方便直接讀完整個故仔。
  const shotLine = (shot) =>
    shot.kind === "closeup" ? `〔大頭 · ${nameOf(shot.focus)}〕`
    : shot.kind === "duel" ? `〔對峙 · ${nameOf(shot.focus)} 對 ${nameOf(shot.rival)}${shot.pose === "special" ? " · 絕招" : shot.pose === "strike" ? " · 出招" : ""}〕`
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
  $("play").onclick = () => {
    if (clock >= total(episode) - 0.1) clock = 0;
    playing = !playing;
    $("play").textContent = playing ? "⏸ 暫停" : "▶ 播放";
    render();
  };
  $("speed").onclick = () => {
    speed = speed === 1 ? 8 : 1;
    $("speed").textContent = speed === 1 ? "×1" : `×${speed} 預覽`;
    $("speed").classList.toggle("fast", speed !== 1);
  };
  $("track").onclick = (event) => {
    const rect = event.currentTarget.getBoundingClientRect();
    clock = Math.max(0, Math.min(total(episode) - 0.01, ((event.clientX - rect.left) / rect.width) * total(episode)));
    render();
  };
  buildBeats(6);
  loadEpisode(EPISODES[0]);
  requestAnimationFrame((now) => { lastTick = now; frame(now); });
}
boot();
