from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageDraw


ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "public" / "assets" / "kingdom-hub"

SCALE = 3

P = {
    "void": (0, 0, 0, 0),
    "floor": (31, 31, 55, 255),
    "floor_2": (39, 37, 68, 255),
    "floor_3": (23, 24, 43, 255),
    "edge": (15, 17, 31, 255),
    "line": (77, 72, 105, 255),
    "purple": (54, 32, 84, 255),
    "purple_dark": (34, 22, 56, 255),
    "gold": (219, 164, 58, 255),
    "gold_hi": (255, 220, 116, 255),
    "gold_dark": (131, 88, 35, 255),
    "cyan": (78, 214, 229, 255),
    "cyan_soft": (102, 232, 239, 150),
    "violet": (155, 100, 232, 255),
    "violet_soft": (169, 112, 244, 130),
    "green": (83, 126, 82, 255),
    "green_hi": (129, 166, 96, 255),
    "green_dark": (45, 75, 57, 255),
    "wood": (91, 55, 39, 255),
    "wood_hi": (134, 86, 50, 255),
    "stone": (72, 76, 91, 255),
    "stone_hi": (111, 112, 126, 255),
    "stone_dark": (36, 40, 53, 255),
    "metal": (74, 78, 87, 255),
    "metal_hi": (150, 153, 153, 255),
    "fire": (238, 91, 39, 255),
    "fire_hi": (255, 183, 72, 255),
    "skin": (164, 117, 83, 255),
    "cloth": (66, 67, 87, 255),
    "cloth_hi": (106, 98, 122, 255),
}


def img(size: int, transparent: bool = True) -> Image.Image:
    return Image.new("RGBA", (size, size), P["void"] if transparent else P["floor"])


def save(im: Image.Image, name: str) -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    im = im.resize((im.width * SCALE, im.height * SCALE), Image.Resampling.NEAREST)
    im.save(OUT / f"{name}.png")


def rect(d: ImageDraw.ImageDraw, xy, fill, outline=None) -> None:
    d.rectangle(xy, fill=fill, outline=outline)


def poly(d: ImageDraw.ImageDraw, points, fill, outline=None) -> None:
    d.polygon(points, fill=fill, outline=outline)


def glow(d: ImageDraw.ImageDraw, cx: int, cy: int, r: int, color) -> None:
    for i, alpha in enumerate((34, 24, 15, 9)):
        rr = r + i * 3
        c = (*color[:3], alpha)
        d.ellipse((cx - rr, cy - rr, cx + rr, cy + rr), fill=c)


def stone_tile(kind: str) -> Image.Image:
    im = img(32, transparent=False)
    d = ImageDraw.Draw(im, "RGBA")
    rect(d, (0, 0, 31, 31), P["floor"])
    stones = [
        (0, 0, 15, 15, P["floor_2"]),
        (16, 0, 31, 15, P["floor"]),
        (0, 16, 15, 31, P["floor"]),
        (16, 16, 31, 31, P["floor_2"]),
    ]
    for xy in stones:
        rect(d, xy[:4], xy[4])
        x0, y0, x1, y1 = xy[:4]
        d.line((x0, y0, x1, y0), fill=P["line"])
        d.line((x0, y0, x0, y1), fill=P["line"])
        d.line((x0, y1, x1, y1), fill=P["edge"])
        d.line((x1, y0, x1, y1), fill=P["edge"])
    rect(d, (2, 3, 3, 4), P["floor_3"])
    rect(d, (24, 5, 25, 6), P["floor_3"])
    rect(d, (8, 23, 10, 24), P["floor_3"])
    rect(d, (21, 25, 22, 26), P["line"])

    if kind == "runes":
        d.line((9, 10, 12, 7, 15, 10), fill=P["cyan"], width=1)
        d.line((12, 7, 12, 14), fill=P["violet"], width=1)
        d.line((19, 18, 23, 18), fill=P["cyan"], width=1)
        d.line((21, 15, 21, 22), fill=P["violet"], width=1)
        rect(d, (5, 20, 6, 21), P["cyan_soft"])
        rect(d, (25, 9, 26, 10), P["violet_soft"])
    elif kind == "circle":
        d.ellipse((6, 6, 25, 25), outline=P["gold_dark"], width=1)
        d.ellipse((9, 9, 22, 22), outline=P["violet"], width=1)
        rect(d, (15, 5, 16, 7), P["gold_hi"])
        rect(d, (15, 24, 16, 26), P["gold_hi"])
        rect(d, (5, 15, 7, 16), P["gold_hi"])
        rect(d, (24, 15, 26, 16), P["gold_hi"])
    im.putalpha(255)
    return im


def base_shadow(d):
    d.ellipse((18, 72, 78, 87), fill=(0, 0, 0, 72))


def roof(d, points, color=P["purple_dark"]):
    poly(d, points, color, P["edge"])
    for x, y in points[1:-1]:
        d.line((48, 20, x, y), fill=P["floor_3"])


def forum() -> Image.Image:
    im = img(96)
    d = ImageDraw.Draw(im, "RGBA")
    base_shadow(d)
    glow(d, 48, 48, 28, P["violet"])
    rect(d, (24, 44, 72, 74), P["stone"], P["edge"])
    rect(d, (30, 34, 66, 51), P["stone_dark"], P["edge"])
    roof(d, [(21, 44), (48, 20), (75, 44), (68, 54), (28, 54)])
    rect(d, (42, 54, 54, 74), P["gold_dark"], P["edge"])
    rect(d, (45, 58, 51, 74), P["gold_hi"])
    rect(d, (31, 53, 36, 64), P["floor_2"], P["gold"])
    rect(d, (60, 53, 65, 64), P["floor_2"], P["gold"])
    rect(d, (35, 29, 61, 36), P["purple"], P["gold_dark"])
    rect(d, (43, 26, 53, 31), P["gold"], P["gold_hi"])
    d.line((48, 18, 48, 10), fill=P["gold_hi"], width=2)
    rect(d, (45, 76, 51, 79), P["stone_hi"])
    return im


def farm() -> Image.Image:
    im = img(96)
    d = ImageDraw.Draw(im, "RGBA")
    base_shadow(d)
    rect(d, (18, 57, 40, 78), P["green_dark"], P["edge"])
    for x in (21, 27, 33):
        d.line((x, 58, x + 3, 76), fill=P["green_hi"], width=2)
    rect(d, (42, 48, 75, 74), P["wood"], P["edge"])
    poly(d, [(38, 50), (58, 31), (79, 50)], P["purple_dark"], P["edge"])
    rect(d, (51, 57, 61, 74), P["gold_dark"], P["edge"])
    rect(d, (66, 56, 71, 63), P["cyan"], P["edge"])
    rect(d, (22, 45, 33, 54), P["green"], P["edge"])
    rect(d, (25, 39, 30, 45), P["green_hi"])
    rect(d, (44, 44, 50, 48), P["gold"])
    return im


def mine() -> Image.Image:
    im = img(96)
    d = ImageDraw.Draw(im, "RGBA")
    base_shadow(d)
    poly(d, [(18, 72), (27, 43), (43, 28), (62, 34), (78, 72)], P["stone_dark"], P["edge"])
    poly(d, [(31, 72), (36, 52), (48, 44), (61, 52), (66, 72)], (12, 13, 24, 255), P["gold_dark"])
    rect(d, (35, 50, 40, 72), P["wood"], P["edge"])
    rect(d, (56, 50, 61, 72), P["wood"], P["edge"])
    rect(d, (36, 48, 60, 53), P["wood_hi"], P["edge"])
    rect(d, (24, 56, 31, 63), P["stone"], P["stone_hi"])
    rect(d, (65, 58, 72, 66), P["stone"], P["stone_hi"])
    rect(d, (45, 61, 51, 66), P["cyan_soft"])
    return im


def temple() -> Image.Image:
    im = img(96)
    d = ImageDraw.Draw(im, "RGBA")
    base_shadow(d)
    glow(d, 48, 48, 32, P["cyan"])
    rect(d, (30, 45, 66, 74), P["stone"], P["edge"])
    poly(d, [(25, 45), (48, 20), (71, 45)], P["purple_dark"], P["edge"])
    rect(d, (44, 26, 52, 70), P["floor_2"], P["gold_dark"])
    d.line((48, 29, 48, 64), fill=P["cyan"], width=2)
    rect(d, (33, 50, 39, 72), P["stone_hi"], P["edge"])
    rect(d, (57, 50, 63, 72), P["stone_hi"], P["edge"])
    d.line((36, 55, 36, 62), fill=P["violet"], width=1)
    d.line((60, 55, 60, 62), fill=P["violet"], width=1)
    rect(d, (45, 76, 51, 79), P["gold"])
    return im


def kitchen() -> Image.Image:
    im = img(96)
    d = ImageDraw.Draw(im, "RGBA")
    base_shadow(d)
    glow(d, 54, 62, 18, P["fire"])
    rect(d, (26, 49, 70, 74), P["wood"], P["edge"])
    poly(d, [(22, 50), (48, 30), (74, 50)], (73, 38, 45, 255), P["edge"])
    rect(d, (61, 35, 68, 48), P["stone_dark"], P["edge"])
    rect(d, (63, 30, 66, 34), (86, 88, 110, 180))
    rect(d, (37, 58, 48, 74), P["gold_dark"], P["edge"])
    rect(d, (54, 58, 63, 66), P["fire"], P["edge"])
    rect(d, (56, 60, 61, 64), P["fire_hi"])
    rect(d, (29, 53, 34, 59), P["cyan"], P["edge"])
    return im


def forge() -> Image.Image:
    im = img(96)
    d = ImageDraw.Draw(im, "RGBA")
    base_shadow(d)
    glow(d, 58, 61, 24, P["fire"])
    rect(d, (24, 49, 72, 74), P["stone_dark"], P["edge"])
    poly(d, [(20, 51), (48, 32), (76, 51)], (31, 28, 42, 255), P["edge"])
    rect(d, (54, 54, 68, 68), P["fire"], P["edge"])
    rect(d, (58, 57, 65, 65), P["fire_hi"])
    rect(d, (32, 61, 47, 66), P["metal_hi"], P["edge"])
    rect(d, (38, 56, 42, 71), P["metal"], P["edge"])
    rect(d, (29, 70, 51, 73), P["stone"], P["edge"])
    rect(d, (65, 35, 71, 49), P["metal"], P["edge"])
    rect(d, (66, 31, 70, 34), P["gold_dark"])
    return im


def villager() -> Image.Image:
    im = img(96)
    d = ImageDraw.Draw(im, "RGBA")
    d.ellipse((34, 72, 62, 82), fill=(0, 0, 0, 65))
    rect(d, (41, 30, 54, 43), P["skin"], P["edge"])
    rect(d, (38, 25, 57, 31), P["cloth"], P["edge"])
    rect(d, (39, 44, 57, 63), P["cloth"], P["edge"])
    rect(d, (42, 45, 54, 55), P["cloth_hi"])
    rect(d, (35, 46, 40, 59), P["skin"], P["edge"])
    rect(d, (58, 46, 63, 59), P["skin"], P["edge"])
    rect(d, (40, 63, 46, 75), P["stone_dark"], P["edge"])
    rect(d, (52, 63, 58, 75), P["stone_dark"], P["edge"])
    rect(d, (44, 36, 47, 38), (27, 20, 28, 255))
    rect(d, (52, 36, 55, 38), (27, 20, 28, 255))
    rect(d, (46, 40, 52, 41), P["gold_dark"])
    return im


def cornucopia() -> Image.Image:
    im = img(96)
    d = ImageDraw.Draw(im, "RGBA")
    glow(d, 48, 49, 30, P["violet"])
    d.ellipse((21, 68, 75, 82), fill=(0, 0, 0, 65))
    poly(d, [(22, 62), (31, 39), (57, 29), (72, 43), (60, 58), (36, 67)], P["gold_dark"], P["edge"])
    poly(d, [(29, 59), (37, 42), (56, 35), (66, 43), (56, 53), (39, 61)], P["gold"], P["gold_hi"])
    d.arc((20, 32, 62, 76), 190, 20, fill=P["edge"], width=3)
    d.arc((28, 37, 58, 67), 185, 15, fill=P["gold_hi"], width=2)
    for x, y, c in [
        (57, 27, P["green_hi"]),
        (65, 31, P["fire_hi"]),
        (69, 39, P["cyan"]),
        (54, 38, P["violet"]),
        (62, 44, P["gold_hi"]),
    ]:
        d.ellipse((x - 4, y - 4, x + 4, y + 4), fill=c, outline=P["edge"])
    rect(d, (45, 25, 47, 27), P["cyan_soft"])
    rect(d, (76, 42, 78, 44), P["violet_soft"])
    rect(d, (58, 18, 60, 20), P["gold_hi"])
    return im


def aura() -> Image.Image:
    im = img(96)
    d = ImageDraw.Draw(im, "RGBA")
    for rr, color in [(35, P["violet_soft"]), (27, P["cyan_soft"]), (18, (210, 176, 255, 70))]:
        d.ellipse((48 - rr, 48 - rr, 48 + rr, 48 + rr), outline=color, width=3)
    d.ellipse((42, 42, 54, 54), fill=(115, 223, 239, 42))
    return im


def sparkles() -> Image.Image:
    im = img(96)
    d = ImageDraw.Draw(im, "RGBA")
    for cx, cy, c in [
        (31, 31, P["gold_hi"]),
        (61, 24, P["cyan"]),
        (68, 58, P["violet"]),
        (38, 66, P["gold"]),
        (52, 47, P["cyan_soft"]),
    ]:
        d.line((cx - 4, cy, cx + 4, cy), fill=c, width=1)
        d.line((cx, cy - 4, cx, cy + 4), fill=c, width=1)
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


if __name__ == "__main__":
    main()
