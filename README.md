# Apoio | Projeto Senac

O Apoio é um protótipo escolar para pedir ajuda por uma tela touch. A CYD apresenta uma mensagem para revisão e encaminha um rascunho ao painel, onde a pessoa confirma o envio no WhatsApp.

[Portfólio publicado](https://setsinac.vercel.app/) · [Painel Bluetooth](https://setsinac.vercel.app/painel/)

## Usar o painel

1. Abra o site do projeto no Chrome com Bluetooth ativo.
2. Entre em **Painel**, toque em **Conectar por Bluetooth** e selecione **Projeto Senac**.
3. Cadastre o contato de apoio e mantenha o painel aberto para receber o rascunho.

O painel guarda o contato no navegador. A API do portfólio consulta apenas a versão, as especificações públicas e o andamento do projeto.

## Publicação

O site e o painel estão em `public/`. A função `api/projeto.js` consulta a tabela inicializada por `db/001-projeto.sql`. Configure `DATABASE_URL` no ambiente da Vercel com uma credencial que tenha acesso de leitura à tabela `public.projeto`. A variável é utilizada no servidor.

Para visualizar os arquivos estáticos localmente, execute `npx vercel dev` neste diretório. A conexão Bluetooth usa o painel aberto no Chrome por HTTPS ou em `localhost`.
