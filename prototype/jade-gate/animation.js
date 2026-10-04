/**
 * 四人の刃 — 兩集動畫 Demo（每集約 20 分鐘）
 * Episode 1「破帝」：三俠於古代擊敗灰帝的完整經過。
 * Episode 2「裂口 · 廿賢殿」：裂口將三俠擲入異世界，遇上二十賢的故事。
 * 全部畫作取自遊戲現有 assets；本檔是時間軸資料與播放器驅動。
 */

const art = {
  gate: "assets/arena.png",
  bamboo: "assets/bamboo-roam.png",
  river: "assets/bamboo-river.png",
  maze: "assets/bamboo-maze-natural.png",
  mountain: "assets/mount-canglan.png",
  citadel: "assets/meridian-citadel.png",
};
const sprite = (id) => `assets/${id}-sprite.png`;

/** 場景結構：{ id, chapter, duration(秒), backdrop, pan, cast:[{id,side,delay}], beats:[{t,who,text}] } */
export const EPISODES = [
  {
    id: "ep1",
    number: "第一集",
    title: "破帝",
    subtitle: "三俠如何在世界淪陷之夜，走到灰帝座前",
    scenes: [
      {
        id: "prologue", chapter: "序章 · 血月照關", duration: 75,
        backdrop: art.gate, pan: "in",
        cast: [],
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
      },
      {
        id: "warden", chapter: "第一章 · 灰旗守將", duration: 95,
        backdrop: art.gate, pan: "in-slow",
        cast: [
          { id: "zhao-yun", side: "left" },
          { id: "warden", side: "right", scale: 1.25 },
        ],
        beats: [
          { t: 6, who: "灰旗守將", text: "「常山的年輕劍士……為了一個不顧你的帝國，流血到死？」" },
          { t: 28, who: "趙雲", text: "「帝國欠的賬，江湖來收。你的關，今日換主人。」" },
          { t: 46, who: "", text: "守將的巨戟劈碎了半座箭樓。趙雲貼地而進——青釭劍只取一處：執戟的手腕。" },
          { t: 68, who: "", text: "第二式來得更狠。魯智深橫杖硬接，虎口迸裂，笑聲不停。" },
          { t: 84, who: "", text: "第三式未出，雙刀已至。守將單膝落地的一刻，關門開了。" },
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
      },
    ],
  },
  {
    id: "ep2",
    number: "第二集",
    title: "裂口 · 廿賢殿",
    subtitle: "裂口將三俠擲入異世界，二十賢等待著他們",
    scenes: [
      {
        id: "rift", chapter: "序章 · 一息的黎明", duration: 80,
        backdrop: art.citadel, pan: "in",
        cast: [],
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
      },
    ],
  },
];

/* ---------------- 播放器驅動 ---------------- */
const $ = (id) => document.getElementById(id);
const fmt = (s) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
const total = (ep) => ep.scenes.reduce((sum, scene) => sum + scene.duration, 0);

let episode = EPISODES[0];
let playing = false;
let clock = 0;            // 當前集內秒數
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

function render() {
  const { scene, start, local } = sceneAt(clock);
  $("episode-label").textContent = `${episode.number} · ${episode.title}`;
  $("chapter").textContent = scene.chapter;
  $("film-time").textContent = `${fmt(clock)} / ${fmt(total(episode))}`;
  $("timer").textContent = `${fmt(clock)} / ${fmt(total(episode))}`;
  $("progress").style.width = `${(clock / total(episode)) * 100}%`;
  document.querySelectorAll("#chapters button").forEach((btn, i) => {
    btn.classList.toggle("current", episode.scenes[i] === scene);
    btn.disabled = false;
  });

  const stage = $("stage");
  if (stage.dataset.scene !== scene.id) {
    stage.dataset.scene = scene.id;
    const backdrop = stage.querySelector(".backdrop");
    backdrop.src = scene.backdrop;
    backdrop.className = `backdrop pan-${scene.pan}`;
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
    stage.querySelector(".chapter-card").classList.remove("shown");
    void stage.querySelector(".chapter-card").offsetWidth; // restart the card animation
    stage.querySelector(".chapter-card").classList.add("shown");
  }

  const beats = stage.querySelectorAll(".beat");
  scene.beats.forEach((beat, i) => {
    const node = beats[i];
    const visible = local >= beat.t && local < beat.t + 14;
    node.classList.toggle("shown", visible);
    const cacheKey = `${scene.id}:${i}`;
    if (node.dataset.beat !== cacheKey) {
      node.dataset.beat = cacheKey;
      node.querySelector(".who").textContent = beat.who ? `${beat.who}：` : "";
      node.querySelector(".text").textContent = beat.text;
    }
  });
  if (local < 4) stage.querySelector(".chapter-card").classList.add("shown");
  else stage.querySelector(".chapter-card").classList.remove("shown");
}

function frame(now) {
  if (playing) {
    clock += Math.min(0.25, (now - lastTick) / 1000) * speed;
    if (clock >= total(episode)) { clock = total(episode) - 0.01; playing = false; $("play").textContent = "▶ 重播"; }
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
  const maxBeats = Math.max(...episode.scenes.map((scene) => scene.beats.length));
  buildBeats(maxBeats);
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
  // 完整腳本：章節 + 每拍旁白，方便直接讀完整個故仔。
  const transcript = $("transcript");
  transcript.textContent = `【${episode.number} · ${episode.title}】（約 ${Math.round(total(episode) / 60)} 分鐘）\n` +
    episode.scenes.map((scene) =>
      `\n◆ ${scene.chapter}（${scene.duration} 秒 · ${scene.backdrop.replace("assets/", "")}）\n` +
      scene.beats.map((beat) => (beat.who ? `　${beat.who}：${beat.text}` : `　${beat.text}`)).join("\n")
    ).join("\n");
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
  const track = $("track");
  track.onclick = (event) => {
    const rect = track.getBoundingClientRect();
    clock = Math.max(0, Math.min(total(episode) - 0.01, ((event.clientX - rect.left) / rect.width) * total(episode)));
    render();
  };
  buildBeats(6);
  loadEpisode(EPISODES[0]);
  requestAnimationFrame((now) => { lastTick = now; frame(now); });
}
boot();
