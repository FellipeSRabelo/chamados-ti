const { onDocumentCreated } = require("firebase-functions/v2/firestore");
const admin = require("firebase-admin");

admin.initializeApp();

// Função atualizada para a sintaxe V2 (onDocumentCreated)
exports.enviarPushNotification = onDocumentCreated("notificacoes/{notificacaoId}", async (event) => {
    // Em v2, o snapshot fica dentro de event.data
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
            // 1. Se for para ADMIN, busca na coleção 'admins'
            const adminsSnapshot = await admin.firestore().collection("admins").get();

            adminsSnapshot.forEach(doc => {
                const dadosAdmin = doc.data();
                if (dadosAdmin.fcmTokens && Array.isArray(dadosAdmin.fcmTokens)) {
                    tokensParaEnviar.push(...dadosAdmin.fcmTokens);
                }
            });
        } else {
            // 2. Se for para um Usuário Específico
            const userDoc = await admin.firestore().collection("admins").doc(destinatarioEmail).get();

            if (userDoc.exists) {
                const dadosUser = userDoc.data();
                if (dadosUser.fcmTokens) tokensParaEnviar.push(...dadosUser.fcmTokens);
            } else {
                console.log("Usuário não encontrado ou não é admin.");
            }
        }

        // Remove tokens duplicados
        tokensParaEnviar = [...new Set(tokensParaEnviar)];

        if (tokensParaEnviar.length === 0) {
            console.log("Nenhum token de celular encontrado para enviar.");
            return null;
        }

        // Monta a mensagem
        const payload = {
            notification: {
                title: dados.titulo || "Nova Notificação",
                body: dados.mensagem || "Você tem uma nova mensagem.",
                icon: 'https://ti.elisaandreoli.com.br/pwa-192x192.png',
                click_action: `https://ti.elisaandreoli.com.br${dados.link || '/dashboard'}`
            }
        };

        // Envia!
        const response = await admin.messaging().sendToDevice(tokensParaEnviar, payload);
        console.log("Notificações enviadas com sucesso:", response.successCount);

        // Limpeza de tokens inválidos
        if (response.failureCount > 0) {
            response.results.forEach((result, index) => {
                const error = result.error;
                if (error) {
                    console.error('Falha ao enviar para token:', tokensParaEnviar[index], error);
                }
            });
        }
    } catch (error) {
        console.error("Erro na função de notificação:", error);
    }
});