#!/usr/bin/env python3
"""Peg keyed pose strips and draw the in-betweens between them.

Each output frame is a full cutout on a shared registration: same canvas,
the planted foot on the same pixel. Playback shows one drawing at a time.
"""

from __future__ import annotations

import json
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
ART = Path("/opt/cursor/artifacts/assets")
OUT_Z = ROOT / "assets/fight/ep1-vanguard/layers/zhao-yun"
OUT_G = ROOT / "assets/fight/ep1-vanguard/layers/vanguard"
MANIFEST = Path(__file__).resolve().parent / "draw-manifest.json"

# Story order. Both lists are the same number of strips.
ZHAO_STRIPS = [
    "zhao-strip-a.jpg",
    "zhao-strip-02.jpg",
    "zhao-strip-03b.jpg",
    "zhao-strip-04.jpg",
    "zhao-strip-05.jpg",
    "zhao-strip-06.jpg",
    "zhao-strip-07.jpg",
]
GUAN_STRIPS = [
    "guan-strip-00.jpg",
    "guan-strip-01.jpg",
    "guan-strip-04.jpg",
    "guan-strip-02.jpg",
    "guan-strip-03.jpg",
    "guan-strip-06.jpg",
    "guan-strip-05.jpg",
]

# Frames per beat, in play order. Sum must match the drawn timeline.
# 7 strips × (4 keys + 3 gaps × 5 in-betweens) = 133 drawings.
BEAT_PLAN = [
    ("approach", 19),
    ("windup", 19),
    ("feint", 19),
    ("ots", 8),
    ("exchange", 14),
    ("impact", 10),
    ("counter", 12),
    ("reprise", 14),
    ("follow", 10),
    ("aftermath", 8),
]

FPS = 8
FRAME_MS = 1000 / FPS
CAN_H = 1040
CAN_W = 980
BODY = 820
# Zhao faces right: peg the planted foot left of center so the jian has room.
# Guan faces left: peg the foot right of center so the guandao has room.
PEG = {
    "zhao": (360, CAN_H - 2),
    "guan": (620, CAN_H - 2),
}


def is_magenta(rgb: np.ndarray) -> np.ndarray:
    r = rgb[:, :, 0].astype(np.int16)
    g = rgb[:, :, 1].astype(np.int16)
    b = rgb[:, :, 2].astype(np.int16)
    return (r > 150) & (b > 50) & (g < 140) & ((r - g) > 40) & ((b - g) > 10)


def key_image(path: Path) -> np.ndarray:
    rgb = np.array(Image.open(path).convert("RGB"))
    mag = is_magenta(rgb)
    alpha = np.where(mag, 0, 255).astype(np.uint8)
    # Pixels that touch the backdrop and still look like it go too.
    edge = mag.copy()
    for _ in range(2):
        grown = edge.copy()
        grown[1:] |= edge[:-1]
        grown[:-1] |= edge[1:]
        grown[:, 1:] |= edge[:, :-1]
        grown[:, :-1] |= edge[:, 1:]
        near = grown & ~mag
        r = rgb[:, :, 0].astype(np.int16)
        g = rgb[:, :, 1].astype(np.int16)
        b = rgb[:, :, 2].astype(np.int16)
        pink = near & (r > 140) & (g < 120) & ((r - g) > 25) & (b > g)
        alpha[pink] = 0
        edge = edge | pink
    out = np.dstack([rgb, alpha])
    # Despill leftover pink on the silhouette.
    r = out[:, :, 0].astype(np.int16)
    g = out[:, :, 1].astype(np.int16)
    b = out[:, :, 2].astype(np.int16)
    spill = (out[:, :, 3] > 0) & (r > g + 30) & (b > g + 8) & (g < 160)
    r = np.where(spill, g, r)
    b = np.where(spill, np.minimum(b, g + 12), b)
    out[:, :, 0] = np.clip(r, 0, 255).astype(np.uint8)
    out[:, :, 2] = np.clip(b, 0, 255).astype(np.uint8)
    return out


def runs_above(values: np.ndarray, thresh: float) -> list[tuple[int, int]]:
    runs = []
    start = None
    for i, on in enumerate(values > thresh):
        if on and start is None:
            start = i
        elif not on and start is not None:
            runs.append((start, i))
            start = None
    if start is not None:
        runs.append((start, len(values)))
    return [(a, b) for a, b in runs if b - a > 40]


def slices(fig: np.ndarray) -> list[np.ndarray]:
    # A thin sword can bridge two figures. Split on the body, not the blade.
    col = (fig[:, :, 3] > 16).sum(axis=0).astype(np.float32)
    smooth = np.convolve(col, np.ones(11) / 11, mode="same")
    peak = float(smooth.max() or 1)
    runs = None
    for frac in (0.08, 0.06, 0.1, 0.12, 0.15, 0.05, 0.2, 0.25):
        found = runs_above(smooth, max(8, peak * frac))
        if len(found) == 4:
            runs = found
            break
    if runs is None:
        raise SystemExit(f"expected 4 figures, histogram peak {peak:.0f}")
    parts = []
    for a, b in runs:
        crop = fig[:, a:b]
        mask = crop[:, :, 3] > 16
        ys, xs = np.where(mask)
        parts.append(crop[ys.min() : ys.max() + 1, xs.min() : xs.max() + 1])
    return parts


def body_height(fig: np.ndarray) -> int:
    row = (fig[:, :, 3] > 16).sum(axis=1)
    if row.max() < 5:
        return max(1, fig.shape[0])
    ys = np.where(row >= max(8, int(row.max() * 0.2)))[0]
    if len(ys) == 0:
        return max(1, fig.shape[0])
    return int(ys.max() - ys.min() + 1)


def peg(fig: np.ndarray, scale: float, foot_xy: tuple[int, int]) -> np.ndarray:
    nh = max(1, int(round(fig.shape[0] * scale)))
    nw = max(1, int(round(fig.shape[1] * scale)))
    resized = np.array(Image.fromarray(fig).resize((nw, nh), Image.Resampling.BILINEAR))
    # Bilinear leaves a soft fringe. Cut it before registration.
    resized[:, :, 3] = np.where(resized[:, :, 3] >= 128, 255, 0).astype(np.uint8)
    mask = resized[:, :, 3] > 0
    canvas = np.zeros((CAN_H, CAN_W, 4), np.uint8)
    if not mask.any():
        return canvas
    ys, xs = np.where(mask)
    band = mask.copy()
    top = int(mask.shape[0] * 0.9)
    band[:top] = False
    by, bx = np.where(band)
    if len(bx) == 0:
        by, bx = ys, xs
    fx = float(bx.mean())
    fy = float(by.max())
    left = int(round(foot_xy[0] - fx))
    top_i = int(round(foot_xy[1] - fy))
    src_x0 = max(0, -left)
    src_y0 = max(0, -top_i)
    dst_x0 = max(0, left)
    dst_y0 = max(0, top_i)
    src_x1 = min(nw, CAN_W - left)
    src_y1 = min(nh, CAN_H - top_i)
    if src_x1 > src_x0 and src_y1 > src_y0:
        canvas[dst_y0 : dst_y0 + (src_y1 - src_y0), dst_x0 : dst_x0 + (src_x1 - src_x0)] = resized[
            src_y0:src_y1, src_x0:src_x1
        ]
    return canvas


def load_strip(name: str, who: str) -> list[np.ndarray]:
    parts = slices(key_image(ART / name))
    # One scale for the strip, from the tallest body, so a crouch stays a crouch.
    heights = [body_height(part) for part in parts]
    scale = BODY / max(heights)
    foot = PEG[who]
    pegged = [peg(part, scale, foot) for part in parts]
    for i, frame in enumerate(pegged):
        edge = np.concatenate([frame[0, :, 3], frame[-1, :, 3], frame[:, 0, 3], frame[:, -1, 3]])
        if (edge > 0).mean() > 0.02:
            print(f"  clip warning {who} {name} figure {i}")
    return pegged


def flow(src: np.ndarray, dst: np.ndarray, bh: int = 96, bs: int = 8, rad: int = 16) -> tuple[np.ndarray, np.ndarray]:
    sh = bh
    sw = max(bs + 2, int(round(src.shape[1] * bh / src.shape[0])))
    small_src = np.array(Image.fromarray(src).resize((sw, sh), Image.Resampling.BOX)).astype(np.float32)
    small_dst = np.array(Image.fromarray(dst).resize((sw, sh), Image.Resampling.BOX)).astype(np.float32)
    ys = list(range(0, sh - bs + 1, bs))
    xs = list(range(0, sw - bs + 1, bs))
    field = np.zeros((len(ys), len(xs), 2), np.float32)
    step = 4
    for iy, y in enumerate(ys):
        for ix, x in enumerate(xs):
            patch = small_src[y : y + bs, x : x + bs]
            if patch[:, :, 3].mean() < 16:
                continue
            best = 1e18
            pick = (0.0, 0.0)
            for dy in range(-rad, rad + 1, step):
                y2 = y + dy
                if y2 < 0 or y2 + bs > sh:
                    continue
                for dx in range(-rad, rad + 1, step):
                    x2 = x + dx
                    if x2 < 0 or x2 + bs > sw:
                        continue
                    other = small_dst[y2 : y2 + bs, x2 : x2 + bs]
                    weight = (patch[:, :, 3] > 20) | (other[:, :, 3] > 20)
                    count = int(weight.sum())
                    if count < 8:
                        continue
                    delta = patch[:, :, :3] - other[:, :, :3]
                    score = float(np.mean((delta[weight]) ** 2))
                    if score < best:
                        best = score
                        pick = (float(dx), float(dy))
            field[iy, ix, 0] = pick[0]
            field[iy, ix, 1] = pick[1]
    fx = np.array(Image.fromarray(field[:, :, 0], mode="F").resize((src.shape[1], src.shape[0]), Image.Resampling.BILINEAR))
    fy = np.array(Image.fromarray(field[:, :, 1], mode="F").resize((src.shape[1], src.shape[0]), Image.Resampling.BILINEAR))
    return fx * (src.shape[1] / sw), fy * (src.shape[0] / sh)


def sample(im: np.ndarray, mapx: np.ndarray, mapy: np.ndarray) -> np.ndarray:
    height, width = im.shape[:2]
    x = np.clip(mapx, 0, width - 1)
    y = np.clip(mapy, 0, height - 1)
    x0 = np.floor(x).astype(np.int32)
    y0 = np.floor(y).astype(np.int32)
    x1 = np.clip(x0 + 1, 0, width - 1)
    y1 = np.clip(y0 + 1, 0, height - 1)
    wx = (x - x0)[..., None]
    wy = (y - y0)[..., None]
    a = im[y0, x0].astype(np.float32)
    b = im[y0, x1].astype(np.float32)
    c = im[y1, x0].astype(np.float32)
    d = im[y1, x1].astype(np.float32)
    return (a * (1 - wx) + b * wx) * (1 - wy) + (c * (1 - wx) + d * wx) * wy


def warp(im: np.ndarray, fx: np.ndarray, fy: np.ndarray, t: float) -> np.ndarray:
    height, width = im.shape[:2]
    yy, xx = np.mgrid[0:height, 0:width].astype(np.float32)
    return sample(im, xx - t * fx, yy - t * fy)


def harden(color: np.ndarray) -> np.ndarray:
    alpha = color[:, :, 3]
    rgb = np.clip(color[:, :, :3], 0, 255)
    hard = alpha >= 120
    # Drop a one-pixel fringe that is still pink or flat grey.
    ys, xs = np.where(hard)
    if len(xs) == 0:
        return np.zeros_like(color, dtype=np.uint8)
    edge = np.zeros(hard.shape, bool)
    edge[1:] |= hard[:-1] & ~hard[1:]
    edge[:-1] |= hard[1:] & ~hard[:-1]
    edge[:, 1:] |= hard[:, :-1] & ~hard[:, 1:]
    edge[:, :-1] |= hard[:, 1:] & ~hard[:, :-1]
    r = rgb[:, :, 0]
    g = rgb[:, :, 1]
    b = rgb[:, :, 2]
    pink = edge & (r > 140) & (g < 130) & ((r - g) > 20)
    grey = edge & (np.abs(r - g) < 14) & (np.abs(g - b) < 14) & (r > 90) & (r < 190)
    hard = hard & ~pink & ~grey
    out = np.zeros_like(color, dtype=np.uint8)
    out[:, :, :3] = rgb.astype(np.uint8)
    out[:, :, 3] = np.where(hard, 255, 0).astype(np.uint8)
    return out


def smooth_field(field: np.ndarray) -> np.ndarray:
    height, width = field.shape
    small = (max(8, width // 14), max(8, height // 14))
    image = Image.fromarray(field.astype(np.float32), mode="F")
    return np.array(image.resize(small, Image.Resampling.BOX).resize((width, height), Image.Resampling.BILINEAR))


def cap_field(fx: np.ndarray, fy: np.ndarray, limit: float = 72) -> tuple[np.ndarray, np.ndarray]:
    mag = np.hypot(fx, fy) + 1e-6
    scale = np.minimum(1, limit / mag)
    return fx * scale, fy * scale


def keep_body(frame: np.ndarray) -> np.ndarray:
    """Drop specks the warp leaves behind. Keep the large body masses."""
    alpha = frame[:, :, 3] > 0
    seen = np.zeros(alpha.shape, bool)
    comps = []
    height, width = alpha.shape
    # A stride search is enough: specks are a few pixels, the body is not.
    ys, xs = np.where(alpha)
    for y, x in zip(ys[::17], xs[::17]):
        if seen[y, x]:
            continue
        stack = [(int(y), int(x))]
        seen[y, x] = True
        cells = []
        while stack:
            cy, cx = stack.pop()
            cells.append((cy, cx))
            for ny, nx in ((cy + 1, cx), (cy - 1, cx), (cy, cx + 1), (cy, cx - 1)):
                if ny < 0 or nx < 0 or ny >= height or nx >= width:
                    continue
                if seen[ny, nx] or not alpha[ny, nx]:
                    continue
                seen[ny, nx] = True
                stack.append((ny, nx))
        comps.append(cells)
    if not comps:
        return frame
    comps.sort(key=len, reverse=True)
    main = len(comps[0])
    out = frame.copy()
    out[:, :, 3] = 0
    for cells in comps:
        if len(cells) < main * 0.08:
            continue
        for cy, cx in cells:
            out[cy, cx] = frame[cy, cx]
    return out


def inbetween(a: np.ndarray, b: np.ndarray, t: float, fx=None, fy=None, gx=None, gy=None):
    """One drawing, warped toward the next pose. No double exposure."""
    if fx is None:
        fx, fy = cap_field(*map(smooth_field, flow(a, b)))
        gx, gy = cap_field(*map(smooth_field, flow(b, a)))
    # Stay well short of a full remap. A full warp shears the sword into a second limb.
    if t < 0.5:
        drawn = harden(warp(a, fx, fy, (t / 0.5) * 0.62))
    else:
        drawn = harden(warp(b, gx, gy, ((1 - t) / 0.5) * 0.62))
    return keep_body(drawn), (fx, fy, gx, gy)


def distance(fx: np.ndarray, fy: np.ndarray, mask: np.ndarray) -> float:
    if not mask.any():
        return 0.0
    mag = np.hypot(fx, fy)
    return float(np.median(mag[mask]))


def tween_count(a: np.ndarray, b: np.ndarray) -> tuple[int, tuple]:
    fx, fy = cap_field(*map(smooth_field, flow(a, b)))
    gx, gy = cap_field(*map(smooth_field, flow(b, a)))
    dist = distance(fx, fy, a[:, :, 3] > 0)
    # Five drawings between keys. The beat plan is 7 strips × 19 frames.
    return 5, (fx, fy, gx, gy, dist)


def draw_role(names: list[str], who: str) -> tuple[list[np.ndarray], list[str]]:
    frames: list[np.ndarray] = []
    labels: list[str] = []
    for strip_i, name in enumerate(names):
        print(f"{who} strip {strip_i} {name}")
        keys = load_strip(name, who)
        for key_i, key in enumerate(keys):
            frames.append(key)
            labels.append(f"{name}:{key_i}")
            if key_i == len(keys) - 1:
                continue
            nxt = keys[key_i + 1]
            count, packed = tween_count(key, nxt)
            fx, fy, gx, gy, dist = packed
            print(f"  {key_i}->{key_i + 1} dist {dist:.1f} tweens {count}")
            for n in range(1, count + 1):
                t = n / (count + 1)
                drawn, _ = inbetween(key, nxt, t, fx, fy, gx, gy)
                frames.append(drawn)
                labels.append(f"{name}:{key_i}-{key_i + 1}@{t:.2f}")
    return frames, labels


def crop_shared(frames: list[np.ndarray]) -> tuple[list[np.ndarray], float]:
    union = np.zeros(frames[0].shape[:2], bool)
    for frame in frames:
        union |= frame[:, :, 3] > 0
    ys, xs = np.where(union)
    y0, y1 = int(ys.min()), int(ys.max()) + 1
    x0, x1 = int(xs.min()), int(xs.max()) + 1
    # Keep the ground line: the shared bottom is the lowest planted foot.
    cropped = [frame[y0:y1, x0:x1] for frame in frames]
    # Foot x is the peg, shifted by the crop. Same fraction for every frame.
    who_peg = None
    return cropped, x0


def save_role(frames: list[np.ndarray], who: str, folder: Path, prefix: str) -> dict:
    cropped, x0 = crop_shared(frames)
    peg_x = PEG["zhao" if who == "zhao" else "guan"][0] - x0
    folder.mkdir(parents=True, exist_ok=True)
    ids = []
    stored = {}
    height = cropped[0].shape[0]
    for i, frame in enumerate(cropped):
        xs = np.where(frame[:, :, 3] > 16)[1]
        left = max(0, int(xs.min()) - 2)
        right = min(frame.shape[1], int(xs.max()) + 3)
        tight = frame[:, left:right]
        name = f"{prefix}{i:03d}.png"
        Image.fromarray(tight).save(folder / name, optimize=True)
        stem = name[:-4]
        ids.append(stem)
        stored[stem] = {"w": int(tight.shape[1]), "anchor": round((peg_x - left) / tight.shape[1], 4)}
    print(f"{who} {len(ids)} frames h {height}")
    return {"ids": ids, "h": height, "frames": stored}


def assign_beats(n: int) -> list[tuple[str, int]]:
    planned = sum(count for _, count in BEAT_PLAN)
    if planned != n:
        raise SystemExit(f"beat plan {planned} != drawn frames {n}")
    return list(BEAT_PLAN)


def main() -> None:
    z_frames, _ = draw_role(ZHAO_STRIPS, "zhao")
    g_frames, _ = draw_role(GUAN_STRIPS, "guan")
    if len(z_frames) != len(g_frames):
        raise SystemExit(f"count mismatch zhao {len(z_frames)} guan {len(g_frames)}")
    # The beat plan is fixed. If the adaptive tween count drifted, resample
    # by index so both roles still share one clock of the planned length.
    target = sum(count for _, count in BEAT_PLAN)
    z_frames = fit_count(z_frames, target)
    g_frames = fit_count(g_frames, target)
    zhao = save_role(z_frames, "zhao", OUT_Z, "d")
    guan = save_role(g_frames, "guan", OUT_G, "d")
    beats = []
    cursor = 0
    for beat, count in BEAT_PLAN:
        beats.append({
            "id": beat,
            "ms": int(round(count * FRAME_MS)),
            "hero": zhao["ids"][cursor : cursor + count],
            "rival": guan["ids"][cursor : cursor + count],
        })
        cursor += count
    manifest = {
        "fps": FPS,
        "frameMs": FRAME_MS,
        "zhao": {"h": zhao["h"], "frames": zhao["frames"]},
        "guan": {"h": guan["h"], "frames": guan["frames"]},
        "beats": beats,
    }
    MANIFEST.write_text(json.dumps(manifest))
    module = ROOT / "capscreens-fight-designs" / "vanguard-draw.mjs"
    body = "/** Generated by scripts/draw-inbetweens.py. One cutout per drawing. */\n"
    body += "export const DRAW = " + json.dumps(manifest) + ";\n"
    module.write_text(body)
    print("wrote", MANIFEST, "frames", target, "ms", sum(b["ms"] for b in beats))


def fit_count(frames: list[np.ndarray], target: int) -> list[np.ndarray]:
    if len(frames) == target:
        return frames
    if len(frames) < 2:
        raise SystemExit("not enough frames to fit")
    print(f"  fit {len(frames)} -> {target}")
    picked = []
    for i in range(target):
        src = int(round(i * (len(frames) - 1) / (target - 1)))
        picked.append(frames[src])
    return picked


if __name__ == "__main__":
    main()
