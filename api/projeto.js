import { neon } from "@neondatabase/serverless";

export default async function handler(request, response) {
  if (request.method !== "GET") {
    response.setHeader("Allow", "GET");
    return response.status(405).json({ erro: "Método indisponível." });
  }

  const connection = process.env.DATABASE_URL?.trim();
  if (!connection) {
    return response.status(503).json({ erro: "Dados do projeto indisponíveis." });
  }

  try {
    const sql = neon(connection);
    const [projeto] = await sql`
      SELECT versao, placa, bluetooth, etapas
      FROM public.projeto
      WHERE slug = ${"apoio"}
    `;
    if (!projeto) return response.status(404).json({ erro: "Projeto não encontrado." });

    response.setHeader("Cache-Control", "public, max-age=60, s-maxage=300, stale-while-revalidate=600");
    return response.status(200).json(projeto);
  } catch {
    console.error("Falha ao consultar a versão pública do Projeto Senac.");
    return response.status(503).json({ erro: "Dados do projeto indisponíveis." });
  }
}
