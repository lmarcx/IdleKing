"""Procedural generator for the Kingdom Hub pixel-art assets.

Produces larger, more detailed buildings than the original stub set: shaded
stone / wood walls, lit windows, ridged roofs, banners, chimneys with smoke and
magical FX. The output filenames are stable so the PixiJS hub stage keeps
working, and each building is a self-contained function so it can later be
swapped for hand-authored / AI art without touching the rest of the pipeline.

Run:  py -3 apps/web/scripts/generate-kingdom-hub-assets.py
Requires:  Pillow  (pip install Pillow)
"""

from __future__ import annotations

import math
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter


ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "public" / "assets" / "kingdom-hub"

# Logical building canvas. Scaled up with NEAREST for crisp pixels.
B = 128
SCALE = 3

P = {
    "void": (0, 0, 0, 0),
    # ground tiles
    "floor": (33, 33, 58, 255),
    "floor_2": (42, 40, 72, 255),
    "floor_3": (24, 25, 46, 255),
    "edge": (12, 13, 24, 255),
    "line": (84, 78, 116, 255),
    # stone
    "stone_hi": (132, 134, 152, 255),
    "stone": (92, 95, 114, 255),
    "stone_mid": (70, 73, 92, 255),
    "stone_dark": (44, 47, 64, 255),
    "stone_deep": (28, 30, 44, 255),
    "mortar": (34, 35, 52, 255),
    # wood
    "wood_hi": (150, 99, 58, 255),
    "wood": (110, 69, 41, 255),
    "wood_dark": (74, 45, 28, 255),
    "wood_deep": (50, 31, 20, 255),
    # roofs
    "roof_hi": (96, 70, 138, 255),
    "roof": (66, 44, 104, 255),
    "roof_dark": (44, 28, 72, 255),
    "roof_deep": (30, 18, 50, 255),
    "tile_red_hi": (150, 64, 70, 255),
    "tile_red": (108, 42, 50, 255),
    "tile_red_dark": (74, 28, 36, 255),
    # gold
    "gold_hi": (255, 224, 130, 255),
    "gold": (224, 168, 62, 255),
    "gold_dark": (150, 100, 40, 255),
    "gold_deep": (96, 62, 26, 255),
    # accents
    "cyan_hi": (158, 244, 248, 255),
    "cyan": (84, 210, 226, 255),
    "cyan_dark": (44, 132, 156, 255),
    "violet_hi": (190, 150, 255, 255),
    "violet": (150, 100, 232, 255),
    "violet_dark": (92, 58, 150, 255),
    "fire_hi": (255, 206, 110, 255),
    "fire": (244, 122, 44, 255),
    "fire_dark": (176, 64, 28, 255),
    "ember": (255, 158, 70, 255),
    # nature
    "green_hi": (140, 184, 96, 255),
    "green": (92, 138, 74, 255),
    "green_dark": (52, 86, 56, 255),
    "wheat": (224, 190, 96, 255),
    "wheat_hi": (246, 220, 132, 255),
    # window glow
    "win_warm": (255, 198, 96, 255),
    "win_warm_hi": (255, 232, 170, 255),
    "win_cool": (120, 214, 232, 255),
    # character
    "skin": (198, 150, 110, 255),
    "skin_dark": (150, 104, 74, 255),
    "cloth": (74, 76, 104, 255),
    "cloth_hi": (110, 110, 146, 255),
    "cloak": (58, 44, 92, 255),
    "cloak_hi": (92, 72, 138, 255),
}


def img(size: int = B) -> Image.Image:
    return Image.new("RGBA", (size, size), P["void"])


def lerp(a, b, t: float):
    t = max(0.0, min(1.0, t))
    n = max(len(a), len(b))
    a = tuple(a) + (255,) * (n - len(a))
    b = tuple(b) + (255,) * (n - len(b))
    return tuple(round(a[i] + (b[i] - a[i]) * t) for i in range(n))


def save(im: Image.Image, name: str) -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    im = im.resize((im.width * SCALE, im.height * SCALE), Image.Resampling.NEAREST)
    im.save(OUT / f"{name}.png")


def rect(d, box, fill, outline=None) -> None:
    d.rectangle(box, fill=fill, outline=outline)


def vgrad(d, box, top, bot) -> None:
    x0, y0, x1, y1 = box
    h = max(1, y1 - y0)
    for y in range(int(y0), int(y1) + 1):
        d.line((x0, y, x1, y), fill=lerp(top, bot, (y - y0) / h))


def block(d, box, light, dark, edge=None) -> None:
    """Filled vertical-gradient panel with rim light and shaded edges."""
    x0, y0, x1, y1 = box
    vgrad(d, box, light, dark)
    d.line((x0, y0, x1, y0), fill=light)
    d.line((x0, y0, x0, y1), fill=lerp(light, dark, 0.35))
    d.line((x1, y0, x1, y1), fill=dark)
    d.line((x0, y1, x1, y1), fill=lerp(dark, P["edge"], 0.5))
    if edge:
        rect(d, box, None, edge)


def bricks(d, box, base, light, dark, mortar, bw=13, bh=8) -> None:
    x0, y0, x1, y1 = (int(v) for v in box)
    block(d, (x0, y0, x1, y1), light, dark)
    row = 0
    y = y0
    while y < y1:
        off = (bw // 2) if row % 2 else 0
        x = x0 - off
        while x < x1:
            bx0, bx1 = max(x, x0), min(x + bw - 1, x1)
            by0, by1 = max(y, y0), min(y + bh - 1, y1)
            if bx1 > bx0 and by1 > by0:
                shade = ((x // 7 + y // 5) % 3)
                col = lerp(base, dark, 0.10 * shade)
                rect(d, (bx0, by0, bx1, by1), col)
                d.line((bx0, by0, bx1, by0), fill=lerp(col, light, 0.45))
                d.line((bx0, by0, bx0, by1), fill=lerp(col, light, 0.22))
            x += bw
        d.line((x0, y, x1, y), fill=mortar)
        y += bh
        row += 1
    d.line((x0, y1, x1, y1), fill=mortar)


def gable(d, apex, base_l, base_r, hi, mid, dark, edge=None) -> None:
    """Gabled roof: filled triangle with a ridge highlight + eave shadow."""
    pts = [apex, base_r, base_l]
    d.polygon(pts, fill=mid)
    ax, ay = apex
    # left slope catches light
    d.line((ax, ay, base_l[0], base_l[1]), fill=hi, width=2)
    # right slope in shadow
    d.line((ax, ay, base_r[0], base_r[1]), fill=dark, width=2)
    # eave line
    d.line((base_l[0], base_l[1], base_r[0], base_r[1]), fill=P["edge"], width=2)
    # interior shading hatch
    for t in (0.3, 0.55, 0.8):
        lx = round(ax + (base_l[0] - ax) * t)
        rx = round(ax + (base_r[0] - ax) * t)
        ly = round(ay + (base_l[1] - ay) * t)
        d.line((lx, ly, rx, ly), fill=lerp(mid, dark, 0.5 * t))
    if edge:
        d.line(pts + [apex], fill=edge)


def window(d, box, glow, frame=None, arched=False) -> None:
    x0, y0, x1, y1 = (int(v) for v in box)
    frame = frame or P["gold_dark"]
    rect(d, (x0 - 1, y0 - 1, x1 + 1, y1 + 1), frame)
    if arched:
        d.pieslice((x0 - 1, y0 - 1, x1 + 1, (y0 + y1) // 2), 180, 360, fill=frame)
    vgrad(d, (x0, y0, x1, y1), lerp(glow, (255, 255, 255), 0.45), glow)
    cx, cy = (x0 + x1) // 2, (y0 + y1) // 2
    d.line((cx, y0, cx, y1), fill=frame)
    d.line((x0, cy, x1, cy), fill=frame)
    # warm bleed at the sill
    d.line((x0, y1, x1, y1), fill=lerp(glow, P["gold_hi"], 0.4))


def soft_glow(d, cx, cy, r, color, steps=(22, 13, 7)) -> None:
    """Faint additive-looking halo. Kept subtle so it reads as light, not a disc."""
    for i, a in enumerate(steps):
        rr = r + i * 4
        d.ellipse((cx - rr, cy - rr, cx + rr, cy + rr), fill=(*color[:3], a))


def ground_shadow(d, cx, y, w, h=8, a=84) -> None:
    d.ellipse((cx - w, y - h, cx + w, y + h), fill=(0, 0, 0, a))


def banner(d, x, top, color, hi, h=22, w=9) -> None:
    d.line((x, top - 3, x, top), fill=P["gold"])
    rect(d, (x - w // 2, top, x + w // 2, top + h), color, P["edge"])
    d.line((x - w // 2 + 1, top + 1, x - w // 2 + 1, top + h - 2), fill=hi)
    # forked tail
    d.polygon([(x - w // 2, top + h), (x, top + h - 5), (x + w // 2, top + h)], fill=P["edge"])
    rect(d, (x - 1, top + 4, x + 1, top + 12), P["gold_hi"])


def flag(d, x, top, color, hi) -> None:
    d.line((x, top - 14, x, top + 4), fill=P["gold"], width=1)
    d.polygon([(x, top - 14), (x + 13, top - 10), (x, top - 6)], fill=color)
    d.line((x, top - 14, x + 13, top - 10), fill=hi)


def smoke(d, x, y) -> None:
    for i, (dx, dy, r, a) in enumerate(
        [(0, 0, 4, 150), (-2, -6, 5, 120), (1, -13, 6, 92), (-2, -21, 7, 60), (1, -29, 8, 34)]
    ):
        d.ellipse((x + dx - r, y + dy - r, x + dx + r, y + dy + r), fill=(176, 176, 196, a))


# ---------------------------------------------------------------------------
# Ground tiles
# ---------------------------------------------------------------------------

def stone_tile(kind: str) -> Image.Image:
    im = Image.new("RGBA", (32, 32), P["floor"])
    d = ImageDraw.Draw(im, "RGBA")
    cells = [
        (0, 0, 15, 15, P["floor_2"]),
        (16, 0, 31, 15, P["floor"]),
        (0, 16, 15, 31, P["floor"]),
        (16, 16, 31, 31, P["floor_2"]),
    ]
    for x0, y0, x1, y1, c in cells:
        rect(d, (x0, y0, x1, y1), c)
        d.line((x0, y0, x1, y0), fill=P["line"])
        d.line((x0, y0, x0, y1), fill=P["line"])
        d.line((x0, y1, x1, y1), fill=P["edge"])
        d.line((x1, y0, x1, y1), fill=P["edge"])
    for x, y in [(2, 3), (24, 5), (8, 23), (21, 25), (13, 11), (29, 19)]:
        rect(d, (x, y, x + 1, y + 1), P["floor_3"])

    if kind == "runes":
        d.line((9, 10, 12, 7), fill=P["cyan"])
        d.line((12, 7, 15, 10), fill=P["cyan"])
        d.line((12, 7, 12, 14), fill=P["violet"])
        d.line((19, 18, 23, 18), fill=P["cyan"])
        d.line((21, 15, 21, 22), fill=P["violet"])
        rect(d, (5, 20, 6, 21), (*P["cyan"][:3], 150))
        rect(d, (25, 9, 26, 10), (*P["violet"][:3], 150))
    elif kind == "circle":
        d.ellipse((5, 5, 26, 26), outline=P["gold_dark"])
        d.ellipse((8, 8, 23, 23), outline=P["violet"])
        d.ellipse((12, 12, 19, 19), outline=P["gold"])
        for x, y in [(15, 4), (15, 25), (4, 15), (25, 15)]:
            rect(d, (x, y, x + 1, y + 1), P["gold_hi"])
    im.putalpha(255)
    return im


# ---------------------------------------------------------------------------
# Buildings
# ---------------------------------------------------------------------------

def forum() -> Image.Image:
    im = img()
    d = ImageDraw.Draw(im, "RGBA")
    soft_glow(d, 64, 58, 36, P["violet"])
    ground_shadow(d, 64, 110, 46, 11)

    # stepped stone platform
    bricks(d, (22, 90, 106, 108), P["stone"], P["stone_hi"], P["stone_dark"], P["mortar"], 14, 7)
    rect(d, (18, 104, 110, 110), P["stone_dark"], P["edge"])
    rect(d, (26, 86, 102, 92), P["stone_mid"], P["edge"])

    # main hall walls
    bricks(d, (30, 56, 98, 92), P["stone"], P["stone_hi"], P["stone_dark"], P["mortar"], 13, 8)

    # columns
    for cx in (36, 50, 78, 92):
        rect(d, (cx - 3, 58, cx + 3, 90), P["stone_hi"], P["stone_dark"])
        d.line((cx - 3, 58, cx - 3, 90), fill=P["stone_hi"])
        d.line((cx + 3, 58, cx + 3, 90), fill=P["stone_deep"])
        rect(d, (cx - 5, 56, cx + 5, 60), P["stone_hi"], P["edge"])
        rect(d, (cx - 5, 88, cx + 5, 92), P["stone_mid"], P["edge"])

    # grand doorway
    rect(d, (58, 64, 70, 92), P["gold_deep"], P["edge"])
    d.pieslice((57, 58, 71, 78), 180, 360, fill=P["gold_deep"])
    rect(d, (61, 70, 67, 92), P["violet_dark"])
    d.line((64, 70, 64, 90), fill=P["violet_hi"])

    # lit side windows
    window(d, (40, 68, 47, 80), P["win_warm"], arched=True)
    window(d, (81, 68, 88, 80), P["win_warm"], arched=True)

    # big purple gable + gold pediment
    gable(d, (64, 30), (24, 56), (104, 56), P["roof_hi"], P["roof"], P["roof_deep"], P["edge"])
    rect(d, (36, 50, 92, 58), P["roof_dark"], P["edge"])
    for gx in range(40, 90, 8):
        rect(d, (gx, 52, gx + 2, 56), P["gold_dark"])

    # gold cupola / dome on the ridge
    d.ellipse((54, 18, 74, 36), fill=P["gold"], outline=P["gold_deep"])
    d.pieslice((54, 18, 74, 38), 180, 360, fill=P["gold_dark"])
    d.ellipse((57, 21, 67, 31), fill=P["gold_hi"])
    rect(d, (63, 8, 65, 20), P["gold"])
    rect(d, (61, 6, 67, 9), P["gold_hi"])

    banner(d, 30, 60, P["violet"], P["violet_hi"])
    banner(d, 98, 60, P["violet"], P["violet_hi"])
    flag(d, 36, 56, P["gold"], P["gold_hi"])
    flag(d, 92, 56, P["gold"], P["gold_hi"])
    return im


def temple() -> Image.Image:
    im = img()
    d = ImageDraw.Draw(im, "RGBA")
    soft_glow(d, 64, 50, 34, P["cyan"])
    ground_shadow(d, 64, 110, 38, 10)

    rect(d, (30, 100, 98, 110), P["stone_dark"], P["edge"])
    bricks(d, (38, 92, 90, 102), P["stone"], P["stone_hi"], P["stone_dark"], P["mortar"], 13, 7)

    # tall body
    bricks(d, (44, 50, 84, 94), P["stone"], P["stone_hi"], P["stone_dark"], P["mortar"], 12, 8)

    # flanking columns
    for cx in (40, 88):
        rect(d, (cx - 3, 52, cx + 3, 94), P["stone_hi"], P["stone_dark"])
        d.line((cx + 3, 52, cx + 3, 94), fill=P["stone_deep"])
        rect(d, (cx - 5, 50, cx + 5, 54), P["stone_mid"], P["edge"])
        d.line((cx, 60, cx, 88), fill=P["violet"])

    # central beam of light
    vgrad(d, (60, 34, 68, 94), P["cyan_hi"], P["cyan_dark"])
    d.line((64, 30, 64, 94), fill=P["cyan_hi"], width=2)
    rect(d, (58, 34, 70, 94), None, P["gold_dark"])

    # arched door with a contained cyan glow
    d.pieslice((54, 68, 74, 92), 180, 360, fill=(14, 16, 26, 255))
    rect(d, (54, 80, 74, 94), (14, 16, 26, 255))
    vgrad(d, (58, 76, 70, 93), P["cyan"], P["cyan_dark"])
    d.ellipse((61, 84, 67, 90), fill=P["cyan_hi"])
    d.arc((53, 67, 75, 93), 180, 360, fill=P["gold_dark"], width=2)

    # steep roof + crowning orb
    gable(d, (64, 24), (34, 52), (94, 52), P["roof_hi"], P["roof"], P["roof_deep"], P["edge"])
    rect(d, (40, 47, 88, 53), P["roof_dark"], P["edge"])
    soft_glow(d, 64, 22, 7, P["cyan"])
    d.ellipse((59, 15, 69, 25), fill=P["cyan_hi"], outline=P["gold"])
    rect(d, (63, 6, 65, 16), P["gold"])
    return im


def mine() -> Image.Image:
    im = img()
    d = ImageDraw.Draw(im, "RGBA")
    ground_shadow(d, 64, 110, 46, 11)

    # rocky mound
    d.polygon([(18, 108), (26, 60), (44, 36), (64, 28), (84, 38), (100, 62), (108, 108)],
              fill=P["stone_dark"], outline=P["edge"])
    d.polygon([(30, 100), (40, 64), (56, 46), (64, 44)], fill=P["stone_mid"])
    for x, y in [(34, 72), (74, 58), (90, 80), (48, 54), (82, 96)]:
        d.ellipse((x - 3, y - 3, x + 3, y + 3), fill=P["stone"], outline=P["stone_deep"])

    # mine entrance (timber arch)
    d.pieslice((44, 56, 84, 96), 180, 360, fill=(8, 9, 16, 255))
    rect(d, (44, 76, 84, 104), (8, 9, 16, 255))
    rect(d, (42, 54, 48, 104), P["wood"], P["wood_deep"])
    rect(d, (80, 54, 86, 104), P["wood"], P["wood_deep"])
    d.polygon([(40, 58), (64, 48), (88, 58), (84, 62), (44, 62)], fill=P["wood_hi"], outline=P["wood_deep"])

    # embedded crystals (subtle glow only)
    for x, y, c in [(32, 80, P["cyan"]), (94, 74, P["violet"]), (62, 94, P["cyan"])]:
        soft_glow(d, x, y, 3, c, (26, 14))
        d.polygon([(x, y - 5), (x + 3, y), (x, y + 5), (x - 3, y)], fill=lerp(c, (255, 255, 255), 0.35), outline=P["edge"])
        d.point((x - 1, y - 1), fill=P["cyan_hi"])

    # rails + minecart
    d.line((52, 102, 96, 100), fill=P["wood_dark"], width=2)
    d.line((58, 102, 100, 100), fill=P["wood_dark"], width=2)
    for rx in range(54, 100, 7):
        d.line((rx, 99, rx, 103), fill=P["stone_hi"])
    rect(d, (88, 90, 102, 100), P["wood"], P["wood_deep"])
    rect(d, (90, 86, 100, 92), P["fire_dark"])
    d.ellipse((87, 99, 92, 104), fill=P["edge"])
    d.ellipse((97, 99, 102, 104), fill=P["edge"])
    return im


def kitchen() -> Image.Image:
    im = img()
    d = ImageDraw.Draw(im, "RGBA")
    soft_glow(d, 78, 44, 12, P["fire"])
    ground_shadow(d, 64, 110, 42, 10)

    rect(d, (24, 104, 104, 110), P["stone_dark"], P["edge"])

    # chimney + smoke
    rect(d, (76, 32, 86, 60), P["tile_red_dark"], P["edge"])
    bricks(d, (76, 32, 86, 60), P["tile_red"], P["tile_red_hi"], P["tile_red_dark"], P["edge"], 6, 5)
    rect(d, (74, 30, 88, 35), P["stone_mid"], P["edge"])
    smoke(d, 81, 28)

    # cottage body (warm wood)
    bricks(d, (28, 60, 100, 104), P["wood"], P["wood_hi"], P["wood_dark"], P["wood_deep"], 16, 7)
    # exposed timber framing
    for fx in (28, 48, 80, 100):
        rect(d, (fx - 1, 60, fx + 1, 104), P["wood_deep"])
    rect(d, (28, 80, 100, 82), P["wood_deep"])

    # thatched / tiled roof
    gable(d, (64, 34), (20, 62), (108, 62), P["tile_red_hi"], P["tile_red"], P["tile_red_dark"], P["edge"])
    for rx in range(26, 104, 9):
        d.line((rx, 50, rx - 4, 62), fill=lerp(P["tile_red"], P["edge"], 0.4))

    # door + warm windows
    rect(d, (56, 80, 72, 104), P["wood_dark"], P["wood_deep"])
    rect(d, (58, 82, 70, 104), P["wood"])
    d.ellipse((67, 92, 69, 94), fill=P["gold_hi"])
    window(d, (34, 68, 45, 80), P["win_warm"])
    window(d, (83, 68, 94, 80), P["win_warm"])

    # hanging pot sign
    d.line((50, 60, 50, 66), fill=P["edge"])
    d.ellipse((45, 66, 55, 74), fill=P["stone_mid"], outline=P["edge"])
    rect(d, (48, 64, 52, 67), P["stone_hi"])
    return im


def forge() -> Image.Image:
    im = img()
    d = ImageDraw.Draw(im, "RGBA")
    soft_glow(d, 76, 84, 16, P["fire"])
    ground_shadow(d, 64, 110, 44, 11)

    rect(d, (24, 104, 104, 110), P["stone_dark"], P["edge"])

    # big chimney with embers
    bricks(d, (30, 30, 44, 64), P["stone"], P["stone_hi"], P["stone_dark"], P["mortar"], 7, 5)
    rect(d, (28, 28, 46, 33), P["stone_mid"], P["edge"])
    smoke(d, 37, 26)
    for ex, ey in [(34, 24), (40, 20), (37, 16)]:
        d.ellipse((ex - 1, ey - 1, ex + 1, ey + 1), fill=P["ember"])

    # stone smithy body
    bricks(d, (28, 58, 100, 104), P["stone"], P["stone_hi"], P["stone_dark"], P["mortar"], 14, 8)

    # metal roof
    gable(d, (64, 36), (22, 60), (106, 60), P["stone_hi"], P["stone_mid"], P["stone_deep"], P["edge"])
    for rx in range(28, 102, 8):
        d.line((rx, 48, rx, 60), fill=P["stone_deep"])

    # furnace recess with a contained fire
    d.pieslice((60, 64, 92, 96), 180, 360, fill=(20, 12, 10, 255))
    rect(d, (60, 80, 92, 100), (20, 12, 10, 255))
    vgrad(d, (66, 74, 86, 97), P["fire"], P["fire_dark"])
    d.ellipse((71, 82, 81, 95), fill=P["ember"])
    d.ellipse((73, 85, 79, 92), fill=P["fire_hi"])
    d.arc((59, 63, 93, 97), 180, 360, fill=P["gold_dark"], width=2)
    rect(d, (60, 98, 92, 102), P["stone_dark"], P["edge"])

    # anvil + hammer out front
    rect(d, (34, 86, 52, 92), P["stone_hi"], P["edge"])
    d.polygon([(50, 86), (58, 84), (58, 90), (50, 90)], fill=P["stone_hi"], outline=P["edge"])
    rect(d, (40, 92, 46, 100), P["stone_dark"], P["edge"])
    d.line((44, 80, 50, 86), fill=P["wood"], width=2)
    rect(d, (47, 78, 54, 82), P["stone_mid"], P["edge"])
    for sx, sy in [(56, 84), (60, 88), (54, 90)]:
        d.ellipse((sx - 1, sy - 1, sx + 1, sy + 1), fill=P["fire_hi"])
    return im


def farm() -> Image.Image:
    im = img()
    d = ImageDraw.Draw(im, "RGBA")
    ground_shadow(d, 64, 110, 46, 11)

    # crop rows in front
    for i, x in enumerate(range(22, 104, 9)):
        d.line((x, 108, x, 98), fill=P["green_dark"], width=2)
        d.line((x - 1, 100, x + 1, 96), fill=P["green_hi"])
        if i % 2 == 0:
            rect(d, (x - 1, 94, x + 1, 96), P["wheat_hi"])

    # silo
    rect(d, (84, 56, 100, 100), P["stone_mid"], P["stone_dark"])
    d.line((84, 56, 84, 100), fill=P["stone_hi"])
    d.line((100, 56, 100, 100), fill=P["stone_deep"])
    for sy in range(60, 100, 8):
        d.line((84, sy, 100, sy), fill=P["stone_dark"])
    d.pieslice((83, 46, 101, 64), 180, 360, fill=P["tile_red"], outline=P["edge"])

    # red barn
    bricks(d, (24, 60, 80, 100), P["tile_red"], P["tile_red_hi"], P["tile_red_dark"], P["wood_deep"], 16, 8)
    gable(d, (52, 34), (18, 62), (86, 62), P["tile_red_hi"], P["tile_red"], P["tile_red_dark"], P["edge"])
    rect(d, (20, 58, 84, 64), P["wood_dark"], P["edge"])

    # white barn doors with cross-frame
    rect(d, (40, 70, 64, 100), P["wood_hi"], P["wood_deep"])
    d.line((52, 70, 52, 100), fill=P["wood_deep"])
    d.line((40, 70, 64, 100), fill=P["wood_dark"])
    d.line((64, 70, 40, 100), fill=P["wood_dark"])
    # hayloft window
    window(d, (47, 50, 57, 58), P["win_warm"], arched=True)

    # weathervane
    d.line((52, 34, 52, 24), fill=P["edge"])
    d.polygon([(52, 24), (60, 27), (52, 30)], fill=P["gold"])
    return im


def cornucopia() -> Image.Image:
    im = img()
    d = ImageDraw.Draw(im, "RGBA")
    soft_glow(d, 64, 60, 30, P["violet"])
    ground_shadow(d, 64, 96, 34, 9)

    # golden horn
    horn = [(30, 84), (40, 54), (66, 40), (88, 52), (74, 70), (50, 86)]
    d.polygon(horn, fill=P["gold_dark"], outline=P["edge"])
    d.polygon([(38, 78), (46, 54), (66, 46), (80, 54), (68, 66), (50, 80)], fill=P["gold"])
    d.line((40, 54, 66, 46), fill=P["gold_hi"], width=2)
    d.arc((26, 40, 78, 92), 190, 20, fill=P["gold_deep"], width=3)
    d.arc((36, 46, 72, 82), 185, 15, fill=P["gold_hi"], width=2)

    # overflow of magical fruit
    for x, y, c in [
        (70, 34, P["green_hi"]),
        (80, 40, P["fire"]),
        (86, 50, P["cyan"]),
        (66, 44, P["violet_hi"]),
        (78, 52, P["gold_hi"]),
        (90, 44, P["tile_red_hi"]),
    ]:
        d.ellipse((x - 4, y - 4, x + 4, y + 4), fill=c, outline=P["edge"])
        d.ellipse((x - 3, y - 3, x - 1, y - 1), fill=lerp(c, (255, 255, 255), 0.6))
    for sx, sy in [(60, 26), (94, 36), (84, 28)]:
        d.line((sx - 3, sy, sx + 3, sy), fill=P["gold_hi"])
        d.line((sx, sy - 3, sx, sy + 3), fill=P["gold_hi"])
    return im


def villager() -> Image.Image:
    im = img()
    d = ImageDraw.Draw(im, "RGBA")
    ground_shadow(d, 64, 96, 18, 6, 70)

    # cloak
    d.polygon([(50, 52), (64, 44), (78, 52), (80, 92), (48, 92)], fill=P["cloak"], outline=P["edge"])
    d.polygon([(54, 50), (64, 46), (68, 60), (60, 88), (52, 86)], fill=P["cloak_hi"])
    # hood + face
    d.polygon([(52, 46), (64, 34), (76, 46), (72, 54), (56, 54)], fill=P["cloak"], outline=P["edge"])
    rect(d, (58, 44, 70, 56), P["skin"], P["skin_dark"])
    rect(d, (60, 48, 62, 50), P["edge"])
    rect(d, (66, 48, 68, 50), P["edge"])
    d.line((61, 53, 67, 53), fill=P["skin_dark"])
    # tunic + arms
    rect(d, (56, 60, 72, 86), P["cloth"], P["edge"])
    rect(d, (58, 62, 70, 74), P["cloth_hi"])
    rect(d, (50, 60, 56, 80), P["cloak"], P["edge"])
    rect(d, (72, 60, 78, 80), P["cloak"], P["edge"])
    # legs
    rect(d, (58, 86, 63, 96), P["wood_deep"], P["edge"])
    rect(d, (65, 86, 70, 96), P["wood_deep"], P["edge"])
    # gold clasp
    d.ellipse((62, 60, 66, 64), fill=P["gold_hi"], outline=P["gold_deep"])
    return im


def aura() -> Image.Image:
    im = img()
    d = ImageDraw.Draw(im, "RGBA")
    for rr, color in [(46, (*P["violet"][:3], 70)), (34, (*P["cyan"][:3], 80)), (22, (210, 176, 255, 80))]:
        d.ellipse((64 - rr, 64 - rr, 64 + rr, 64 + rr), outline=color, width=3)
    d.ellipse((54, 54, 74, 74), fill=(115, 223, 239, 46))
    im = im.filter(ImageFilter.GaussianBlur(1.2))
    return im


def sparkles() -> Image.Image:
    im = img()
    d = ImageDraw.Draw(im, "RGBA")
    for cx, cy, c in [
        (40, 40, P["gold_hi"]),
        (82, 32, P["cyan"]),
        (92, 78, P["violet"]),
        (50, 88, P["gold"]),
        (68, 62, P["cyan_hi"]),
    ]:
        d.line((cx - 5, cy, cx + 5, cy), fill=c)
        d.line((cx, cy - 5, cx, cy + 5), fill=c)
        rect(d, (cx - 1, cy - 1, cx + 1, cy + 1), c)
    return im


def main() -> None:
    assets = {
        "tile_royal_stone_floor": stone_tile("plain"),
        "tile_engraved_runes": stone_tile("runes"),
        "tile_circular_pattern": stone_tile("circle"),
        "building_forum": forum(),
        "building_farm": farm(),
        "building_mine": mine(),
        "building_temple": temple(),
        "building_kitchen": kitchen(),
        "building_forge": forge(),
        "npc_villager": villager(),
        "cornucopia_magical": cornucopia(),
        "fx_soft_glow_aura": aura(),
        "fx_sparkle_particles": sparkles(),
    }

    for name, asset in assets.items():
        save(asset, name)
    print(f"Wrote {len(assets)} assets to {OUT}")


if __name__ == "__main__":
    main()
