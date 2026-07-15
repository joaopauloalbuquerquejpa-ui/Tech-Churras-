"""
Tech Churras — Buscador de Fotos Reais para Instagram
Usa Pexels API (gratuita) — fotos reais, licença comercial livre.

Uso:
    python buscar_fotos_instagram.py
    python buscar_fotos_instagram.py --busca "picanha churrasco" --qtd 5 --formato retrato
"""

import os
import sys
import json
import argparse
import requests
from datetime import datetime
from logo_overlay import aplicar_logo

# ──────────────────────────────────────────────
# CONFIGURAÇÃO
# ──────────────────────────────────────────────

PEXELS_API_KEY = "IjKC0G0k7HcV4HEtI9dhpnzTnqKDp0lwFpqZioPQTjQgEO1NG2dXh8dw"
OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "fotos_reais_instagram")

FORMATOS = {
    "feed":    {"orientation": "square",    "label": "Feed 1:1"},
    "retrato": {"orientation": "portrait",  "label": "Feed 4:5 / Stories"},
    "paisagem":{"orientation": "landscape", "label": "Paisagem 16:9"},
}

BUSCAS_PRONTAS = {
    "1": {"nome": "Picanha no espeto",         "query": "picanha espeto churrasco brasileiro brasa"},
    "2": {"nome": "Churrasco brasileiro",      "query": "churrasco brasileiro familia quintal brasa"},
    "3": {"nome": "Churrasqueiro profissional","query": "churrasqueiro profissional grelha fogo brasil"},
    "4": {"nome": "Mesa farta de churrasco",   "query": "mesa churrasco carnes assadas festa brasileira"},
    "5": {"nome": "Costela na brasa",          "query": "costela bovina brasa churrasco brasil"},
    "6": {"nome": "Açougue brasileiro",        "query": "acougue brasileiro cortes nobres picanha carne"},
    "7": {"nome": "Familia no churrasco",      "query": "familia reuniao churrasco domingo brasil"},
    "8": {"nome": "Grelha e brasa",            "query": "grelha brasa carvao churrasco brasileiro fumo"},
    "9": {"nome": "Busca personalizada",       "query": None},
}


# ──────────────────────────────────────────────
# FUNÇÕES
# ──────────────────────────────────────────────

def buscar_fotos(query: str, orientation: str, per_page: int = 10) -> list:
    resp = requests.get(
        "https://api.pexels.com/v1/search",
        headers={"Authorization": PEXELS_API_KEY},
        params={"query": query, "orientation": orientation, "per_page": per_page},
        timeout=30,
    )
    resp.raise_for_status()
    return resp.json()["photos"]


def baixar_foto(url: str, path: str):
    resp = requests.get(url, timeout=60, stream=True)
    resp.raise_for_status()
    with open(path, "wb") as f:
        for chunk in resp.iter_content(chunk_size=8192):
            f.write(chunk)


def escolher_url(foto: dict, orientation: str) -> str:
    src = foto["src"]
    if orientation == "square":
        return src.get("large2x") or src["original"]
    return src.get("large2x") or src["original"]


def salvar_fotos(fotos: list, nome: str, orientation: str, qtd: int) -> list:
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    ts = datetime.now().strftime("%Y%m%d_%H%M%S")
    slug = nome.lower().replace(" ", "_")
    caminhos = []

    for i, foto in enumerate(fotos[:qtd], 1):
        url = escolher_url(foto, orientation)
        ext = "jpg"
        filename = f"{ts}_{slug}_{i}.{ext}"
        path = os.path.join(OUTPUT_DIR, filename)
        print(f"  [{i}/{qtd}] Baixando ({foto['photographer']})...", end=" ", flush=True)
        try:
            baixar_foto(url, path)
            aplicar_logo(path)
            size_kb = os.path.getsize(path) // 1024
            print(f"OK — {filename} ({size_kb}KB)")
            print(f"       Foto por: {foto['photographer']} | Pexels: {foto['url']}")
            caminhos.append(path)
        except Exception as e:
            print(f"ERRO: {e}")

    return caminhos


def menu_interativo():
    print("\n+==========================================+")
    print("|  Tech Churras — Fotos Reais Instagram    |")
    print("+==========================================+\n")

    print("Tipo de conteudo:")
    for k, v in BUSCAS_PRONTAS.items():
        print(f"  {k}. {v['nome']}")

    tipo_key = input("\nEscolha [1-9]: ").strip()
    if tipo_key not in BUSCAS_PRONTAS:
        print("Opcao invalida.")
        sys.exit(1)

    tipo = BUSCAS_PRONTAS[tipo_key]
    if tipo["query"] is None:
        query = input("Digite sua busca em ingles: ").strip()
        if not query:
            sys.exit(1)
        nome = "personalizado"
    else:
        query = tipo["query"]
        nome = tipo["nome"]

    print("\nFormato:")
    for k, v in FORMATOS.items():
        print(f"  {k} — {v['label']}")
    fmt = input("\nFormato [feed/retrato/paisagem]: ").strip().lower()
    if fmt not in FORMATOS:
        fmt = "feed"

    qtd = input("Quantas fotos? [1-10, padrao 5]: ").strip()
    qtd = int(qtd) if qtd.isdigit() and 1 <= int(qtd) <= 10 else 5

    return query, nome, fmt, qtd


def run(query: str, nome: str, formato_key: str, qtd: int):
    fmt = FORMATOS[formato_key]
    print(f"\nBuscando: \"{query}\" [{fmt['label']}] — {qtd} foto(s)\n")

    fotos = buscar_fotos(query, fmt["orientation"], per_page=max(qtd, 5))
    if not fotos:
        print("Nenhuma foto encontrada. Tente outra busca.")
        sys.exit(1)

    caminhos = salvar_fotos(fotos, nome, fmt["orientation"], qtd)

    print(f"\nOK: {len(caminhos)} foto(s) salva(s) em:")
    print(f"  {OUTPUT_DIR}\n")
    print("Licenca: todas as fotos Pexels sao livres para uso comercial.")
    print("Credito opcional mas recomendado: 'Foto via Pexels'\n")

    if caminhos and sys.platform == "win32":
        os.startfile(OUTPUT_DIR)


# ──────────────────────────────────────────────
# ENTRY POINT
# ──────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description="Buscador de fotos reais — Tech Churras")
    parser.add_argument("--busca", type=str, help="Termo de busca em ingles")
    parser.add_argument("--formato", type=str, choices=FORMATOS.keys(), default="feed")
    parser.add_argument("--qtd", type=int, default=5)
    args = parser.parse_args()

    if args.busca:
        run(args.busca, args.busca, args.formato, args.qtd)
    else:
        query, nome, fmt, qtd = menu_interativo()
        run(query, nome, fmt, qtd)


if __name__ == "__main__":
    main()
