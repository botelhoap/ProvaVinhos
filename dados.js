"use strict";

const PUB_ID =
  "2PACX-1vSfJZ-_rX7urWLuRQMZFcDZvdqBHAUh4vxTBL9GN0FnjOVnbDfmMVBWn-1ppt6fquzNM3v9E89QPNA7";

const GID = "1153989984";

function sheetUrl() {
  return `https://docs.google.com/spreadsheets/d/e/${PUB_ID}/pub?gid=${GID}&single=true&output=csv`;
}

function parseCSV(texto) {
  const linhas = [];
  let linha = [];
  let valor = "";
  let dentroDeAspas = false;

  for (let i = 0; i < texto.length; i += 1) {
    const caractere = texto[i];
    const seguinte = texto[i + 1];

    if (caractere === '"') {
      if (dentroDeAspas && seguinte === '"') {
        valor += '"';
        i += 1;
      } else {
        dentroDeAspas = !dentroDeAspas;
      }
    } else if (caractere === "," && !dentroDeAspas) {
      linha.push(valor.trim());
      valor = "";
    } else if ((caractere === "\n" || caractere === "\r") && !dentroDeAspas) {
      if (caractere === "\r" && seguinte === "\n") {
        i += 1;
      }

      linha.push(valor.trim());

      if (linha.some((celula) => celula !== "")) {
        linhas.push(linha);
      }

      linha = [];
      valor = "";
    } else {
      valor += caractere;
    }
  }

  if (valor !== "" || linha.length > 0) {
    linha.push(valor.trim());

    if (linha.some((celula) => celula !== "")) {
      linhas.push(linha);
    }
  }

  return linhas;
}

function numberValue(valor) {
  if (typeof valor === "number") {
    return Number.isFinite(valor) ? valor : 0;
  }

  if (valor === null || valor === undefined || valor === "") {
    return 0;
  }

  const numero = Number(
    String(valor)
      .trim()
      .replace(/\s/g, "")
      .replace(/\./g, "")
      .replace(",", ".")
      .replace(/[^\d.-]/g, "")
  );

  return Number.isFinite(numero) ? numero : 0;
}

function formatPoints(valor) {
  return numberValue(valor).toLocaleString("pt-PT", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  });
}

function escapeHtml(valor) {
  return String(valor ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

async function getSheetData() {
  const resposta = await fetch(sheetUrl(), {
    cache: "no-store"
  });

  if (!resposta.ok) {
    throw new Error(
      `Não foi possível carregar a Google Sheet (erro HTTP ${resposta.status}).`
    );
  }

  const csv = await resposta.text();
  const linhas = parseCSV(csv);

  if (linhas.length < 2) {
    throw new Error("A Google Sheet não contém dados suficientes.");
  }

  const vinhos = [];
  const provadores = [];

  linhas.slice(1).forEach((linha) => {
    const nomeVinho = String(linha[2] || "").trim();

    if (nomeVinho !== "") {
      vinhos.push({
        tipo: String(linha[0] || "").trim(),
        numero: numberValue(linha[1]),
        nome: nomeVinho,
        votos: numberValue(linha[3]),
        pontos: numberValue(linha[4]),
        regiao: String(linha[5] || "").trim(),
        preco: String(linha[6] || "").trim()
      });
    }

    const nomeProvador = String(linha[8] || "").trim();

    if (nomeProvador !== "") {
      provadores.push({
        nome: nomeProvador,
        regioes: numberValue(linha[9]),
        precos: numberValue(linha[10]),
        total: numberValue(linha[11])
      });
    }
  });

  return { vinhos, provadores };
}
