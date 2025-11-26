import { getToken } from "firebase/messaging";
import { messaging } from "../firebaseConfig";
import { doc, updateDoc, getFirestore, arrayUnion } from "firebase/firestore";

// Aquela chave longa que você gerou no Passo 1
const VAPID_KEY = "COLE_SUA_CHAVE_VAPID_AQUI"; 

export const requestNotificationPermission = async (userEmail) => {
  try {
    const permission = await Notification.requestPermission();
    
    if (permission === 'granted') {
      console.log('Permissão de notificação concedida.');
      
      const token = await getToken(messaging, { vapidKey: VAPID_KEY });
      
      if (token) {
        console.log('Token FCM:', token);
        // Salva o token no documento do usuário (na coleção admins ou users)
        // Aqui vamos supor que você quer salvar na coleção 'admins' para o gestor
        // E talvez criar uma coleção 'users_tokens' para usuários comuns.
        
        const db = getFirestore();
        // Exemplo: Salvando para o Admin
        const adminRef = doc(db, "admins", userEmail);
        
        // Usamos arrayUnion para não apagar tokens de outros dispositivos (celular, pc)
        await updateDoc(adminRef, {
          fcmTokens: arrayUnion(token)
        }).catch(() => {
             // Se falhar (ex: não é admin), tenta salvar numa coleção genérica de usuários
             // Isso requer que você crie a lógica de usuários no banco se quiser notificar users
        });
        
      }
    } else {
      console.log('Permissão de notificação negada.');
    }
  } catch (error) {
    console.error('Erro ao configurar notificações:', error);
  }
};