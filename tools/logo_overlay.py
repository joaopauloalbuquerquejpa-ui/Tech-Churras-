"""
Utilitário: aplica o logo da Tech Churras no canto inferior direito das imagens.
"""

from PIL import Image, ImageDraw
import os

LOGO_PATH = r"C:\projetos\tech-churras\frontend\public\logo-flame.png"

def aplicar_logo(img_path: str, output_path: str = None, tamanho_pct: float = 0.18):
    """
    Aplica o logo Tech Churras no canto inferior direito da imagem.
    Salva no mesmo arquivo se output_path não for informado.
    """
    base = Image.open(img_path).convert("RGBA")
    logo_raw = Image.open(LOGO_PATH).convert("RGBA")

    # Remove fundo branco do logo (substitui por transparência)
    dados = logo_raw.getdata()
    novos = []
    for r, g, b, a in dados:
        if r > 230 and g > 230 and b > 230:
            novos.append((r, g, b, 0))
        else:
            novos.append((r, g, b, a))
    logo_raw.putdata(novos)

    # Redimensiona logo proporcional à imagem base
    logo_w = int(base.width * tamanho_pct)
    ratio = logo_w / logo_raw.width
    logo_h = int(logo_raw.height * ratio)
    logo = logo_raw.resize((logo_w, logo_h), Image.LANCZOS)

    # Padding do canto
    pad = int(base.width * 0.03)
    x = base.width - logo_w - pad
    y = base.height - logo_h - pad

    # Fundo semi-transparente arredondado atrás do logo
    overlay = Image.new("RGBA", base.size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay)
    margin = int(pad * 0.5)
    draw.rounded_rectangle(
        [x - margin, y - margin, x + logo_w + margin, y + logo_h + margin],
        radius=12,
        fill=(0, 0, 0, 150),
    )
    base = Image.alpha_composite(base, overlay)

    # Cola o logo
    base.paste(logo, (x, y), logo)

    # Salva como JPEG
    final = base.convert("RGB")
    out = output_path or img_path
    final.save(out, "JPEG", quality=92)
    return out
