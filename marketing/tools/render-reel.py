#!/usr/bin/env python3
"""
Render a premium vertical Instagram Reel (1080x1920) for Israel Air Ambulance.

Ken Burns motion on AI aviation stills + PIL bilingual overlays.
Hebrew uses Pillow direction='rtl' + language='he' (libraqm) — do NOT apply
python-bidi get_display (that double-flips text into gibberish when raqm is on).
Mixed HE/EN/digits use DejaVu (full glyph coverage). No stock music.

Usage:
  python3 marketing/tools/render-reel.py \\
    --out marketing/assets/reels/reel-001.mp4 \\
    --images img1.jpg,img2.jpg,img3.jpg \\
    --title-en "Air ambulance New York - Israel" \\
    --title-he "אמבולנס אווירי ניו יורק - ישראל"
"""
from __future__ import annotations

import argparse
import subprocess
import tempfile
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont, features

W, H = 1080, 1920
FPS = 30
SEG = 4.2  # seconds per image beat

FONT_EN = "/usr/share/fonts/truetype/noto/NotoSans-Bold.ttf"
FONT_EN_REG = "/usr/share/fonts/truetype/noto/NotoSans-Regular.ttf"
# DejaVu covers Hebrew + Latin digits + arrows (NotoSansHebrew lacks digits/↔ → tofu)
FONT_HE = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
FONT_HE_FALLBACK = "/usr/share/fonts/truetype/noto/NotoSansHebrew-Bold.ttf"

HAS_RAQM = bool(features.check("raqm"))


def run(cmd: list[str]) -> None:
    subprocess.check_call(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)


def font(path: str, size: int) -> ImageFont.FreeTypeFont:
    try:
        return ImageFont.truetype(path, size)
    except OSError:
        return ImageFont.truetype(FONT_HE_FALLBACK if "Heb" in path or "dejavu" in path.lower() else FONT_EN, size)


def sanitize_text(s: str) -> str:
    """Normalize symbols that break some fonts; keep Hebrew intact."""
    return (
        str(s or "")
        .replace("↔", "—")
        .replace("→", "—")
        .replace("←", "—")
        .replace("‧", "·")
        .strip()
    )


def wrap_lines(draw: ImageDraw.ImageDraw, text: str, fnt: ImageFont.FreeTypeFont, max_width: int) -> list[str]:
    words = text.split()
    if not words:
        return [text]
    lines: list[str] = []
    cur = ""
    for w in words:
        trial = f"{cur} {w}".strip()
        bbox = draw.textbbox((0, 0), trial, font=fnt)
        if bbox[2] - bbox[0] <= max_width:
            cur = trial
        else:
            if cur:
                lines.append(cur)
            cur = w
    if cur:
        lines.append(cur)
    return lines[:3] or [text]


def draw_centered(
    draw: ImageDraw.ImageDraw,
    text: str,
    fnt: ImageFont.FreeTypeFont,
    y: int,
    fill,
    *,
    rtl: bool = False,
    max_width: int = 960,
) -> int:
    text = sanitize_text(text)
    lines = wrap_lines(draw, text, fnt, max_width)
    for line in lines:
        # Measure with same direction so centering matches rendered width
        kwargs = {"font": fnt}
        if rtl and HAS_RAQM:
            kwargs["direction"] = "rtl"
            kwargs["language"] = "he"
        bbox = draw.textbbox((0, 0), line, **kwargs)
        tw = bbox[2] - bbox[0]
        th = bbox[3] - bbox[1]
        x = (W - tw) // 2
        # soft shadow
        shadow = {**kwargs, "fill": (0, 0, 0, 160)}
        draw.text((x + 2, y + 2), line, **shadow)
        draw.text((x, y), line, fill=fill, **kwargs)
        y += th + 14
    return y


def make_overlay(
    title_en: str,
    title_he: str,
    line_en: str,
    line_he: str,
    cta_en: str,
    cta_he: str,
    mode: str,
) -> Image.Image:
    img = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    for i in range(420):
        a = int(120 * (1 - i / 420))
        draw.line([(0, i), (W, i)], fill=(0, 12, 28, a))
    for i in range(420):
        a = int(150 * (i / 420))
        y = H - 420 + i
        draw.line([(0, y), (W, y)], fill=(0, 8, 20, a))

    draw_centered(draw, "ISRAEL AIR AMBULANCE", font(FONT_EN, 32), 64, (255, 255, 255, 235))
    draw_centered(
        draw, "24/7 · ambulancenter.com", font(FONT_EN_REG, 26), 1820, (220, 230, 245, 200)
    )

    he_font_title = font(FONT_HE, 42)
    he_font_line = font(FONT_HE, 36)
    he_font_cta = font(FONT_HE, 38)

    if mode == "titles":
        draw_centered(draw, title_en[:72], font(FONT_EN, 48), 150, (255, 255, 255, 255))
        draw_centered(draw, title_he[:72], he_font_title, 280, (255, 255, 255, 245), rtl=True)
    elif mode == "lines":
        draw_centered(draw, line_en[:80], font(FONT_EN, 40), 1560, (220, 235, 255, 255))
        draw_centered(draw, line_he[:80], he_font_line, 1650, (220, 235, 255, 245), rtl=True)
    elif mode == "cta":
        draw_centered(draw, cta_en[:64], font(FONT_EN, 42), 1560, (255, 255, 255, 255))
        draw_centered(draw, cta_he[:64], he_font_cta, 1655, (255, 255, 255, 245), rtl=True)
    return img


def ken_burns_clip(image: Path, out: Path, idx: int) -> None:
    if idx % 2 == 0:
        z = (
            "zoompan=z='min(zoom+0.0015,1.18)':x='iw/2-(iw/zoom/2)':"
            "y='ih/2-(ih/zoom/2)':d=126:s=1080x1920:fps=30"
        )
    else:
        z = (
            "zoompan=z='if(eq(on,1),1.18,max(zoom-0.0015,1.0))':"
            "x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=126:s=1080x1920:fps=30"
        )
    vf = (
        f"scale=1200:2133:force_original_aspect_ratio=increase,"
        f"crop=1200:2133,"
        f"{z},"
        f"eq=contrast=1.06:brightness=-0.02:saturation=0.92,"
        f"colorbalance=rs=-0.04:bs=0.06,"
        f"vignette=PI/5"
    )
    run(
        [
            "ffmpeg", "-y", "-loop", "1", "-i", str(image),
            "-vf", vf, "-t", str(SEG),
            "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "17", "-preset", "slow",
            str(out),
        ]
    )


def concat_clips(clips: list[Path], out: Path) -> None:
    lst = out.with_suffix(".txt")
    lst.write_text("".join(f"file '{c}'\n" for c in clips))
    run(["ffmpeg", "-y", "-f", "concat", "-safe", "0", "-i", str(lst), "-c", "copy", str(out)])


def overlay_phases(video: Path, out: Path, overlays: dict[str, Path]) -> None:
    filt = (
        f"[0:v][1:v]overlay=0:0:enable='between(t,0.35,8.2)'[v1];"
        f"[v1][2:v]overlay=0:0:enable='between(t,4.3,11.0)'[v2];"
        f"[v2][3:v]overlay=0:0:enable='gte(t,10.8)'[vout]"
    )
    run(
        [
            "ffmpeg", "-y",
            "-i", str(video),
            "-i", str(overlays["titles"]),
            "-i", str(overlays["lines"]),
            "-i", str(overlays["cta"]),
            "-filter_complex", filt,
            "-map", "[vout]",
            "-c:v", "libx264", "-pix_fmt", "yuv420p",
            "-crf", "16", "-preset", "slow",
            "-movflags", "+faststart", "-an",
            str(out),
        ]
    )


def main() -> None:
    if not HAS_RAQM:
        print("WARN: libraqm not available — Hebrew RTL may be incorrect")

    ap = argparse.ArgumentParser()
    ap.add_argument("--out", required=True)
    ap.add_argument("--images", required=True, help="comma-separated image paths")
    ap.add_argument("--title-en", required=True)
    ap.add_argument("--title-he", required=True)
    ap.add_argument("--line-en", default="Private ICU medical flights")
    ap.add_argument("--line-he", default="טיסות רפואיות פרטיות ברמת ICU")
    ap.add_argument("--cta-en", default="WhatsApp 053-232-1101")
    ap.add_argument("--cta-he", default="וואטסאפ 053-232-1101")
    args = ap.parse_args()

    images = [Path(p.strip()) for p in args.images.split(",") if p.strip()]
    if len(images) < 2:
        raise SystemExit("Need at least 2 images")
    for im in images:
        if not im.exists():
            raise SystemExit(f"Missing image: {im}")

    out = Path(args.out)
    out.parent.mkdir(parents=True, exist_ok=True)

    with tempfile.TemporaryDirectory() as td:
        td_path = Path(td)
        clips = []
        for i, im in enumerate(images[:3]):
            clip = td_path / f"clip{i}.mp4"
            ken_burns_clip(im, clip, i)
            clips.append(clip)
        base = td_path / "base.mp4"
        concat_clips(clips, base)

        overlays = {}
        for mode in ("titles", "lines", "cta"):
            png = td_path / f"ov-{mode}.png"
            make_overlay(
                args.title_en,
                args.title_he,
                args.line_en,
                args.line_he,
                args.cta_en,
                args.cta_he,
                mode,
            ).save(png)
            overlays[mode] = png

        overlay_phases(base, out, overlays)

    probe = subprocess.check_output(
        [
            "ffprobe", "-v", "error", "-select_streams", "v:0",
            "-show_entries", "stream=width,height,duration",
            "-of", "csv=p=0", str(out),
        ],
        text=True,
    ).strip()
    print(f"OK {out} ({out.stat().st_size} bytes) {probe} raqm={HAS_RAQM}")


if __name__ == "__main__":
    main()
