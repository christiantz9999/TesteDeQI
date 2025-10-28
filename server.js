// --- server.js ---
// Este é o seu backend seguro que conversa com o Mercado Pago

// Importações necessárias
const express = require('express');
const { MercadoPagoConfig, Payment } = require('mercadopago');
const cors = require('cors');

// --- 1. CONFIGURAÇÃO INICIAL ---

// !! IMPORTANTE !!
// Coloque seu ACCESS TOKEN SECRETO do Mercado Pago aqui.
// Você pode encontrá-lo em: https://www.mercadopago.com.br/developers/panel/credentials
const MERCADOPAGO_ACCESS_TOKEN = "SEU_ACCESS_TOKEN_VAI_AQUI";

const app = express();
const port = 3000; // O servidor rodará na porta 3000

// Configura o MercadoPagoConfig
const client = new MercadoPagoConfig({ 
    accessToken: MERCADOPAGO_ACCESS_TOKEN,
    options: { timeout: 5000 }
});

const payment = new Payment(client);

// Middlewares
app.use(cors()); // Permite que seu index.html (em outro domínio/porta) acesse este servidor
app.use(express.json()); // Permite ao servidor entender JSON

// --- 2. ENDPOINT PARA CRIAR O PAGAMENTO ---
// O frontend chamará este endpoint para gerar um novo PIX

app.post('/api/create-payment', async (req, res) => {
    try {
        const amount = 5.99; // O valor do seu produto
        const description = "Relatório de QI Profissional 2025";

        const paymentRequestBody = {
            transaction_amount: amount,
            description: description,
            payment_method_id: 'pix',
            payer: {
                email: `teste_${Date.now()}@test.com`, // Email de teste
            },
            notification_url: "https://seu-site.com/webhook-mercadopago" // Opcional, mas recomendado para produção
        };

        // Cria o pagamento
        const result = await payment.create({ body: paymentRequestBody });
        
        // Log de sucesso no console do servidor
        console.log("Pagamento PIX criado. ID:", result.id);

        // Retorna os dados do PIX para o frontend
        res.status(201).json({
            paymentId: result.id,
            qrCodeBase64: result.point_of_interaction.transaction_data.qr_code_base64,
            qrCodeCopyPaste: result.point_of_interaction.transaction_data.qr_code
        });

    } catch (error) {
        console.error("Erro ao criar pagamento PIX:", error.message);
        res.status(500).json({ error: 'Erro ao criar pagamento.', details: error.message });
    }
});

// --- 3. ENDPOINT PARA VERIFICAR O STATUS DO PAGAMENTO ---
// O frontend chamará este endpoint repetidamente (polling)

app.get('/api/check-payment/:id', async (req, res) => {
    try {
        const paymentId = req.params.id;

        // Busca o pagamento no Mercado Pago
        const result = await payment.get({ id: paymentId });
        
        // Retorna o status ("approved", "pending", etc.)
        res.status(200).json({
            status: result.status
        });

    } catch (error) {
        console.error("Erro ao verificar status:", error.message);
        res.status(500).json({ error: 'Erro ao verificar status do pagamento.' });
    }
});

// --- 4. INICIA O SERVIDOR ---
app.listen(port, () => {
    console.log(`Servidor backend rodando em http://localhost:${port}`);
    console.log("Aguardando conexões do frontend...");
});