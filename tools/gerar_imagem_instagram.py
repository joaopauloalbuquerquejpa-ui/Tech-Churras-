"""
Tech Churras — Gerador de Imagens para Instagram
Usa Pollinations.ai (FLUX) — gratuito, sem chave de API.

Uso:
    python gerar_imagem_instagram.py

Ou direto via argumento:
    python gerar_imagem_instagram.py --tipo picanha --formato feed --qtd 3
"""

import urllib.request
import urllib.parse
import os
import sys
import argparse
import time
from datetime import datetime

# ──────────────────────────────────────────────
# CONFIGURAÇÃO
# ──────────────────────────────────────────────

OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "imagens_instagram")

FORMATOS = {
    "feed":    {"width": 1080, "height": 1080, "label": "Feed 1:1"},
    "retrato": {"width": 1080, "height": 1350, "label": "Feed 4:5 (retrato)"},
    "stories": {"width": 1080, "height": 1920, "label": "Stories/Reels 9:16"},
}

# Sufixo de estilo aplicado em todos os prompts
ESTILO_BASE = (
    "professional food photography, dramatic lighting, dark background, "
    "bokeh, 8k, ultra detailed, vibrant colors, cinematic"
)

TIPOS = {
    "1": {
        "nome": "Picanha na brasa",
        "prompt": (
            "close-up of juicy picanha beef steak grilling on charcoal, "
            "flames underneath, smoke wisps, golden crust, coarse salt crystals, "
            f"Brazilian churrasco, {ESTILO_BASE}"
        ),
    },
    "2": {
        "nome": "Costela assando",
        "prompt": (
            "Brazilian beef ribs (costela) slow roasting over charcoal pit, "
            "dark caramelized crust, smoke rising, rustic setting, "
            f"churrasco culture, {ESTILO_BASE}"
        ),
    },
    "3": {
        "nome": "Churrasco completo (mesa farta)",
        "prompt": (
            "abundant Brazilian churrasco spread on wooden table, assorted grilled meats, "
            "picanha, linguiça, chicken hearts, side dishes, family feast, "
            f"warm light, {ESTILO_BASE}"
        ),
    },
    "4": {
        "nome": "Grill Master em ação",
        "prompt": (
            "professional Brazilian pitmaster grilling meat on large charcoal grill, "
            "wearing apron, confident posture, flames and smoke, night setting, "
            f"lifestyle photography, {ESTILO_BASE}"
        ),
    },
    "5": {
        "nome": "Kit de cortes (açougue)",
        "prompt": (
            "premium beef cuts selection on dark slate board, picanha, fraldinha, "
            "maminha, ribeye, fresh raw meat, butcher shop style, "
            f"top down flat lay, {ESTILO_BASE}"
        ),
    },
    "6": {
        "nome": "Linguiça artesanal",
        "prompt": (
            "artisan Brazilian sausages grilling on charcoal, sizzling, "
            "crackling skin, herbs, garlic, close-up macro, "
            f"{ESTILO_BASE}"
        ),
    },
    "7": {
        "nome": "Fraldinha com chimichurri",
        "prompt": (
            "sliced flank steak (fraldinha) with chimichurri sauce, "
            "medium rare, juicy, herb garnish, rustic wooden board, "
            f"Brazilian steakhouse style, {ESTILO_BASE}"
        ),
    },
    "8": {
        "nome": "Churrasco em família",
        "prompt": (
            "joyful Brazilian family gathering around charcoal grill in backyard, "
            "weekend churrasco, people laughing, food being served, "
            f"warm lifestyle photography, golden hour, {ESTILO_BASE}"
        ),
    },
    "9": {
        "nome": "Prompt personalizado",
        "prompt": None,
    },
}


# ──────────────────────────────────────────────
# FUNÇÕES
# ──────────────────────────────────────────────

def gerar_imagem(prompt: str, width: int, height: int, seed: int = None) -> bytes:
    params = {
        "model": "flux",
        "width": width,
        "height": height,
        "nologo": "true",
        "enhance": "false",
    }
    if seed is not None:
        params["seed"] = seed

    prompt_encoded = urllib.parse.quote(prompt)
    query = "&".join(f"{k}={v}" for k, v in params.items())
    url = f"https://image.pollinations.ai/prompt/{prompt_encoded}?{query}"

    req = urllib.request.Request(url, headers={"User-Agent": "TechChurras/1.0"})
    with urllib.request.urlopen(req, timeout=90) as resp:
        return resp.read()


def salvar(data: bytes, nome_tipo: str, formato: str, indice: int) -> str:
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    ts = datetime.now().strftime("%Y%m%d_%H%M%S")
    slug = nome_tipo.lower().replace(" ", "_").replace("(", "").replace(")", "")
    filename = f"{ts}_{slug}_{formato}_{indice}.jpg"
    path = os.path.join(OUTPUT_DIR, filename)
    with open(path, "wb") as f:
        f.write(data)
    return path


def menu_interativo():
    print("\n╔══════════════════════════════════════════╗")
    print("║   Tech Churras — Gerador de Imagens IG   ║")
    print("╚══════════════════════════════════════════╝\n")

    print("Tipo de conteúdo:")
    for k, v in TIPOS.items():
        print(f"  {k}. {v['nome']}")

    tipo_key = input("\nEscolha o tipo [1-9]: ").strip()
    if tipo_key not in TIPOS:
        print("Opção inválida.")
        sys.exit(1)

    tipo = TIPOS[tipo_key]

    if tipo["prompt"] is None:
        prompt_custom = input("Digite seu prompt em inglês: ").strip()
        if not prompt_custom:
            print("Prompt vazio.")
            sys.exit(1)
        prompt = f"{prompt_custom}, {ESTILO_BASE}"
        nome = "personalizado"
    else:
        prompt = tipo["prompt"]
        nome = tipo["nome"]

    print("\nFormato:")
    for k, v in FORMATOS.items():
        print(f"  {k} — {v['label']}")

    formato_key = input("\nEscolha o formato [feed/retrato/stories]: ").strip().lower()
    if formato_key not in FORMATOS:
        formato_key = "feed"

    qtd = input("Quantas variações? [1-5, padrão 1]: ").strip()
    qtd = int(qtd) if qtd.isdigit() and 1 <= int(qtd) <= 5 else 1

    return prompt, nome, formato_key, qtd


def run(prompt: str, nome: str, formato_key: str, qtd: int):
    fmt = FORMATOS[formato_key]
    print(f"\nGerando {qtd}x [{fmt['label']}] — {nome}")
    print(f"Prompt: {prompt[:80]}...")
    print()

    caminhos = []
    for i in range(1, qtd + 1):
        seed = int(time.time()) + i
        print(f"  [{i}/{qtd}] Aguardando Pollinations.ai...", end=" ", flush=True)
        try:
            data = gerar_imagem(prompt, fmt["width"], fmt["height"], seed=seed)
            path = salvar(data, nome, formato_key, i)
            caminhos.append(path)
            print(f"OK — {os.path.basename(path)} ({len(data) // 1024}KB)")
        except Exception as e:
            print(f"ERRO: {e}")
        if i < qtd:
            time.sleep(2)

    print(f"\nOK: {len(caminhos)} imagem(ns) salva(s) em:")
    print(f"  {OUTPUT_DIR}\n")

    # Abre a pasta no Explorer
    if caminhos and sys.platform == "win32":
        os.startfile(OUTPUT_DIR)


# ──────────────────────────────────────────────
# ENTRY POINT
# ──────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description="Gerador de imagens Instagram — Tech Churras")
    parser.add_argument("--tipo", type=str, help="Chave do tipo (1-9)")
    parser.add_argument("--formato", type=str, choices=FORMATOS.keys(), default="feed")
    parser.add_argument("--qtd", type=int, default=1, choices=range(1, 6))
    parser.add_argument("--prompt", type=str, help="Prompt personalizado (substitui o tipo)")
    args = parser.parse_args()

    if args.prompt:
        prompt = f"{args.prompt}, {ESTILO_BASE}"
        nome = "personalizado"
    elif args.tipo and args.tipo in TIPOS:
        tipo = TIPOS[args.tipo]
        prompt = tipo["prompt"] or ""
        nome = tipo["nome"]
        if not prompt:
            prompt = input("Digite seu prompt em inglês: ").strip()
            prompt = f"{prompt}, {ESTILO_BASE}"
    else:
        prompt, nome, args.formato, args.qtd = menu_interativo()

    run(prompt, nome, args.formato, args.qtd)


if __name__ == "__main__":
    main()
