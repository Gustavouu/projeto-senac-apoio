async function atualizarProjeto() {
  try {
    const resposta = await fetch("/api/projeto", { headers: { Accept: "application/json" } });
    if (!resposta.ok) return;
    const projeto = await resposta.json();
    for (const campo of document.querySelectorAll("[data-project]")) {
      const valor = projeto[campo.dataset.project];
      if (typeof valor === "string" && valor) campo.textContent = valor;
    }
    if (!Array.isArray(projeto.etapas)) return;
    for (const linha of document.querySelectorAll("[data-stage]")) {
      const etapa = projeto.etapas.find(item => item?.id === linha.dataset.stage);
      if (!etapa || ![etapa.titulo, etapa.detalhe, etapa.estado].every(valor => typeof valor === "string")) continue;
      linha.querySelector("h3").textContent = etapa.titulo;
      linha.querySelector("p").textContent = etapa.detalhe;
      linha.querySelector("span").textContent = etapa.estado;
    }
  } catch {
    // Keep the last published project description visible if the data request fails.
  }
}

atualizarProjeto();
