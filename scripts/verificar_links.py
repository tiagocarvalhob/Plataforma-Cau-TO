#!/usr/bin/env python3
"""Confere cada link da curadoria no oEmbed do YouTube e atualiza dados/verificados.txt e dados/quebrados.txt.

O oEmbed responde 200 quando o vídeo ou a playlist existe e pode ser incorporado,
401 quando o dono não permite incorporação e 404 ou 400 quando foi removido ou é privado.
Não precisa de chave de API.

Uso: python3 scripts/verificar_links.py            (só os que ainda não foram conferidos)
     python3 scripts/verificar_links.py --todos    (confere tudo de novo)
Depois rode python3 scripts/gerar_videos.py para atualizar js/videos.js.
"""
import datetime
import json
import pathlib
import sys
import time
import urllib.error
import urllib.parse
import urllib.request

RAIZ = pathlib.Path(__file__).resolve().parent.parent
DADOS = RAIZ / "dados"
HOJE = datetime.date.today().isoformat()


def url_de(vid):
    alvo = (f"https://www.youtube.com/playlist?list={vid[3:]}" if vid.startswith("PL:")
            else f"https://www.youtube.com/watch?v={vid}")
    return "https://www.youtube.com/oembed?format=json&url=" + urllib.parse.quote(alvo, safe="")


def conferir(vid):
    req = urllib.request.Request(url_de(vid), headers={"User-Agent": "plataforma-cau-to/1.0"})
    try:
        with urllib.request.urlopen(req, timeout=15) as r:
            return 200, json.load(r).get("author_name", "")
    except urllib.error.HTTPError as e:
        return e.code, ""


def main():
    ids = []
    for l in (DADOS / "candidatos.txt").read_text(encoding="utf-8").splitlines():
        if l.strip() and not l.startswith("#"):
            vid = l.split("|")[2]
            if vid not in ids:
                ids.append(vid)
    ver_arq, que_arq = DADOS / "verificados.txt", DADOS / "quebrados.txt"
    ver = {l.split("|")[0]: l for l in ver_arq.read_text(encoding="utf-8").splitlines() if l.strip()} if ver_arq.exists() else {}
    que = {l.split("|")[0]: l for l in que_arq.read_text(encoding="utf-8").splitlines() if l.strip()} if que_arq.exists() else {}
    todos = "--todos" in sys.argv
    fila = [i for i in ids if todos or (i not in ver and i not in que)]
    print(f"{len(ids)} links, {len(fila)} para conferir")
    for n, vid in enumerate(fila, 1):
        try:
            cod, canal = conferir(vid)
        except Exception as e:  # rede fora do ar: tenta de novo na próxima execução
            print(f"[{n}/{len(fila)}] {vid}: erro de rede ({e}), fica para depois")
            continue
        if cod == 200:
            ver[vid] = f"{vid}|{canal}|{HOJE}"
            que.pop(vid, None)
            print(f"[{n}/{len(fila)}] {vid}: ok ({canal})")
        elif cod in (401, 403):
            que[vid] = f"{vid}|não permite incorporação ({cod}) em {HOJE}"
            ver.pop(vid, None)
            print(f"[{n}/{len(fila)}] {vid}: não permite incorporação")
        elif cod in (400, 404):
            que[vid] = f"{vid}|removido ou privado ({cod}) em {HOJE}"
            ver.pop(vid, None)
            print(f"[{n}/{len(fila)}] {vid}: removido ou privado")
        else:
            print(f"[{n}/{len(fila)}] {vid}: resposta {cod}, fica para depois")
        time.sleep(0.5)
    ver_arq.write_text("\n".join(ver.values()) + "\n", encoding="utf-8")
    que_arq.write_text("\n".join(que.values()) + ("\n" if que else ""), encoding="utf-8")
    print(f"conferidos: {len(ver)} | descartados: {len(que)}")


if __name__ == "__main__":
    main()
