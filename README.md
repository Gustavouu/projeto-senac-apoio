# Apoio | Projeto Senac

O Apoio é um protótipo escolar para pedir ajuda pela tela sensível ao toque da CYD. A pessoa escolhe a situação, revisa a mensagem e toca em **Enviar mensagem**. O painel encaminha o pedido ao WhatsApp Business e devolve o resultado à CYD.

[Portfólio publicado](https://apoio-senac.vercel.app/) · [Painel Bluetooth](https://apoio-senac.vercel.app/painel/)

## Usar o painel

1. Abra o painel no Chrome do Android, toque em **Conectar por Bluetooth** e selecione **Projeto Senac**. Por Wi-Fi, conecte à rede **Apoio** e abra **http://192.168.4.1**. O celular precisa conseguir acessar a internet enquanto estiver na rede.
2. Mantenha o painel em primeiro plano e aguarde **Conectado**. No painel HTTPS, você pode autorizar uma vez o uso da localização do celular. A posição é consultada no momento do pedido.
3. Na CYD, toque em **Pedir ajuda**, escolha a situação e confirme em **Enviar mensagem**. **Pedido enviado** indica aceitação pelo canal de envio. O contato de apoio recebe a mensagem do número remetente do projeto.

## Ativar o envio do WhatsApp

Habilite o número remetente na API do WhatsApp Business da Meta, associe o contato de apoio que autorizou receber pedidos e aprove um modelo de mensagem em português do Brasil. O modelo padrão, **projeto_senac_pedido_apoio**, tem dois parâmetros posicionais no corpo. Um contém o texto da situação. O outro contém a localização com o mapa quando houver posição disponível.

> Pedido de apoio do Projeto Senac.
>
> {{1}}
>
> {{2}}
>
> Por favor, fale com a pessoa que usa o Apoio.

Adicione as variáveis privadas abaixo ao ambiente de produção da Vercel e publique uma nova versão.

| Variável | Valor |
| --- | --- |
| APOIO_RELAY_KEY | Chave gerada para a CYD, com 64 caracteres hexadecimais minúsculos |
| RELAY_DATABASE_URL | Conexão do papel `relay_sender` ao banco `apoio` do Projeto Senac |
| WHATSAPP_ACCESS_TOKEN | Token da Meta com permissão `whatsapp_business_messaging` |
| WHATSAPP_PHONE_NUMBER_ID | Identificador do número remetente associado ao WhatsApp Business |
| WHATSAPP_DESTINATARIO | Número do contato de apoio, com código do país e apenas dígitos |
| WHATSAPP_TEMPLATE | Nome do modelo aprovado, se diferente do padrão |
| WHATSAPP_API_VERSION | Versão da Graph API, se diferente de `v25.0` |

Use a mesma chave da variável `APOIO_RELAY_KEY` no campo `RelayKey` da configuração local do firmware. [WhatsApp Business Platform](https://developers.facebook.com/documentation/business-messaging/whatsapp/overview/) · [Política do WhatsApp Business](https://business.whatsapp.com/policy)

## Publicação

O site e o painel estão em `public/`. A função `api/projeto.js` usa `DATABASE_URL` para ler os dados públicos de `public.projeto`. A função de envio usa o papel dedicado da migração `db/002-envios.sql` para registrar a confirmação de cada pedido e reaproveitá-la quando a conexão repetir o pedido. O registro contém o identificador assinado, o estado, o horário e o indicador de localização. As coordenadas e o número do contato seguem na requisição de envio.

Para visualizar os arquivos estáticos localmente, execute `npx vercel dev` neste diretório. A conexão Bluetooth usa o painel aberto no Chrome por HTTPS ou em `localhost`.
