import { getToken } from "firebase/messaging";
import { messaging } from "../firebaseConfig";
import { doc, updateDoc, getFirestore, arrayUnion, getDoc, setDoc } from "firebase/firestore";
import { app } from "../firebaseConfig";

// ▼▼▼ COLE SUA CHAVE VAPID AQUI (MANTENHA AS ASPAS) ▼▼▼
// Pegue em: Configurações do Projeto > Cloud Messaging > Web configuration > Web Push certificates
const VAPID_KEY = "COLE_SUA_CHAVE_GIGANTE_AQUI"; 

const db = getFirestore(app);

export const requestNotificationPermission = async (userEmail) => {
  console.log("1. Iniciando pedido de permissão para:", userEmail);
  
  try {
    // 1. Pede permissão ao navegador/celular
    const permission = await Notification.requestPermission();
    
    if (permission === 'granted') {
      console.log('2. Permissão concedida! Tentando gerar token...');
      
      // 2. Pega o Token único deste dispositivo
      const token = await getToken(messaging, { vapidKey: VAPID_KEY });
      
      if (token) {
        console.log('3. Token gerado com sucesso:', token);
        
        // 4. Tenta salvar no ADMIN primeiro
        const adminRef = doc(db, "admins", userEmail);
        const adminSnap = await getDoc(adminRef);
        
        if (adminSnap.exists()) {
          console.log("4. Usuário é Admin. Salvando token...");
          await updateDoc(adminRef, {
            fcmTokens: arrayUnion(token)
          });
          console.log('5. Sucesso! Token salvo na coleção admins.');
        } else {
          console.log("4. Usuário Comum. Salvando em users_tokens...");
          // Se não é admin, salva numa coleção separada
          const userTokenRef = doc(db, "users_tokens", userEmail);
          await setDoc(userTokenRef, {
            email: userEmail,
            fcmTokens: arrayUnion(token)
          }, { merge: true });
          console.log('5. Sucesso! Token salvo na coleção users_tokens.');
        }
      } else {
        console.log('Erro: Nenhum token foi gerado.');
      }
    } else {
      console.log('Permissão de notificação foi negada pelo usuário.');
    }
  } catch (error) {
    console.error('ERRO FATAL ao configurar notificações:', error);
  }
};