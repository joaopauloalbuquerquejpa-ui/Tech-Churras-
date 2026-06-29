"""
Gerador de video profissional Tech Churras
Footage real Pexels API + Edge TTS + FFmpeg com color grading
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
OUT   = Path("C:/projetos/tech-churras/tools/video_pro")
CLIPS = OUT / "clips"
OUT.mkdir(exist_ok=True)
CLIPS.mkdir(exist_ok=True)

FONT_BOLD = "C:/Windows/Fonts/arialbd.ttf"
FONT_REG  = "C:/Windows/Fonts/arial.ttf"
VOICE = "pt-BR-FranciscaNeural"
W, H  = 1080, 1920

# Segmentos: (texto overlay, narração, query Pexels)
SEGMENTS = [
    (
        "Voce tem uma data\nespecial chegando...",
        "Você tem uma data especial chegando e quer fazer um churrasco inesquecível.",
        "friends outdoor celebration party laughing",
    ),
    (
        "Contratar churrasqueiro,\nescolher o acougue...\nda trabalho.",
        "Mas contratar churrasqueiro profissional, escolher o açougue certo, calcular as quantidades... dá trabalho.",
        "person stressed phone planning frustrated",
    ),
    (
        "A Tech Churras resolve\ntudo em minutos.",
        "A Tech Churras resolve tudo isso em minutos.",
        "smartphone app happy success mobile",
    ),
    (
        "Grillmaster certificado.\nIA monta o kit perfeito.",
        "Escolha seu Grillmaster certificado. A inteligência artificial monta o kit completo com os cortes certos para o seu evento.",
        "bbq chef grilling fire barbecue smoke",
    ),
    (
        "Acougue parceiro\nJa selecionado.",
        "Açougue parceiro já selecionado. Tudo planejado. Só chegar e aproveitar.",
        "steak meat raw fresh quality butcher",
    ),
    (
        "Acompanhe ao vivo\nno mapa.",
        "Acompanhe o churrasqueiro ao vivo no mapa. Avalie depois.",
        "grill smoke meat fire outdoor cooking",
    ),
    (
        "Tech Churras.\nO seu churrasco,\ndo comeco ao fim.",
        "Tech Churras. O seu churrasco, do começo ao fim.",
        "barbecue party friends celebration fire food",
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

            # Rotaciona entre os resultados usando idx para variedade
            video = videos[idx % len(videos)]
            files = sorted(video.get("video_files", []), key=lambda f: f.get("height", 0))

            # Preferência: entre 720p e 1440p (evita 4K pesado)
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
            time.sleep(0.4)  # respeitar rate-limit
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
    await edge_tts.Communicate(text, VOICE, rate="+5%").save(str(out))


def create_overlay(display_text: str, idx: int) -> Path:
    img  = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # Barra laranja topo
    draw.rectangle([(0, 0), (W, 10)], fill=(249, 115, 22, 255))

    # Logo topo
    try:
        logo_f = ImageFont.truetype(FONT_BOLD, 46)
    except Exception:
        logo_f = ImageFont.load_default()
    # Sombra
    draw.text((W // 2 + 2, 72), "TECH CHURRAS", font=logo_f, fill=(0, 0, 0, 200), anchor="mm")
    draw.text((W // 2, 70), "TECH CHURRAS", font=logo_f, fill=(249, 115, 22, 240), anchor="mm")

    # Texto principal
    lines = display_text.split("\n")
    try:
        main_f = ImageFont.truetype(FONT_BOLD, 66)
    except Exception:
        main_f = ImageFont.load_default()

    line_h = 80
    text_h = len(lines) * line_h
    box_y  = H - text_h - 150
    box_h  = text_h + 50

    # Gradiente escuro atrás do texto (composição RGBA)
    grad = Image.new("RGBA", (W, box_h + 60), (0, 0, 0, 0))
    grad_draw = ImageDraw.Draw(grad)
    for row in range(box_h + 60):
        alpha = int(180 * (row / (box_h + 60)) ** 0.5)
        grad_draw.line([(0, row), (W, row)], fill=(0, 0, 0, alpha))
    img.alpha_composite(grad, (0, box_y - 30))

    # Linhas de texto
    for i, line in enumerate(lines):
        y = box_y + i * line_h
        draw.text((W // 2 + 2, y + 2), line, font=main_f, fill=(0, 0, 0, 180), anchor="mt")
        draw.text((W // 2, y), line, font=main_f, fill=(255, 255, 255, 255), anchor="mt")

    # Rodapé
    draw.rectangle([(0, H - 10), (W, H)], fill=(249, 115, 22, 180))
    try:
        tag_f = ImageFont.truetype(FONT_REG, 30)
    except Exception:
        tag_f = ImageFont.load_default()
    draw.text((W // 2, H - 58), "techchurras.com.br", font=tag_f, fill=(220, 220, 220, 200), anchor="mm")

    out_path = OUT / f"overlay_{idx:02d}.png"
    img.save(str(out_path))
    return out_path


def make_segment(clip: Path | None, audio: Path, overlay: Path, out: Path, duration: float) -> None:
    duration_str = str(round(duration + 0.4, 2))

    if clip is None:
        # Fallback: cor sólida
        video_inputs = ["-f", "lavfi", "-i", f"color=c=0x111111:size={W}x{H}:rate=30"]
        video_map_in = "[0:v]"
        extra_idx = 1
    else:
        video_inputs = ["-stream_loop", "-1", "-i", str(clip)]
        video_map_in = "[0:v]"
        extra_idx = 1

    audio_idx  = extra_idx
    overlay_idx = extra_idx + 1

    filter_complex = (
        f"{video_map_in}"
        f"scale={W}:{H}:force_original_aspect_ratio=increase,"
        f"crop={W}:{H},"
        f"setsar=1,"
        f"eq=contrast=1.2:saturation=1.35:brightness=-0.04,"
        f"vignette=PI/5"
        f"[scaled];"
        f"[scaled][{overlay_idx}:v]overlay=0:0[v];"
        f"[{audio_idx}:a]volume=1.0[a]"
    )

    cmd = [
        FFMPEG, "-y",
        *video_inputs,
        "-i", str(audio),
        "-i", str(overlay),
        "-filter_complex", filter_complex,
        "-map", "[v]", "-map", "[a]",
        "-t", duration_str,
        "-c:v", "libx264", "-preset", "fast", "-crf", "20",
        "-c:a", "aac", "-b:a", "128k",
        "-pix_fmt", "yuv420p",
        str(out),
    ]
    r = subprocess.run(cmd, capture_output=True, text=True)
    if r.returncode != 0:
        raise RuntimeError(f"FFmpeg falhou [{out.name}]:\n{r.stderr[-600:]}")


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
    print("\n*** VIDEO PROFISSIONAL TECH CHURRAS ***")
    print(f"Footage: Pexels | Voz: {VOICE} | {W}x{H} vertical\n")

    seg_paths: list[Path] = []

    for i, (display, narration, query) in enumerate(SEGMENTS):
        label = display.replace("\n", " ")
        print(f"[{i+1}/{len(SEGMENTS)}] {label[:50]}")
        print(f"   Footage: \"{query}\"")

        clip    = pexels_video(query, i)
        audio   = OUT / f"audio_{i:02d}.mp3"
        await gen_tts(narration, audio)
        dur     = get_duration(audio)
        overlay = create_overlay(display, i)
        seg     = OUT / f"seg_{i:02d}.mp4"

        make_segment(clip, audio, overlay, seg, dur)
        seg_paths.append(seg)
        print(f"   Segmento {i+1} OK ({dur:.1f}s)\n")

    final = OUT / "tech_churras_pro.mp4"
    print("Concatenando todos os segmentos...")
    concat_segments(seg_paths, final)

    mb = final.stat().st_size / 1_048_576
    print(f"\nVIDEO PRONTO: {final}")
    print(f"Tamanho: {mb:.1f} MB")
    print("Formato: 1080x1920 - Instagram Reels / TikTok / YouTube Shorts\n")


if __name__ == "__main__":
    asyncio.run(main())
