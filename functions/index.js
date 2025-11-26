const { onDocumentCreated } = require("firebase-functions/v2/firestore");
const admin = require("firebase-admin");

admin.initializeApp();

exports.enviarPushNotification = onDocumentCreated("notificacoes/{notificacaoId}", async (event) => {
    const snapshot = event.data;
    
    if (!snapshot) {
        console.log("Sem dados associados ao evento.");
        return;
    }

    const dados = snapshot.data();
    const destinatarioEmail = dados.para;

    console.log(`Nova notificação detectada para: ${destinatarioEmail}`);

    let tokensParaEnviar = [];

    try {
        if (destinatarioEmail === "ADMIN") {
            const adminsSnapshot = await admin.firestore().collection("admins").get();
            adminsSnapshot.forEach(doc => {
                const dadosAdmin = doc.data();
                if (dadosAdmin.fcmTokens && Array.isArray(dadosAdmin.fcmTokens)) {
                    tokensParaEnviar.push(...dadosAdmin.fcmTokens);
                }
            });
        } else {
            const userDoc = await admin.firestore().collection("admins").doc(destinatarioEmail).get();
            
            // Tenta buscar em 'admins' primeiro, se não achar, tenta em 'users_tokens'
            if (userDoc.exists) {
                 const dadosUser = userDoc.data();
                 if (dadosUser.fcmTokens) tokensParaEnviar.push(...dadosUser.fcmTokens);
            } else {
                 // Lógica de fallback para usuários comuns
                 const userTokenDoc = await admin.firestore().collection("users_tokens").doc(destinatarioEmail).get();
                 if (userTokenDoc.exists) {
                     const dadosUserToken = userTokenDoc.data();
                     if (dadosUserToken.fcmTokens) tokensParaEnviar.push(...dadosUserToken.fcmTokens);
                 }
            }
        }

        // Remove duplicados e tokens vazios
        tokensParaEnviar = [...new Set(tokensParaEnviar)].filter(token => token);

        if (tokensParaEnviar.length === 0) {
            console.log("Nenhum token de celular encontrado para enviar.");
            return null;
        }

        // --- MUDANÇA AQUI: Nova estrutura de mensagem ---
        const message = {
            notification: {
                title: dados.titulo || "Nova Notificação",
                body: dados.mensagem || "Você tem uma nova mensagem.",
            },
            webpush: {
                fcmOptions: {
                    link: `https://ti.elisaandreoli.com.br${dados.link || '/dashboard'}`
                },
                notification: {
                    icon: 'https://ti.elisaandreoli.com.br/pwa-192x192.png'
                }
            },
            tokens: tokensParaEnviar // Envia para a lista de tokens
        };

        // --- MUDANÇA AQUI: Novo método de envio ---
        const response = await admin.messaging().sendEachForMulticast(message);
        
        console.log("Notificações enviadas com sucesso:", response.successCount);
        console.log("Falhas:", response.failureCount);

        // Limpeza de tokens inválidos
        if (response.failureCount > 0) {
            const failedTokens = [];
            response.responses.forEach((resp, idx) => {
                if (!resp.success) {
                    failedTokens.push(tokensParaEnviar[idx]);
                }
            });
            console.log('Tokens que falharam:', failedTokens);
            // Aqui você poderia implementar a lógica para remover esses tokens do banco
        }

    } catch (error) {
        console.error("Erro na função de notificação:", error);
    }
});