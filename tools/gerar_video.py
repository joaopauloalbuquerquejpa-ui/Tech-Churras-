"""
Gerador de vídeo Tech Churras
Edge TTS (PT-BR) + PIL para frames + FFmpeg para renderização final
"""
import asyncio
import subprocess
import json
import sys
import io
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

# Força UTF-8 no Windows (cp1252 não suporta emojis)
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")

# ── Configurações ────────────────────────────────────────────────────────────
FFMPEG  = str(Path.home() / "scoop/shims/ffmpeg.exe")
FFPROBE = str(Path.home() / "scoop/shims/ffprobe.exe")
OUTPUT_DIR = Path("C:/projetos/tech-churras/tools/video_output")
OUTPUT_DIR.mkdir(exist_ok=True)

W, H = 1080, 1920          # vertical (Reels/Shorts)
FPS  = 30
BG_COLOR     = (15, 15, 15)
ORANGE       = (249, 115, 22)
WHITE        = (255, 255, 255)
GRAY         = (160, 160, 160)

VOICE = "pt-BR-FranciscaNeural"   # voz feminina natural PT-BR (Edge TTS)

# Fonte padrão Windows
FONT_PATH = "C:/Windows/Fonts/arialbd.ttf"
FONT_REGULAR = "C:/Windows/Fonts/arial.ttf"

# ── Segmentos: (texto no frame, texto para narração) ────────────────────────
SEGMENTS = [
    (
        "Você tem uma\ndata especial chegando.",
        "Você tem uma data especial chegando e quer fazer um churrasco inesquecível."
    ),
    (
        "Contratar churrasqueiro,\nescolher açougue,\ncalcular quantidades...\ndá trabalho.",
        "Mas contratar churrasqueiro profissional, escolher o açougue certo, calcular as quantidades... dá trabalho."
    ),
    (
        "A Tech Churras resolve\ntudo isso em minutos.",
        "A Tech Churras resolve tudo isso em minutos."
    ),
    (
        "IA monta o kit perfeito\ncom os cortes certos\npara o seu evento.",
        "Escolha seu Grillmaster certificado. A inteligência artificial monta o kit completo com os cortes certos para o seu evento."
    ),
    (
        "Açougue parceiro selecionado.\nTudo planejado.\nSó chegar e aproveitar.",
        "Açougue parceiro já selecionado. Tudo planejado. Só chegar e aproveitar."
    ),
    (
        "Acompanhe ao vivo no mapa.\nAvalie depois.",
        "Acompanhe o churrasqueiro ao vivo no mapa. Avalie depois."
    ),
    (
        "Tech Churras.",
        "Tech Churras. O seu churrasco, do começo ao fim."
    ),
]

# ── Funções ──────────────────────────────────────────────────────────────────

def wrap_text(text: str, font: ImageFont.FreeTypeFont, max_width: int) -> list[str]:
    """Quebra texto em linhas respeitando max_width."""
    lines = []
    for paragraph in text.split("\n"):
        words = paragraph.split()
        current = ""
        for word in words:
            test = (current + " " + word).strip()
            w = font.getlength(test)
            if w <= max_width:
                current = test
            else:
                if current:
                    lines.append(current)
                current = word
        if current:
            lines.append(current)
    return lines


def create_frame(display_text: str, index: int, total: int) -> Path:
    """Cria um frame PNG para o segmento."""
    img  = Image.new("RGB", (W, H), BG_COLOR)
    draw = ImageDraw.Draw(img)

    # Barra laranja no topo
    draw.rectangle([(0, 0), (W, 8)], fill=ORANGE)

    # Logo / nome no topo
    try:
        logo_font = ImageFont.truetype(FONT_PATH, 52)
    except Exception:
        logo_font = ImageFont.load_default()
    draw.text((W // 2, 120), "** Tech Churras **", font=logo_font,
              fill=ORANGE, anchor="mm")

    # Texto principal
    try:
        main_font = ImageFont.truetype(FONT_PATH, 72)
    except Exception:
        main_font = ImageFont.load_default()

    max_w = W - 120
    lines = wrap_text(display_text, main_font, max_w)
    line_h = 90
    total_text_h = len(lines) * line_h
    y_start = (H - total_text_h) // 2

    for i, line in enumerate(lines):
        y = y_start + i * line_h
        # sombra
        draw.text((W // 2 + 2, y + 2), line, font=main_font, fill=(0, 0, 0), anchor="mm")
        draw.text((W // 2, y), line, font=main_font, fill=WHITE, anchor="mm")

    # Barra de progresso no rodapé
    draw.rectangle([(0, H - 8), (W, H)], fill=(40, 40, 40))
    prog_w = int((index + 1) / total * W)
    draw.rectangle([(0, H - 8), (prog_w, H)], fill=ORANGE)

    # Tagline rodapé
    try:
        tag_font = ImageFont.truetype(FONT_REGULAR, 36)
    except Exception:
        tag_font = ImageFont.load_default()
    draw.text((W // 2, H - 60), "techchurras.com.br", font=tag_font,
              fill=GRAY, anchor="mm")

    out = OUTPUT_DIR / f"frame_{index:02d}.png"
    img.save(str(out))
    return out


async def generate_tts(text: str, out_path: Path) -> None:
    import edge_tts
    comm = edge_tts.Communicate(text, VOICE, rate="+8%", volume="+0%")
    await comm.save(str(out_path))


def get_duration(audio_path: Path) -> float:
    result = subprocess.run(
        [FFPROBE, "-v", "quiet", "-print_format", "json",
         "-show_streams", str(audio_path)],
        capture_output=True, text=True, check=True
    )
    data = json.loads(result.stdout)
    for stream in data.get("streams", []):
        if "duration" in stream:
            return float(stream["duration"])
    return 3.0


def make_segment_video(frame: Path, audio: Path, out: Path, duration: float) -> None:
    cmd = [
        FFMPEG, "-y",
        "-loop", "1", "-i", str(frame),
        "-i", str(audio),
        "-c:v", "libx264", "-tune", "stillimage",
        "-c:a", "aac", "-b:a", "128k",
        "-pix_fmt", "yuv420p",
        "-t", str(duration + 0.4),
        "-vf", "scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2",
        "-shortest",
        str(out),
    ]
    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode != 0:
        raise RuntimeError(f"FFmpeg falhou no segmento: {result.stderr[-500:]}")


def concat_segments(segments: list[Path], out: Path) -> None:
    concat_list = OUTPUT_DIR / "concat.txt"
    with open(concat_list, "w", encoding="utf-8") as f:
        for seg in segments:
            f.write(f"file '{seg.as_posix()}'\n")

    cmd = [
        FFMPEG, "-y",
        "-f", "concat", "-safe", "0",
        "-i", str(concat_list),
        "-c", "copy",
        str(out),
    ]
    subprocess.run(cmd, check=True, capture_output=True)


async def main() -> None:
    print("\n*** Gerando video Tech Churras ***")
    print(f"   Voz: {VOICE}")
    print(f"   Formato: {W}x{H} (vertical)\n")

    seg_videos: list[Path] = []

    for i, (display, narration) in enumerate(SEGMENTS):
        label = display.replace("\n", " ")[:45]
        print(f"  [{i+1}/{len(SEGMENTS)}] {label}...")

        frame_path = create_frame(display, i, len(SEGMENTS))

        audio_path = OUTPUT_DIR / f"audio_{i:02d}.mp3"
        await generate_tts(narration, audio_path)

        duration = get_duration(audio_path)
        seg_path = OUTPUT_DIR / f"seg_{i:02d}.mp4"
        make_segment_video(frame_path, audio_path, seg_path, duration)

        seg_videos.append(seg_path)
        print(f"       OK {duration:.1f}s")

    final = OUTPUT_DIR / "tech_churras_reel.mp4"
    print("\n  Concatenando segmentos...")
    concat_segments(seg_videos, final)

    size_mb = final.stat().st_size / 1_048_576
    print(f"\nVIDEO PRONTO!")
    print(f"   Arquivo: {final}")
    print(f"   Tamanho: {size_mb:.1f} MB")
    print(f"   Formato: Instagram Reels / TikTok / YouTube Shorts\n")


if __name__ == "__main__":
    asyncio.run(main())
