#!/usr/bin/env python3
"""Gera js/videos.js a partir da curadoria em dados/.

dados/candidatos.txt   assunto|a (aula) ou q (questões)|ID do vídeo ou PL:ID da playlist|título
dados/verificados.txt  ID|canal      links que responderam ao oEmbed do YouTube (existem e permitem incorporação)
dados/quebrados.txt    ID|motivo     links removidos, privados ou que não permitem incorporação (ficam de fora)

Uso: python3 scripts/gerar_videos.py
"""
import json
import pathlib

RAIZ = pathlib.Path(__file__).resolve().parent.parent
DADOS = RAIZ / "dados"


def ler(nome, partes):
    arq = DADOS / nome
    if not arq.exists():
        return []
    linhas = []
    for l in arq.read_text(encoding="utf-8").splitlines():
        if l.strip() and not l.startswith("#"):
            linhas.append(l.split("|", partes - 1))
    return linhas


def main():
    verificados = {}
    for linha in ler("verificados.txt", 3):
        verificados[linha[0]] = linha  # ID|canal|data(opcional)
    quebrados = {l[0] for l in ler("quebrados.txt", 2)}
    saida = {}
    for assunto, tipo, vid, titulo in ler("candidatos.txt", 4):
        if vid in quebrados:
            continue
        d = saida.setdefault(assunto, {"aulas": [], "questoes": []})
        chave = "aulas" if tipo == "a" else "questoes"
        e = {"titulo": titulo}
        if vid.startswith("PL:"):
            e["playlist"] = vid[3:]
        else:
            e["video"] = vid
        if vid in verificados:
            v = verificados[vid]
            e["canal"] = v[1]
            e["verificado"] = v[2] if len(v) > 2 and v[2] else "2026-11-04"
        if any((x.get("video") or x.get("playlist")) == (e.get("video") or e.get("playlist")) for x in d[chave]):
            continue
        d[chave].append(e)
    for d in saida.values():  # playlists completas primeiro
        d["aulas"].sort(key=lambda e: 0 if "playlist" in e else 1)
    js = ("// Curadoria de vídeos do YouTube por assunto do edital. Gerado por scripts/gerar_videos.py; não edite à mão.\n"
          "// verificado: data em que o link respondeu ao oEmbed do YouTube (existe e permite incorporação).\n"
          "// Sem 'verificado': encontrado na busca do YouTube, ainda não conferido pelo oEmbed.\n"
          "window.VIDEOS = " + json.dumps(saida, ensure_ascii=False, indent=1) + ";\n")
    (RAIZ / "js" / "videos.js").write_text(js, encoding="utf-8")
    aulas = sum(len(d["aulas"]) for d in saida.values())
    quest = sum(len(d["questoes"]) for d in saida.values())
    print(f"{len(saida)} assuntos com vídeo, {aulas} aulas, {quest} vídeos de questões, {len(quebrados)} links descartados")


if __name__ == "__main__":
    main()
