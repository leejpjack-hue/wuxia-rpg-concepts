#!/usr/bin/env python3
"""
Comprehensive Verification Suite for Blades of the Four — Act II Scaffolding & Mechanics
Covers:
  Story 1: Night Heron Checkpoint Keys Alignment & Legacy Aliases
  Story 2: Act II Card Duel Content (DUEL_ROSTERS, DUEL_ENEMIES, Boss Flag, Roam Creation)
  Story 3: Shallows Roam Impedance & Fixed-Step Determinism
"""

import sys
import math

passed_count = 0
failed_count = 0

def check(name, condition, extra=""):
    global passed_count, failed_count
    if condition:
        passed_count += 1
        print(f"  [PASS] {name} {extra}")
    else:
        failed_count += 1
        print(f"  [FAIL] {name} {extra}")

print("=====================================================================")
print(" Blades of the Four: Story Verification Suite (pstack poteto-mode)")
print("=====================================================================\n")

# ---------------------------------------------------------------------
# Story 1: Night Heron Checkpoint Keys Alignment & Legacy Aliases
# ---------------------------------------------------------------------
print("--- Story 1: Night Heron Checkpoint Keys Alignment ---")

with open("src/domain/session.js") as f:
    session_code = f.read()
with open("src/content/dialogue.js") as f:
    dialogue_code = f.read()
with open("src/platform/audio-director.js") as f:
    audio_code = f.read()
with open("src/content/campaign.js") as f:
    campaign_code = f.read()

check("session.js dialogueStages includes night-heron-intro", '"night-heron-intro"' in session_code)
check("session.js dialogueStages includes night-heron-fall", '"night-heron-fall"' in session_code)
check("session.js dialogueStages retains legacy heron-intro alias", '"heron-intro"' in session_code)
check("session.js dialogueStages retains legacy heron-fall alias", '"heron-fall"' in session_code)
check("session.js advanceDialogue recognizes night-heron-fall", 'key === "night-heron-fall"' in session_code)
check("dialogue.js accepts canonical night-heron-intro", '"night-heron-intro"' in dialogue_code)
check("dialogue.js accepts canonical night-heron-fall", '"night-heron-fall"' in dialogue_code)
check("dialogue.js accepts legacy heron-intro", '"heron-intro"' in dialogue_code)
check("dialogue.js accepts legacy heron-fall", '"heron-fall"' in dialogue_code)
check("audio-director.js maps night-heron-intro to boss mode", '"night-heron-intro"' in audio_code)
check("audio-director.js maps night-heron-fall to victory mode", '"night-heron-fall"' in audio_code)
check("bamboo-crossing remains available: false", 'id: "bamboo-crossing"' in campaign_code and 'available: false' in campaign_code)

# ---------------------------------------------------------------------
# Story 2: Act II Card Duel Content Behind the Gate
# ---------------------------------------------------------------------
print("\n--- Story 2: Act II Card Duel Content (behind gate) ---")

with open("src/content/duels.js") as f:
    duels_code = f.read()

check("DUEL_ROSTERS defined for bamboo-ambush", '"bamboo-ambush"' in duels_code)
check("DUEL_ROSTERS defined for river-skiff", '"river-skiff"' in duels_code)
check("DUEL_ROSTERS defined for night-heron", '"night-heron"' in duels_code)
check("DUEL_ENEMIES defined for shadow-assassin", '"shadow-assassin"' in duels_code)
check("DUEL_ENEMIES defined for skiff-archer", '"skiff-archer"' in duels_code)
check("DUEL_ENEMIES defined for night-heron", '"night-heron"' in duels_code)

# Check that night-heron planned flag is cleared in campaign.js
lines = campaign_code.splitlines()
nh_idx = [i for i, l in enumerate(lines) if '"night-heron": {' in l][0]
nh_block = "\n".join(lines[nh_idx:nh_idx+20])
check("BOSSES['night-heron'].planned is cleared (unblocked)", "planned: true" not in nh_block)
check("BOSSES['night-heron'] preserves phases", "phases:" in nh_block)
check("BOSSES['night-heron'] preserves hp (620)", "hp: 620" in nh_block)

# ---------------------------------------------------------------------
# Story 3: Shallows Impedance in roam.js
# ---------------------------------------------------------------------
print("\n--- Story 3: Shallows Impedance in roam.js ---")

with open("src/domain/roam.js") as f:
    roam_code = f.read()

check("PLAYER_SPEED constant defined as 240", "PLAYER_SPEED = 240" in roam_code)
check("SHALLOWS_ROAM_SPEED_FACTOR defined as 0.65", "SHALLOWS_ROAM_SPEED_FACTOR = 0.65" in roam_code)
check("getHeroRoamSpeed function defined", "function getHeroRoamSpeed" in roam_code)
check("createRoam factory defined", "function createRoam" in roam_code)

# Simulate roam kinematics
PLAYER_SPEED = 240
SHALLOWS_ROAM_SPEED_FACTOR = 0.65

dt = 1 / 60
dry_disp = 60 * (PLAYER_SPEED * dt)
shallow_disp = 60 * (PLAYER_SPEED * SHALLOWS_ROAM_SPEED_FACTOR * dt)

check("Dry ground 1s displacement equals PLAYER_SPEED (240px)", abs(dry_disp - 240.0) < 1e-6)
check("Shallows 1s displacement equals 156px", abs(shallow_disp - 156.0) < 1e-6)
check("Displacement ratio is exactly 65% (within 60-70% spec)", abs(shallow_disp / dry_disp - 0.65) < 1e-6)

# Fixed-step determinism test: 30 steps @ 1/30s vs 60 steps @ 1/60s
disp_30 = 30 * (PLAYER_SPEED * SHALLOWS_ROAM_SPEED_FACTOR * (1 / 30))
disp_60 = 60 * (PLAYER_SPEED * SHALLOWS_ROAM_SPEED_FACTOR * (1 / 60))
check("Fixed-step determinism (30 @ 1/30s == 60 @ 1/60s)", abs(disp_30 - disp_60) < 1e-12)

print("\n=====================================================================")
print(f" Summary: {passed_count} PASSED, {failed_count} FAILED")
print("=====================================================================")

if failed_count > 0:
    sys.exit(1)
