"""Build a reviewable prompt inventory from the frozen, exported animation timeline."""
import csv, html, json, zipfile
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parent
GAME = ROOT.parent.parent
SOURCE = json.loads((ROOT / 'source-storyboard.json').read_text())
OUT = 'assets/animation'
STYLE = ('Cinematic Chinese wuxia 2D animation keyframe, controlled clean contour lines, '
         'two to three deliberate shadow tones, restrained painterly background, consistent anatomy. '
         'Preserve the attached character identity rather than replacing it with a generic anime face. '
         'No photorealistic collage, no game interface, subtitles, lettering, watermark, border or split panels. ')
FRAME = ('One landscape frame, 2560x1440 pixels, 16:9. If this exact size is unavailable, use the closest '
         'landscape size without stretching; keep the center 16:9 composition safe for final export. '
         'Keep essential action above the bottom 16% reserved for subtitles. No baked black bars. ')
NEGATIVE = ('No extra limbs or fingers, face drift, swapped costumes, duplicate weapons, cropped heads, '
            'floating feet, different eye colors, mirrored jewelry, unintended age changes or giant foreground weapons hiding faces. ')

# These describe the reviewed ready sprites, not a new costume redesign.
TRAITS = {
 'zhao-yun':'adult East Asian man, long black high ponytail, silver dragon shoulder armor, white layered robes, jade-green sash. Animation weapon continuity: one straight Qinggang jian, not the spear in the old ready sprite',
 'lu-zhishen':'powerfully built bald adult East Asian monk, dark beard, oversized wooden prayer beads, ochre and charcoal robes, heavy crescent-headed iron monk staff',
 'hu-sanniang':'athletic adult East Asian woman, long black ponytail with red ribbons, red and dark lamellar armor, two curved sabers',
 'guan-yu':'tall mature East Asian warrior, long black beard, green robe, gold-edged armor, green-dragon crescent glaive',
 'gu-dasao':'strong adult East Asian woman, red headscarf, sleeveless charcoal tunic, red waist sash, trousers and boots, two broad cleavers',
 'guard':'adult East Asian soldier, dark helmet, blue-gray cloth and brown lamellar armor, one broad dao',
 'warden':'large adult East Asian armored commander, severe masked/armored face matching reference, charcoal armor, rust-orange cloak, massive halberd',
 'shadow-assassin':'adult East Asian assassin, dark indigo scarf and lower-face covering, layered blue-gray cloth armor, topknot, one curved short blade',
 'night-heron':'adult blind zither musician, black eye covering, long dark hair and charcoal layered clothing, horizontal stringed zither; retain the reference silhouette and concealed eye design',
 'wu-song':'muscular adult East Asian man, tied dark hair, open indigo martial robe, ochre trousers, wooden staff',
 'sun-shangxiang':'athletic adult East Asian woman, dark ponytail, deep green armored tunic, dark trousers, paired straight blades',
 'qin-liangyu':'adult East Asian woman, tied dark hair, red and ivory military robe, brown boots, long white-shafted spear',
 'canglan-monk':'bald adult East Asian monk, mustard and gray layered robes with shoulder armor, long iron staff',
 'lu-bu-rival':'adult East Asian warrior, ornate dark purple and bronze armor, two long red pheasant plumes, red cape, Fangtian halberd; use the cursed-story costume, not another Lu Bu outfit',
 'jade-sentinel':'adult East Asian guard, green helmet and green-gold armor, green cape, crescent polearm',
 'meridian-acolyte':'adult East Asian court adept, tied dark hair, red-black-gold ceremonial robes, green qi gathered in hands',
 'sovereign':'adult East Asian emperor, long dark hair, ornate high crown, black-gold-red imperial armor and robes, straight sword; the blood-moon ruler, not a new monster design',
 'jia-yucun':'adult East Asian man, tied black hair, cream sleeves under black waistcoat, dark trousers, bamboo court tablet',
 'fan-jin':'thin adult East Asian scholar, untidy tied hair, weathered beige-gray robe, scholarly scroll',
 'kuang-zhong':'adult East Asian official, tied hair and short facial hair, blue-teal tunic, dark trousers, ceremonial chained gold implement',
 'lu-su':'adult East Asian scholar, tied hair, light sage long tunic with cream sleeves, dark trousers, bamboo court tablet',
 'bao-zheng':'mature East Asian magistrate, dark beard, black-purple robe and official headwear, sheathed judgment sword; preserve the approved face markings without inventing new ones',
 'di-renjie':'adult East Asian investigator, dark tied hair, gray-blue layered robe and dark trousers, court tablet held near chest',
 'song-jiang':'adult East Asian leader, tied hair, mustache and short beard, red tunic and black trousers, simple dao',
 'wu-yong':'adult East Asian strategist, tied dark hair, long deep-blue robe with purple trim, folding fan',
 'empress-yixiu':'adult East Asian empress, pinned dark hair with gold ornaments, black-gold long outer robe over dark outfit, short straight blade',
 'xue-baochai':'adult East Asian woman, pinned dark hair with restrained ornaments, white Chinese-collar blouse, black short skirt and ankle boots',
 'lin-daiyu':'slender adult East Asian woman, dark pinned hair, black-gold short dress with flowing lilac translucent outer sleeves, dark folding fan',
 'diaochan':'adult East Asian dancer, flowing dark hair and gold ornaments, ivory-gold short dress with long pale pink silk ribbons',
 'yang-yuhuan':'adult East Asian woman, dark updo with gold flowers, black fitted short dress and ivory-gold sleeves, heeled sandals',
 'jia-zheng':'adult East Asian official, tied hair, sober blue tunic with white cuffs, dark trousers, composed hands',
 'xun-yu':'adult East Asian strategist, tied dark hair, cream sleeves, dark blue vest with gold edging, fitted dark trousers',
 'jia-yuanchun':'adult East Asian consort, dark updo with red-gold ornaments, flowing red ceremonial robes with dark waist belt',
 'wang-xifeng':'adult East Asian woman, dark updo with red-gold hair ornaments, long red-black embroidered outer robe, dark trousers',
 'zhen-huan':'adult East Asian woman, ornate pinned dark hair, mint-green and ivory short court outfit with light jacket, tall ivory boots',
 'hua-fei':'adult East Asian consort, elaborate dark updo with gold-red ornaments, long red-black embroidered robe and dark inner clothing',
 'zhao-min':'adult East Asian woman, long dark ponytail, black short martial dress over ivory long sleeves, dark knee-high boots; two straight jian only in combat. Preserve this ready-sprite outfit consistently instead of switching to the modern white-jacket gallery portrait',
 'sister-flashback':'teenage younger sister in the village flashback, familial resemblance to adult Zhao Min, simple dark hair tied back, fully covered practical ivory and muted green village robes, flat cloth shoes; no adult battle costume or short skirt',
 'village-master':'elderly East Asian swordsmith and mentor, silver hair tied back, short gray beard, weathered hands, simple charcoal cotton robe and brown work apron; a proposed new supporting design requiring approval',
}

# Location, lighting and narrative action for each existing scene. Existing game
# maps are mood references only: new images use the shot camera, not top-down art.
SCENES = {
'zhaovillage':('village','A northern Chinese stone-and-timber village below Changshan, an active sword forge and narrow lantern-lit lane. Warm forge amber against cool evening blue.',[
'Establish the living village and Zhao Yun tending a sword forge.', 'The elderly master passes one straight Qinggang sword to Zhao Yun.', 'His younger sister watches sparks at a safe distance from the forge.', 'Soldiers bring an imperial registry to the village gate.', 'During the forced departure, the fully clothed sister slips half a jade pendant into her brother\'s hand.', 'Zhao Yun leaves northward with the wrapped sword and half-jade pendant.', 'He reaches the distant pass as its lanterns go dark.']),
'prologue':('gate-night','Jade Gate mountain fortress at night, large timber doors, stone battlements, refugees below, ashen banners and a crimson moon. Cold moonlight and isolated orange lanterns.',[
'Lanterns go dark one by one above Jade Gate.', 'An imperial decree hangs against weathered stone; no generated readable text.', 'Refugees cross a ridge and see the occupied gate behind them.', 'Zhao Yun stands amid refugees holding the half-jade pendant.', 'Zhao Yun quietly vows to hold the gate, resolved rather than shouting.', 'Lu Zhishen and Hu Sanniang approach from different paths through the crowd.']),
'oath':('refugee-camp','Refugee tents and braziers at the base of Jade Gate, cold night, muddy stone paving and lantern light.',[
'Soldiers threaten refugees; an older villager is shielded, no graphic injury.', 'Lu Zhishen catches a raised whip with his monk staff.', 'Lu Zhishen speaks with protective anger.', 'Hu Sanniang breaks through with paired sabers as a prison cart disappears beyond the gate.', 'Hu Sanniang speaks with anger restrained by purpose.', 'Sword, staff and paired sabers protect the refugees from three directions.', 'Zhao Yun recognizes the other two as allies and invites them to travel together.', 'The three heroes make their oath together.', 'A quiet held tableau of the three at the place of their oath.']),
'vanguard':('gate-camp','Enemy camp outside Jade Gate, grounded stone yard, scattered braziers, gray banners. Night with orange fire rim light.',[
'Guan Yu and Gu Dasao stand under the decree\'s influence, guarding the camp.', 'Subtle ink threads bind Guan Yu\'s wrist, suggesting repeated erased memories.', 'Guan Yu blocks the road with his crescent glaive.', 'Zhao Yun addresses Guan Yu without hatred.', 'Zhao Yun reads and deflects the glaive; deliberate close-range duel.', 'The ink binding breaks; Guan Yu survives and begins to remember.']),
'warden':('gate-courtyard','Jade Gate inner stone courtyard, arrow tower on one side, great gate behind the Warden. Night with smoke, cold key light and ember accents.',[
'The Warden challenges Zhao Yun with cold disdain.', 'Zhao Yun answers with controlled resolve.', 'The Warden\'s halberd shatters tower debris and drives Zhao Yun low.', 'Lu Zhishen braces his staff against the heavy halberd and protects the others.', 'Hu Sanniang ends the exchange with paired sabers; the Warden kneels and the gate opens.']),
'act1-fall':('gate-dawn','The same Jade Gate stone courtyard after battle, open gate, extinguishing braziers and early soft dawn.',[
'The defeated Warden yields the opened gate to the people.', 'Guan Yu speaks as the gray influence fades from his eyes.', 'Survivors share hot tea under a rough awning.', 'The red moon has dimmed slightly.']),
'bamboo':('bamboo','Eye-level bamboo forest trail with wet leaves, a shallow stream and layered fog. Blue-green filtered light.',[
'Establish the bamboo trail and nearly invisible thread traps.', 'A shadow assassin moves between bamboo trunks.', 'Hu Sanniang speaks while watching the fog at screen right.', 'The three heroes move back-to-back through a shallow stream as arrows strike nearby bamboo.', 'A zither\'s sound stops; the heroes notice a still silhouette in the mist.']),
'heron':('river-mist','Rocky riverbank and shallow water beside dense bamboo, dark slick stones, low white fog. Cool diffused morning light.',[
'The blind Night Heron calmly taunts the heroes while holding a zither.', 'Zither strings stretch across the riverbank like traps; fog blocks the remaining approach.', 'Zhao Yun guards while Lu Zhishen strikes a stone with his staff like a bell.', 'Hu Sanniang attacks from the flank after the rhythm breaks.', 'The zither falls safely; Night Heron smiles and retreats alive into fog.']),
'crossing':('ferry','Wooden ferry crossing a broad Chinese mountain river, planked deck and distant bamboo bank. Gentle overcast daylight.',[
'Wu Song, Sun Shangxiang and Qin Liangyu stand newly freed on the bank; retain the cast IDs from the source.', 'Wu Song gives a blunt, friendly promise to accompany them.', 'The ferry carries the expanded party; boat and bodies share the same perspective.', 'A fading crimson moon hangs over the river.']),
'clouds':('cloud-stairs','Steep stone steps climbing Mount Canglan through clouds, bell pavilion, wet rock edges. Soft blue daylight with pale gold rim.',[
'Lu Zhishen meets the iron monk on the cloud stairs.', 'Lu Zhishen addresses the monk with stern compassion.', 'Rockfall and wind interrupt the climb; grounded foot placement on each step.', 'At the summit a Fangtian halberd is planted in stone beneath the cursed general.']),
'lubu':('cloud-terrace','Mount Canglan summit terrace with cracked stone, cliff railings and clouds below. Cold backlight and violet curse accents.',[
'Cursed Lu Bu challenges the heroes, gray eyes and intact armor.', 'Lu Bu\'s halberd overwhelms Zhao Yun\'s first defense.', 'Hu Sanniang binds the halberd with her red sash while Lu Zhishen pins the shoulder with his staff.', 'Zhao Yun brings his straight sword close to Lu Bu\'s forehead to sever the curse without piercing skin.', 'Lu Bu speaks as gray eye haze clears and violet curse light fades.']),
'freed':('cloud-terrace','The same Mount Canglan terrace, clearing cloud and gentler daylight after the curse is broken.',[
'Freed Lu Bu offers his own allegiance, tired but proud.', 'He explains the emperor was a historian whose ink can rewrite lives.', 'The party looks toward the blood moon above the imperial city.', 'Zhao Yun resolves to overturn the emperor\'s inkstone.', 'The heroes set out toward the distant city through opening clouds.']),
'bloodmoon':('citadel-approach','Meridian Citadel outer avenue and high gates, jade warding lines on stone walls, blood moon overhead. Crimson sky and cool jade underlight.',[
'The great citadel gate stands open beneath the blood moon.', 'Zhao Yun speaks before entering the avenue.', 'Jade sentinels and court acolytes oppose the heroes in the avenue.', 'A view through the palace doorway hints at the emperor on his throne.']),
'throne':('throne','Vast imperial throne hall, black-gold throne on a raised dais, vermilion columns and moon aperture. Crimson high window light and dark amber practical lamps.',[
'The Sovereign speaks from his throne with intimidating composure.', 'Zhao Yun answers from the lower hall, looking toward the dais.', 'The Sovereign rises and the red moon seems to rise with him.', 'Dark space opens behind the throne while the architecture remains readable.']),
'final-duel':('throne-broken','The same throne hall during battle; broken doors, known columns, cracked central floor. Crimson moonlight and gold/jade attack accents.',[
'The Sovereign\'s opening blow blasts the heroes backward without killing them.', 'Glowing ink chains extend from imperial vows and coil across the hall.', 'The Sovereign shows the first trace of fear as the chains break.', 'Lu Bu, Hu Sanniang, Lu Zhishen and Zhao Yun combine four weapon arcs against the throne.', 'The throne is empty after the final impact.']),
'epilogue':('citadel-dawn','Meridian Citadel after the battle, empty throne and open city gates, debris settled. Ordinary warm dawn replacing crimson moonlight.',[
'The Sovereign gives a final exhausted line, a restrained fading presence rather than a fresh attack.', 'The blood moon fades and ordinary dawn enters the open gates.', 'Zhao Yun sheathes his straight sword and bows toward Changshan.', 'The three heroes stand quietly among the freed city\'s survivors.', 'Zhao Yun touches the half-jade at his chest and thinks of his sister.', 'Hold an uneasy calm before the continuation.', 'Quiet dawn end frame without generated title lettering.']),
'rift':('rift','Broken Meridian Citadel gate at dawn, a golden fissure above the arch, loose paper and drifting ink. Dawn blue-gold light.',[
'The peace after victory lasts only a heartbeat.', 'An unfinished brushstroke hangs in the air like an unclosed decree.', 'A golden rift tears open above the broken gate and absorbs the last red moonlight.', 'The three heroes are pulled upward along coherent arcs into the fissure.', 'The golden rift pulses like a voice without a human face.', 'Three empty weapon-rest spaces remain below the gate.', 'Zhao Yun protects the half-jade pendant as he crosses the threshold.']),
'corpse-street':('other-street','Unfamiliar Chinese dynastic street with worn stone paving, closed wooden shopfronts and paper notices. Dense gray morning fog, strange stars fading overhead. No bamboo maze.',[
'Zhao Yun and Lu Zhishen awaken on the cold paving, Hu Sanniang nearby.', 'An unfamiliar coin and mismatched star pattern signal another dynasty.', 'The heroes survey a street out of time.', 'A decree on the wall has the same sinister ink quality; leave text space blank.', 'Zhao Yun urges his companions to rise and protect one another.', 'Inspectors wait in the deep fog holding ledgers.']),
'inspectors':('inspection','An inspection pavilion opening onto the foggy street, four desks and travel ledgers, hanging lamps. Muted gray daylight and amber lamp accents.',[
'Jia Yucun, Fan Jin, Kuang Zhong and Lu Su sit at four inspection stations.', 'Jia Yucun appraises the three travelers with an abacus and a calculating half-smile.', 'Ghostlike loose book pages hint the inspectors were taken from different stories.', 'A tactical contest breaks one ink thread binding the inspectors.', 'Their recovered memories point toward a greater hall.']),
'hall':('twenty-hall','Enormous Hall of Twenty, twenty distinct desks arranged in three staggered banks, tall vermilion columns, lacquer screens and hanging lamps. Deep warm interior perspective.',[
'Establish all twenty desks; distant human figures may be simple silhouettes.', 'The twenty summoned people turn toward the newcomers; stage recognisable faces in separate small groups.', 'Empress Yixiu addresses the heroes from the far dais.', 'A single lamp wick sparks in the silence.']),
'refuse':('twenty-hall','The Hall of Twenty, central aisle leading toward the dais and the same desk layout. Warm overhead lamps and cool doorway backlight.',[
'Zhao Yun refuses to kneel, chin steady and eyes raised toward the empress.', 'He calls for the first round with a small deliberate gesture.', 'The desks and screens shift to open the competition floor.']),
'lattice':('lattice','Interior labyrinth of lacquered Chinese lattice screens, pale stone floor, fixed lamp locations and silk shadows. Warm pools of lamp light. No outdoor bamboo scenery.',[
'The women enter the screen maze; each remains in her own costume and lane.', 'The first round begins where the lamps are dimmest.', 'Lin Daiyu gives a cool, precise invitation to duel.', 'Zhao Yun reads the fan feint and wins a nonlethal exchange against Lin Daiyu.', 'One desk stands empty as another ink binding releases.']),
'judges':('judges','Side chamber of the Hall of Twenty, four scholarly desks, strategy tokens, lamps and paper screens. Warm neutral light.',[
'Jia Zheng, Xun Yu, Song Jiang and Wu Yong form a restrained strategic tableau.', 'Hu Sanniang rejects their rigid reasoning, direct and determined.', 'Her paired sabers defeat Wu Yong\'s fan deception without harming his face.', 'Wu Yong admits the loss with an intelligent rueful smile.']),
'investigators':('judges','Judicial chamber adjoining the same hall, raised desk and a broad clear central aisle. Warm amber and cool side-window light.',[
'Bao Zheng speaks with stern authority from behind the desk.', 'Bao Zheng and Di Renjie examine the false evidence linking the hall to the decree.', 'Di Renjie announces his deduction calmly, looking toward the heroes.', 'Both investigators understand that the hall itself is a prison.']),
'court':('court','Palace side chamber of the Hall of Twenty, long desk, folded silk screen, courtyard window and hanging lamps. Warm amber court light.',[
'Jia Yuanchun, Wang Xifeng, Zhen Huan and Hua Fei stand in distinct positions.', 'Wang Xifeng asks the travelers to see the sky beyond the palace walls for her.', 'Wang Xifeng laughs against a desk, Hua Fei tosses a fan, Jia Yuanchun smiles through tears.', 'A quiet reaction of relief after defeat and release.']),
'legends':('garden','Covered palace waterside gallery beyond the Hall of Twenty, lotus pond, reflected lamps and an opening to clouds. Warm evening gold with pale lavender reflections.',[
'Diaochan, Yang Yuhuan, Lin Daiyu and Xue Baochai reclaim their individual stories.', 'Yang Yuhuan speaks gently, then begins one graceful turn for herself.', 'Nineteen lamps light in sequence; one final lamp remains dark.', 'Beyond the gallery, a cloud bridge appears with one waiting figure.']),
'causeway':('bridge','A narrow stone-and-timber causeway above a vast cloud sea, one distant portal at each end, no nearby mountain-game courtyard. Cool pearl daylight and gold portal rim.',[
'Zhao Min introduces herself as the final bridge keeper, facing Zhao Yun.', 'Her knowing smile softens as she repeats the village master\'s lesson.', 'Zhao Yun recognises the words and tightens his hand around his sword.', 'He asks for an answer after their duel, suspicious and hopeful.', 'Zhao Min draws two straight swords; wind drops before the opening exchange.']),
'final':('bridge','The same cloud bridge with unchanged portals and railings. Cool pearl light; gold jade glints appear only at the reveal.',[
'Zhao Min sets three escape routes with her twin-blade stance, Zhao Yun reads the feint.', 'The three heroes stand together, their weapons forming one line of resolve.', 'Zhao Yun\'s sword spine loosens a sleeve clasp; a half-jade pendant falls between them.', 'Zhao Min quietly reveals she is the lost sister, vulnerability replacing her teasing mask.', 'Zhao Yun recognises her, eyes moist but face restrained.', 'The two matching jade halves meet on the flat of a straight blade and clouds part.']),
'home':('bridge-home','The same cloud bridge, its near portal now opening onto the familiar Jade Gate at morning. Warm home light on one side, cool bridge mist on the other.',[
'Zhao Min asks the three travelers to cross, holding her composure as she stays behind.', 'The twentieth desk is empty; clouds reveal the heroes\' own morning.', 'Jade Gate returns in unchanged ordinary daylight.', 'Zhao Yun looks back and his adult sister raises a small farewell hand from the bridge.', 'A balanced wide composition shows brother at the gate and sister at the far bridge, divided by time.', 'Clouds close like gently folded pages, leaving the gate visible.', 'Quiet final held frame without title lettering.']),
}

FIGHTS = {
('vanguard',60):'Zhao Yun deflects Guan Yu\'s glaive and breaks the ink thread at the wrist. Guan Yu survives, kneels voluntarily and remembers himself.',
('warden',44):'The Warden wins this exchange: his halberd forces Zhao Yun into a low defensive slide. Zhao survives and recovers. Broken tower stone lands behind them, not on a face.',
('warden',80):'Hu Sanniang uses two crossing saber arcs to disarm the Warden; he ends on one knee. She lands balanced. The gate begins to open.',
('heron',63):'Hu Sanniang slips past the zither threads and redirects the instrument. Night Heron loses the exchange but stays alive and withdraws into mist; do not depict death.',
('lubu',26):'Lu Bu wins the opening exchange, sweeping Zhao Yun\'s straight sword aside with his Fangtian halberd. Zhao falls back into a guard without dying.',
('lubu',46):'Hu Sanniang winds her sash around Lu Bu\'s halberd; Lu Zhishen enters only at the finishing hold to pin his shoulder with a staff. Lu Bu is restrained, not killed.',
('bloodmoon',44):'Zhao Yun steps inside the jade sentinel\'s polearm and disarms him with the straight jian. The sentinel staggers and yields.',
('final-duel',4):'The Sovereign wins this exchange and drives Zhao Yun backward with a heavy qi-assisted sword strike. Zhao lands on his feet and braces; retain the hall\'s floor geometry.',
('final-duel',62):'Zhao Yun leads the final sword stroke. Lu Bu\'s halberd, Hu Sanniang\'s paired sabers and Lu Zhishen\'s staff join only for the final impact as four readable directions. Ink chains rupture; the Sovereign dissolves into ink and the throne is empty, without gore.',
('lattice',63):'Lin Daiyu feints with her folding fan; Zhao Yun redirects it with the flat of his sword. She yields safely as the ink binding breaks.',
('judges',47):'Wu Yong uses a fan and tactical sidestep. Hu Sanniang closes the escape lane with paired sabers, stopping before contact. Wu Yong yields alive with a rueful smile.',
('causeway',74):'Zhao Min wins the opening exchange, crossing her two jian to redirect Zhao Yun\'s one jian. He stumbles one step and guards. No one falls off the bridge.',
('final',4):'Zhao Yun wins this exchange by reading Zhao Min\'s twin-blade feint. Both remain alive, weapons controlled, and stay on the bridge.',
('final',42):'Zhao Yun gently hooks the sleeve clasp with his sword spine. The clasp releases the half-jade pendant; do not cut skin, clothing across the torso, or the character\'s body. Both freeze at the reveal, without a victory collapse.',
}

items=[]
def add(id,category,title,prompt,refs=(),episode='',scene='',t=None,shot=None,priority='P1',motion='',size='2560x1440',alpha=False):
    filename=f'{OUT}/{category}/{id}.png'
    refs=[dict(path=r, status='existing' if (GAME/r).exists() else 'generate-and-approve-first') for r in dict.fromkeys(refs)]
    item=dict(id=id,category=category,title=title,priority=priority,episode=episode,scene=scene,localTime=t,shotIndex=shot,
              output=filename,size=size,transparent=alpha,references=refs,status='not-generated',motion=motion,
              prompt=prompt,sourceCommit='5f1ca74')
    items.append(item)
    return filename

def master(id): return f'{OUT}/identity/id-{id}.png'
def identity(ids):
    return '\n'.join(f'{id}: {TRAITS[id]}. Match the approved face reference exactly: facial proportions, eyes, nose, jaw, hairline and ornament placement.' for id in dict.fromkeys(ids))
def refs_for(ids):
    return [p for id in dict.fromkeys(ids) for p in [master(id),f'assets/{id}-sprite.png'] if id not in ('sister-flashback','village-master') or '/identity/' in p]
def beat_for(scene,t):
    near=[(i,b) for i,b in enumerate(scene['beats']) if 0 <= b['t']-t <= 6]
    if near:return near[0][0]
    previous=[i for i,b in enumerate(scene['beats']) if b['t']<=t]
    return previous[-1] if previous else 0

# 39 canonical face approvals, including the two missing flashback designs.
for id,traits in TRAITS.items():
    existing=[f'assets/{id}-sprite.png'] if (GAME/f'assets/{id}-sprite.png').exists() else ([f'assets/zhao-min-sprite.png'] if id=='sister-flashback' else [])
    design='Proposed new supporting design; approve it before using it as the canonical reference. ' if id in ('sister-flashback','village-master') else 'Use the attached ready sprite as identity and costume reference. '
    add('id-'+id,'identity',f'{id} · 正面身份基準',STYLE+design+traits+'. One single front-facing neutral head-and-shoulders portrait, closed relaxed mouth, eyes open, looking straight into lens, no head tilt, no dramatic expression. Full hair silhouette and shoulders within frame with 10% margin; face large enough to inspect eye shape. Neutral soft light from upper left, quiet gray background, no weapon foreground. Preserve asymmetry; do not beautify into a different person. '+NEGATIVE,existing,priority='P0' if id in ['zhao-yun','lu-zhishen','hu-sanniang','zhao-min','warden','sovereign','sister-flashback','village-master'] else 'P1',size='1536x1536')

locations={}
for ep in SOURCE:
 for s in ep['scenes']:
    loc,env,_=SCENES[s['id']]
    if loc not in locations:
      locations[loc]=add('bg-'+loc,'background',f'{s["chapter"]} · 場景空景',STYLE+FRAME+env+' Empty environment plate, no people, silhouettes, weapons, speech or effects in front of the architecture. Human eye-level perspective, 35mm-equivalent lens, horizon at 45% image height. Clearly readable walkable ground. Maintain 15% extra composition room on both sides for modest pans. Use the attached existing map only for palette and architectural motifs, redraw it from this camera instead of copying its elevated gameplay perspective. Separate foreground occlusion from the central acting lane.',[s['backdrop']],episode=ep['id'],scene=s['id'],priority='P0' if loc in ['village','gate-courtyard','throne','other-street','twenty-hall','lattice','bridge'] else 'P1',motion='Later separate distant sky/cloud, architecture and foreground into layers; pan layers at different speeds. This plate itself contains no animation.')

shot_rows=[]
for ep in SOURCE:
 offset=0
 for scene in ep['scenes']:
  loc,env,actions=SCENES[scene['id']]
  assert len(actions)==len(scene['beats']),scene['id']
  for n,shot in enumerate(scene['shots'],1):
    t=shot['t'];kind=shot['kind']; sid=f'{ep["id"]}-{scene["id"]}-s{n:02d}'
    action=actions[beat_for(scene,t)]
    ids=[shot['focus']] if kind=='closeup' else [shot[k] for k in ['focus','rival'] if k in shot] or [c['id'] for c in scene['cast']]
    # Narrative speakers can appear outside a scene's static cast in the source.
    if scene['id']=='zhaovillage': ids=list(dict.fromkeys(ids+(['village-master'] if 16<=t<34 else ['sister-flashback'] if 34<=t<80 else [])))
    if kind=='fight':
      action=FIGHTS[(scene['id'],t)]
      left_id='zhao-yun' if 'zhao-yun' in ids else ids[0]
      right_id=next(id for id in ids if id!=left_id)
      camera=f'Locked 35mm side-on two-person wide shot at chest-level camera height, full bodies and whole weapons visible, both feet contacting the same floor plane. Establish {left_id} on screen left facing right and {right_id} on screen right facing left; keep this axis through all seven frames, even when the attacking character changes. This is the STANDOFF frame before the described exchange: neither strike nor injury has happened yet. '
      motion='Seven keyframes: standoff → windup → charge → impact → pass → hold → aftermath. Draw new poses for each; add in-betweens for fluid motion. Do not merely translate standing sprites.'
    elif kind=='closeup':
      focus=shot['focus']; side='left' if focus in ['zhao-yun','lu-zhishen','hu-sanniang'] else 'right'
      facing='right' if side=='left' else 'left'
      camera=f'Purpose-drawn close-up, 85mm-equivalent eye-level lens, {focus} on screen {side}, head turned 25 degrees toward screen {facing}, eyes looking just off-camera at the partner, full hair crown and chin visible, eye line at upper third. Head and shoulders fill the frame without zooming a full-body image. Match the head angle in every mouth and blink frame. Mouth initially closed; convey the line through eyes and facial muscles. '
      motion='Use the closed-mouth base plus the open-mouth and blink variants in this pack. Add subtle breath/hair movement; mouth shapes must follow the recorded dialogue, not random looping.'
    elif kind=='push':
      camera='Medium waist-up shot with a 50mm-equivalent lens, character oriented toward the other actor, stable anatomy and complete hair crown. Leave 12% overscan for a restrained 1.0–1.08 camera push; if the beat is an object reveal, frame hands and that object instead of a generic face. '
      motion='Restrained push under 8%, independent foreground/background parallax, a deliberate eye or hand movement; no repeated full-body bounce.'
    else:
      camera='Cinematic establishing or narrative wide shot, 35mm-equivalent lens at human eye height. Arrange cast in readable depth rather than a row of pasted sprites. Show the described story action and setting. For intimate hand/object beats use a motivated insert camera while preserving the scene geography. '
      motion='Hold 2–5 seconds per readable action; layer fog, cloth and light. Long narrated beats need reaction/insert cuts rather than stretching one still for 15–30 seconds.'
    prompt=STYLE+FRAME+env+'\nSTORY MOMENT: '+action+'\nCAMERA: '+camera+'\nCAST IDENTITY:\n'+identity(ids)+'\nUse only the people required by this story moment; references for a group must remain distinct. Match skin and cloth lighting to the environment. '+NEGATIVE
    refs=refs_for(ids)+[locations[loc]]
    base=add(sid,'shot',f'{scene["chapter"]} · S{n:02d} · {kind}',prompt,refs,ep['id'],scene['id'],t,n,'P0' if (kind=='closeup' and shot.get('focus') in ['zhao-yun','zhao-min','sovereign','warden']) else 'P1',motion)
    shot_rows.append(dict(episode=ep['id'],scene=scene['id'],shotIndex=n,kind=kind,localTime=t,episodeTime=offset+t,request=sid,output=base,sourceBeat=scene['beats'][beat_for(scene,t)]['text']))
    if kind=='closeup':
      for suffix,edit in [('talk','Change only the mouth to a small naturally open speaking shape; keep eyes open. No teeth grin and no exaggerated shouting unless explicitly requested.'),('blink','Close only the eyelids in a relaxed blink; keep the mouth closed exactly as the base image.')]:
        add(sid+'-'+suffix,'expression',f'{scene["chapter"]} · S{n:02d} · {suffix}',STYLE+FRAME+'Edit the attached APPROVED shot base image. '+edit+' Preserve every other pixel as closely as possible: camera, face angle, head size, nose, jaw, hair, costume, lighting, background and composition. Do not redraw or reposition the person. One full-canvas replacement frame, not a face tile or contact sheet. '+NEGATIVE,[base,master(shot['focus'])],ep['id'],scene['id'],t,n,motion='Register exactly over the base at 100% scale; reject any eye, nose or chin displacement before frame swapping.')
    if kind=='fight':
      phases=[('windup','Weight shifts onto the rear foot; attacker coils hips and bends elbows; defender actively braces. Weapons stay separate.'),('charge','Attacker pushes off with the rear foot and leads with hips; defender moves into a block. Show a new foreshortened body pose, not a horizontal sprite slide.'),('impact','At the exact contact point weapons meet once with readable hand grips and one controlled spark. Body mechanics agree with the planned outcome; no effect hides the faces.'),('pass','Follow through beyond the contact lane; draw torso rotation and the opposite visible shoulder. Keep the original camera axis, naturally reveal backs rather than mirroring a front image.'),('hold','Weight settles after the follow-through; weapons lower or remain in safe guard as appropriate. Draw the resolved new pose; do not reuse the attack pose.'),('aftermath','Show the specific story outcome in the choreography below. A defeated character yields, staggers or kneels only where specified; do not apply a generic death pose to every loser.')]
      for phase,desc in phases:
        extra=['lu-zhishen'] if (scene['id'],t)==('lubu',46) and phase in ['hold','aftermath'] else ['lu-bu-rival','hu-sanniang','lu-zhishen'] if (scene['id'],t)==('final-duel',62) and phase in ['impact','pass','hold','aftermath'] else []
        add(sid+'-'+phase,'fight',f'{scene["chapter"]} · S{n:02d} · {phase}',STYLE+FRAME+env+' Use the approved standoff frame as exact camera and geography reference, preserve the same lens, horizon, body scale, light, costumes and weapon designs. Draw a new action keyframe.\nPHASE: '+desc+'\nENTIRE EXCHANGE AND OUTCOME: '+action+'\nCAST:\n'+identity(ids+extra)+'\nNo repeated upright ready pose; believable balance and foot contact. Before contact retain the initial left/right positions; after contact any crossing must follow the visible movement, never an arbitrary flip. '+NEGATIVE,[base]+refs_for(ids+extra),ep['id'],scene['id'],t,n,motion='Match to adjacent phase at the same camera. Use action arcs and additional in-between drawings; seven poses alone are a limited-animation pass.')
  offset+=scene['duration']

# Inserts fill narrative objects and actions that the existing shot list omits.
INSERTS=[
('ep1','zhaovillage',20,'master-sword','Close insert of the old master\'s weathered hands passing the straight Qinggang jian to Zhao Yun; one correct guard and blade, no spear.',['village-master','zhao-yun']),
('ep1','zhaovillage',36,'sister-forge','Medium shot of the fully clothed teenage sister watching forge sparks from a safe distance, warm reflected light, gentle familial expression.',['sister-flashback']),
('ep1','zhaovillage',68,'sister-half-jade','Tight insert of sister and brother\'s hands exchanging half a pale jade disk during departure; modest sleeves only, keep the asymmetrical zigzag break clearly visible.',['sister-flashback','zhao-yun']),
('ep1','oath',18,'staff-catches-whip','Action insert of a whip wrapping once around Lu Zhishen\'s planted staff while an older refugee is protected behind him.',['lu-zhishen','guard']),
('ep1','oath',70,'three-protect','Wide composition of Zhao Yun shielding an elder, Lu Zhishen blocking arrows, and Hu Sanniang clearing a route; three separate silhouettes.',['zhao-yun','lu-zhishen','hu-sanniang']),
('ep1','warden',68,'monk-block','Low three-quarter medium shot of Lu Zhishen meeting the Warden\'s halberd with a heavy grounded staff block; strained grip, no graphic injury.',['lu-zhishen','warden']),
('ep1','heron',48,'staff-bell','Close insert of Lu Zhishen\'s staff ringing against a smooth stone while Night Heron\'s strings visibly lose their rhythm.',['lu-zhishen','night-heron']),
('ep1','lubu',68,'curse-release','Close side view of the Qinggang sword tip hovering just before Lu Bu\'s forehead. Violet ink threads lift away without penetration or blood.',['zhao-yun','lu-bu-rival']),
('ep1','freed',20,'historian-ink','Symbolic insert of a historian\'s brush writing living ink threads on blank parchment, suggest the Sovereign\'s hand and ring; no readable generated text.',['sovereign']),
('ep1','final-duel',64,'four-weapons','Purpose-composed wide final attack with all four heroes: one jian, paired sabers, one monk staff, one Fangtian halberd. Four distinct arcs converge at the throne, faces remain readable.',['zhao-yun','hu-sanniang','lu-zhishen','lu-bu-rival','sovereign']),
('ep1','epilogue',46,'sheathe-bow','Zhao Yun smoothly sheathes his straight sword and bows toward his distant home, a quiet profile medium shot.',['zhao-yun']),
('ep2','rift',20,'unfinished-decree','A single unfinished black brushstroke hangs in the air over the broken gate, its loose end opening into gold; no letters or human face.',[]),
('ep2','rift',52,'three-fall','Dynamic wide view of all three heroes tumbling through the rift with controlled foreshortening and distinct silhouettes, weapons held safely.',['zhao-yun','lu-zhishen','hu-sanniang']),
('ep2','corpse-street',26,'strange-coin','Macro insert of Zhao Yun\'s gloved hand examining an unfamiliar square-holed copper coin; leave reign-name inscription blank for later typography.',['zhao-yun']),
('ep2','hall',28,'twenty-seats','Wide rear three-quarter view behind the three heroes toward exactly twenty desks in three banks. Distant judges are simple varied silhouettes; do not generate twenty detailed faces in one frame.',['zhao-yun','lu-zhishen','hu-sanniang']),
('ep2','court',52,'court-release','One continuous medium-wide group shot: Wang Xifeng laughs leaning on a desk, Hua Fei releases a closed fan, Jia Yuanchun smiles through tears. Three distinct reactions within one scene, no panels or collage.',['wang-xifeng','hua-fei','jia-yuanchun']),
('ep2','legends',50,'nineteen-lamps','An aisle of twenty hanging lamps: nineteen softly lit and one dark at the bridge end. Strong depth, no people required.',[]),
('ep2','final',44,'jade-falls','Macro action insert: a loosened sleeve clasp releases one pale jade half, falling toward the flat of Zhao Yun\'s straight sword; no cut skin or shredded clothing.',['zhao-yun','zhao-min']),
('ep2','final',60,'sister-recognition','Adult Zhao Min\'s true reverse-angle close-up, looking screen left at her brother with vulnerable recognition, identical approved face and black/ivory outfit.',['zhao-min']),
('ep2','final',86,'jade-reunites','Macro insert of two complementary jade halves joining on the flat of a straight blade. Match the exact zigzag break from the village handover, pale green translucency and one shared circular carved motif.',['zhao-yun','zhao-min']),
('ep2','home',54,'farewell-reverse','True reverse shot over Zhao Yun\'s shoulder toward adult Zhao Min at the far end of the bridge, raising a small farewell hand, maintain her facial identity and asymmetrical costume details.',['zhao-yun','zhao-min']),
('ep2','home',66,'two-gatekeepers','Wide depth composition: Zhao Yun in the near warm Jade Gate opening, Zhao Min far across the cool cloud bridge, both visibly grounded; a farewell image, no romantic embrace.',['zhao-yun','zhao-min']),
]
for ep,scene,t,name,desc,ids in INSERTS:
 loc,env,_=SCENES[scene]
 add(f'{ep}-{scene}-insert-{name}','insert',f'{scene} · {name}',STYLE+FRAME+env+'\n'+desc+'\n'+identity(ids)+'\n'+NEGATIVE,refs_for(ids)+[locations[loc]],ep,scene,t,priority='P0' if name in ['sister-forge','sister-half-jade','four-weapons','jade-falls','jade-reunites','farewell-reverse'] else 'P1',motion='New proposed insert tied to this narrative beat; add an explicit shot binding later. Use a short motivated cut, not a replacement of the entire scene.')

# Shared prop is approved before the flashback and reveal insert requests.
add('prop-half-jade','prop','半玉 · 前後呼應道具',STYLE+'One single product-like reference image, 1536x1536, neutral gray background. A small pale celadon jade disk broken into two complementary halves along one distinctive asymmetrical zigzag fracture. Both halves lie adjacent with a 1cm gap, visibly capable of fitting exactly. One understated carved cloud circle crosses the fracture; tiny brown silk cord through a hole near the top. Same material and thickness for both halves. Soft neutral light, no hands, lettering, glow, duplicate objects or decorative frame. This is a proposed new story prop; approve before all handover/falling/reunion shots.',priority='P0',size='1536x1536')
for item in items:
 if any(term in item['id'] for term in ['half-jade','jade-falls','jade-reunites']) and item['category']!='prop':
  item['references'].append(dict(path=f'{OUT}/prop/prop-half-jade.png',status='generate-and-approve-first'))
  item['prompt']+=' Match the attached approved half-jade prop exactly, especially its fracture edge and shared carving.'

assert len(shot_rows)==128
assert len({i['id'] for i in items})==len(items)
for item in items:
 for ref in item['references']:
  assert ref['status']!='existing' or (GAME/ref['path']).exists(),ref
  assert ref['status']=='existing' or any(i['output']==ref['path'] for i in items),ref
counts=Counter(i['category'] for i in items)
payload=dict(source='prototype/jade-gate/animation.js',sourceCommit='5f1ca74',date='2026-10-05',counts=dict(counts),requests=items)
(ROOT/'requests.json').write_text(json.dumps(payload,ensure_ascii=False,indent=2)+'\n')
(ROOT/'shot-map.json').write_text(json.dumps(shot_rows,ensure_ascii=False,indent=2)+'\n')
with (ROOT/'shot-map.csv').open('w',newline='') as f:
 w=csv.DictWriter(f,fieldnames=shot_rows[0].keys());w.writeheader();w.writerows(shot_rows)
(ROOT/'prompts').mkdir(exist_ok=True)
for item in items:
 text=f"{item['id']} — {item['title']}\nOUTPUT: {item['output']}\nSIZE: {item['size']}\nALPHA: {item['transparent']}\n\nATTACH REFERENCES (approve pending references before using this prompt):\n"+'\n'.join(f"- {r['path']} [{r['status']}]" for r in item['references'])+'\n\nCOPY PROMPT:\n'+item['prompt']+'\n\nANIMATION / HANDOFF:\n'+item['motion']+'\n'
 (ROOT/'prompts'/f"{item['id']}.txt").write_text(text)
for ep in SOURCE:
 lines=[f"# {ep['number']} · {ep['title']} — 鏡頭素材清單",'',f"來源：5f1ca74 · {ep['total']//60}:{ep['total']%60:02d} · {len(ep['scenes'])} 場",'', '| 場景 | 場內秒數 | 類型 | Prompt |','|---|---:|---|---|']
 for item in items:
  if item['episode']==ep['id']:
   lines.append(f"| {item['scene']} | {item['localTime'] if item['localTime'] is not None else '共用'} | {item['category']} | [{item['id']}](prompts/{item['id']}.txt) |")
 (ROOT/f"{ep['id']}-list.md").write_text('\n'.join(lines)+'\n')
with zipfile.ZipFile(ROOT/'all-prompts.zip','w',zipfile.ZIP_DEFLATED) as z:
 for file in sorted((ROOT/'prompts').glob('*.txt')):z.write(file,'prompts/'+file.name)
 for name in ['README.md','index.html','requests.json','shot-map.csv','ep1-list.md','ep2-list.md']:z.write(ROOT/name,name)
print(json.dumps(dict(total=len(items),categories=dict(counts),shots=len(shot_rows)),ensure_ascii=False))
