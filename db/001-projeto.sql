CREATE TABLE IF NOT EXISTS public.projeto (
    slug text PRIMARY KEY,
    versao text NOT NULL,
    placa text NOT NULL,
    bluetooth text NOT NULL,
    etapas jsonb NOT NULL CHECK (jsonb_typeof(etapas) = 'array')
);

INSERT INTO public.projeto (slug, versao, placa, bluetooth, etapas)
VALUES (
    'apoio', 'V1', 'ESP32-2432S028R', 'Projeto Senac',
    '[
        {"id":"tela","titulo":"Tela e toque","detalhe":"A tela de ajuda e a revisão da mensagem já foram abertas na placa.","estado":"Verificado"},
        {"id":"bluetooth","titulo":"Conexão Bluetooth","detalhe":"O Chrome reconheceu a CYD como Projeto Senac e leu o serviço Bluetooth.","estado":"Verificado"},
        {"id":"envio","titulo":"Recebimento da mensagem","detalhe":"O painel prepara o rascunho. Falta confirmar o recebimento com um contato de teste.","estado":"Em teste"},
        {"id":"gps","titulo":"GPS na placa","detalhe":"O receptor NEO-6M está previsto para obter a localização no próprio aparelho.","estado":"Em integração"}
    ]'::jsonb
)
ON CONFLICT (slug) DO UPDATE SET
    versao = EXCLUDED.versao,
    placa = EXCLUDED.placa,
    bluetooth = EXCLUDED.bluetooth,
    etapas = EXCLUDED.etapas;
