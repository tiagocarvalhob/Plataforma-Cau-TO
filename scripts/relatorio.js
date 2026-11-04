// Gera a tabela de cobertura de docs/relatorio.md a partir de js/edital.js e js/videos.js.
// Uso: node scripts/relatorio.js > docs/cobertura.md
const fs = require("fs"), path = require("path");
global.window = {};
const raiz = path.join(__dirname, "..");
eval(fs.readFileSync(path.join(raiz, "js/edital.js"), "utf8"));
eval(fs.readFileSync(path.join(raiz, "js/videos.js"), "utf8"));
const E = window.EDITAL, V = window.VIDEOS;
const out = ["# Cobertura de vídeos por assunto", "", "Gerado por `node scripts/relatorio.js`. ✓ = link conferido no oEmbed do YouTube; ? = encontrado na busca, ainda não conferido.", ""];
const link = e => e.playlist ? `https://www.youtube.com/playlist?list=${e.playlist}` : `https://www.youtube.com/watch?v=${e.video}`;
const item = e => `[${e.titulo.replace(/[|\[\]]/g, " ")}](${link(e)})${e.playlist ? " (playlist)" : ""} ${e.verificado ? "✓" : "?"}`;
E.blocos.forEach(b => b.disciplinas.forEach(d => {
  out.push(`## ${d.nome} (${b.nome.toLowerCase()})`, "", "| Assunto | Aulas | Vídeos de questões |", "|---|---|---|");
  d.grupos.forEach(g => g.assuntos.forEach(a => {
    const v = V[a.id] || { aulas: [], questoes: [] };
    out.push(`| **${a.n}** ${a.t.replace(/\|/g, "/")} | ${v.aulas.length ? v.aulas.map(item).join("<br>") : "**Conteúdo não encontrado**"} | ${v.questoes.length ? v.questoes.map(item).join("<br>") : "não encontrado"} |`);
  }));
  out.push("");
}));
console.log(out.join("\n"));
