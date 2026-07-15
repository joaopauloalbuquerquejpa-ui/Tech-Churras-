"""
Tech Churras — Vídeo de Lançamento 06/07/2026
1080x1920 vertical | Reels / TikTok / YouTube Shorts
Footage real Pexels + narração Edge TTS + FFmpeg color grading
"""
import asyncio
import subprocess
import json
import sys
import io
import time
import requests
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")

# --- Config ---
PEXELS_KEY = open(Path(__file__).parent / "video_pexels.env").read().split("=")[1].strip()
FFMPEG  = str(Path.home() / "scoop/shims/ffmpeg.exe")
FFPROBE = str(Path.home() / "scoop/shims/ffprobe.exe")
OUT   = Path("C:/projetos/tech-churras/tools/video_lancamento")
CLIPS = OUT / "clips"
OUT.mkdir(exist_ok=True)
CLIPS.mkdir(exist_ok=True)

LOGO_PATH = Path("C:/projetos/tech-churras/frontend/public/logo-flame.png")
FONT_BOLD = "C:/Windows/Fonts/arialbd.ttf"
FONT_REG  = "C:/Windows/Fonts/arial.ttf"
VOICE = "pt-BR-FranciscaNeural"
W, H  = 1080, 1920

# Narrativa do lançamento: (texto overlay, narração, query Pexels)
SEGMENTS = [
    (
        "Churrasco é\ncultura brasileira.",
        "Churrasco é cultura brasileira.",
        "brazilian bbq charcoal fire meat grilling smoke outdoor",
    ),
    (
        "Ate hoje era coisa\nde quem conhece\nalguem.",
        "Mas até hoje, churrasco com churrasqueiro profissional era coisa de quem conhece alguém.",
        "picanha espeto churrasco brasil brasa grelha",
    ),
    (
        "A Tech Churras\nchegouu.",
        "A Tech Churras chegou.",
        "smartphone app launch celebration success happy",
    ),
    (
        "Churrasqueiro\nprofissional.\nAcougue parceiro.",
        "Churrasqueiro profissional certificado. Açougue parceiro com os cortes certos.",
        "professional chef grilling fire bbq charcoal smoke action",
    ),
    (
        "Do app pra\nbrasa em\nminutos.",
        "Você escolhe pelo app. O Grill Master chega. A carne vem do açougue parceiro. Você só aproveita.",
        "mobile phone food order delivery fast easy",
    ),
    (
        "Lançamento\nSao Paulo\n06.07.2026",
        "Lançamento em São Paulo. Dia seis de julho de dois mil e vinte e seis.",
        "sao paulo city skyline brasil urban night",
    ),
    (
        "Baixe o app.\nO churrasco\ncomeca hoje.",
        "Baixe o app. O churrasco começa hoje. Tech Churras.",
        "barbecue friends celebration party outdoor cheers fire",
    ),
]


def pexels_video(query: str, idx: int) -> Path | None:
    clip_path = CLIPS / f"clip_{idx:02d}.mp4"
    if clip_path.exists() and clip_path.stat().st_size > 100_000:
        print(f"   [cache] clip_{idx:02d}.mp4")
        return clip_path

    headers = {"Authorization": PEXELS_KEY}
    for orientation in ("portrait", "landscape"):
        try:
            r = requests.get(
                "https://api.pexels.com/videos/search",
                headers=headers,
                params={"query": query, "orientation": orientation, "per_page": 15, "size": "medium"},
                timeout=20,
            )
            if r.status_code != 200:
                print(f"   Pexels HTTP {r.status_code}")
                continue
            videos = r.json().get("videos", [])
            if not videos:
                continue

            video = videos[idx % len(videos)]
            files = sorted(video.get("video_files", []), key=lambda f: f.get("height", 0))
            chosen = next(
                (f for f in files if 720 <= f.get("height", 0) <= 1440), None
            ) or (files[-1] if files else None)

            if not chosen:
                continue

            print(f"   Baixando {orientation} {chosen.get('height','?')}p...")
            r2 = requests.get(chosen["link"], timeout=120, stream=True)
            with open(clip_path, "wb") as f:
                for chunk in r2.iter_content(65536):
                    f.write(chunk)

            size_mb = clip_path.stat().st_size / 1_048_576
            print(f"   OK {size_mb:.1f} MB")
            time.sleep(0.4)
            return clip_path

        except Exception as e:
            print(f"   Erro {orientation}: {e}")

    return None


def get_duration(path: Path) -> float:
    r = subprocess.run(
        [FFPROBE, "-v", "quiet", "-print_format", "json", "-show_streams", str(path)],
        capture_output=True, text=True,
    )
    try:
        for s in json.loads(r.stdout).get("streams", []):
            if "duration" in s:
                return float(s["duration"])
    except Exception:
        pass
    return 4.0


async def gen_tts(text: str, out: Path) -> None:
    import edge_tts
    await edge_tts.Communicate(text, VOICE, rate="+8%").save(str(out))


def create_overlay(display_text: str, idx: int, is_last: bool = False) -> Path:
    img  = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # Barra laranja topo
    draw.rectangle([(0, 0), (W, 8)], fill=(249, 115, 22, 255))

    # Logo imagem no topo (se disponível)
    logo_y = 30
    try:
        logo_img = Image.open(LOGO_PATH).convert("RGBA")
        # Remove fundo branco
        dados = logo_img.getdata()
        novos = [(r, g, b, 0) if r > 230 and g > 230 and b > 230 else (r, g, b, a)
                 for r, g, b, a in dados]
        logo_img.putdata(novos)
        logo_w = 160
        ratio  = logo_w / logo_img.width
        logo_h = int(logo_img.height * ratio)
        logo_img = logo_img.resize((logo_w, logo_h), Image.LANCZOS)
        lx = (W - logo_w) // 2
        img.paste(logo_img, (lx, logo_y), logo_img)
        text_top = logo_y + logo_h + 10
    except Exception:
        text_top = 80

    # Fonte
    try:
        main_f = ImageFont.truetype(FONT_BOLD, 78)
        sub_f  = ImageFont.truetype(FONT_REG,  34)
        cta_f  = ImageFont.truetype(FONT_BOLD, 52)
    except Exception:
        main_f = sub_f = cta_f = ImageFont.load_default()

    lines  = display_text.split("\n")
    line_h = 92
    text_h = len(lines) * line_h
    box_y  = H - text_h - 180

    # Gradiente escuro atrás do texto
    grad = Image.new("RGBA", (W, text_h + 160), (0, 0, 0, 0))
    gd   = ImageDraw.Draw(grad)
    for row in range(text_h + 160):
        alpha = int(200 * (row / (text_h + 160)) ** 0.4)
        gd.line([(0, row), (W, row)], fill=(0, 0, 0, alpha))
    img.alpha_composite(grad, (0, box_y - 40))

    # Linhas de texto
    for i, line in enumerate(lines):
        y = box_y + i * line_h
        # Último segmento: texto menor em laranja para CTA
        font = cta_f if (is_last and i == len(lines) - 1) else main_f
        color = (249, 115, 22, 255) if (is_last and i == len(lines) - 1) else (255, 255, 255, 255)
        draw.text((W // 2 + 2, y + 2), line, font=font, fill=(0, 0, 0, 160), anchor="mt")
        draw.text((W // 2, y),         line, font=font, fill=color,           anchor="mt")

    # Rodapé com URL
    draw.rectangle([(0, H - 12), (W, H)], fill=(249, 115, 22, 220))
    draw.text((W // 2, H - 60), "techchurras.com.br", font=sub_f,
              fill=(255, 255, 255, 220), anchor="mm")

    out_path = OUT / f"overlay_{idx:02d}.png"
    img.save(str(out_path))
    return out_path


def make_segment(clip: Path | None, audio: Path, overlay: Path, out: Path, duration: float) -> None:
    duration_str = str(round(duration + 0.3, 2))

    if clip is None:
        video_inputs = ["-f", "lavfi", "-i", f"color=c=0x0d0d0d:size={W}x{H}:rate=30"]
    else:
        video_inputs = ["-stream_loop", "-1", "-i", str(clip)]

    filter_complex = (
        f"[0:v]"
        f"scale={W}:{H}:force_original_aspect_ratio=increase,"
        f"crop={W}:{H},"
        f"setsar=1,"
        f"eq=contrast=1.25:saturation=1.4:brightness=-0.05,"
        f"vignette=PI/4.5"
        f"[scaled];"
        f"[scaled][2:v]overlay=0:0[v];"
        f"[1:a]volume=1.0[a]"
    )

    cmd = [
        FFMPEG, "-y",
        *video_inputs,
        "-i", str(audio),
        "-i", str(overlay),
        "-filter_complex", filter_complex,
        "-map", "[v]", "-map", "[a]",
        "-t", duration_str,
        "-c:v", "libx264", "-preset", "fast", "-crf", "19",
        "-c:a", "aac", "-b:a", "128k",
        "-pix_fmt", "yuv420p",
        str(out),
    ]
    r = subprocess.run(cmd, capture_output=True, text=True)
    if r.returncode != 0:
        raise RuntimeError(f"FFmpeg falhou [{out.name}]:\n{r.stderr[-800:]}")


def concat_segments(segs: list[Path], out: Path) -> None:
    lst = OUT / "concat.txt"
    with open(lst, "w", encoding="utf-8") as f:
        for s in segs:
            f.write(f"file '{s.as_posix()}'\n")
    subprocess.run(
        [FFMPEG, "-y", "-f", "concat", "-safe", "0", "-i", str(lst), "-c", "copy", str(out)],
        check=True, capture_output=True,
    )


async def main() -> None:
    print("\n*** VIDEO DE LANCAMENTO — TECH CHURRAS 06/07/2026 ***")
    print(f"Footage: Pexels | Voz: {VOICE} | {W}x{H} vertical\n")

    seg_paths: list[Path] = []
    n = len(SEGMENTS)

    for i, (display, narration, query) in enumerate(SEGMENTS):
        label = display.replace("\n", " ")
        print(f"[{i+1}/{n}] {label[:55]}")
        print(f"   Footage: \"{query[:50]}\"")

        clip    = pexels_video(query, i)
        audio   = OUT / f"audio_{i:02d}.mp3"
        await gen_tts(narration, audio)
        dur     = get_duration(audio)
        overlay = create_overlay(display, i, is_last=(i == n - 1))
        seg     = OUT / f"seg_{i:02d}.mp4"

        make_segment(clip, audio, overlay, seg, dur)
        seg_paths.append(seg)
        print(f"   Segmento {i+1} OK ({dur:.1f}s)\n")

    final = OUT / "lancamento_techchurras_0607.mp4"
    print("Concatenando segmentos...")
    concat_segments(seg_paths, final)

    mb    = final.stat().st_size / 1_048_576
    total = sum(get_duration(s) for s in seg_paths)
    print(f"\nVIDEO PRONTO: {final}")
    print(f"Duracao total: {total:.0f}s | Tamanho: {mb:.1f} MB")
    print("Formato: 1080x1920 — Instagram Reels / TikTok / YouTube Shorts\n")


if __name__ == "__main__":
    asyncio.run(main())
