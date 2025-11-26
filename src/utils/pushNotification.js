import { getToken } from "firebase/messaging";
import { messaging } from "../firebaseConfig";
import { doc, updateDoc, getFirestore, arrayUnion, getDoc, setDoc } from "firebase/firestore";
import { app } from "../firebaseConfig";

// ▼▼▼ COLE SUA CHAVE AQUI (MANTENHA AS ASPAS) ▼▼▼
const VAPID_KEY = "BGWbSqipO5mgziI4LvlMKJKRm9WuuNS79_xmcDNYv4A_t6JknwIHQqSAfFqxhKG6s31wdoQJ0TjAfjgnl-r4nWM"; 

const db = getFirestore(app);

export const requestNotificationPermission = async (userEmail) => {
  try {
    // 1. Pede permissão ao navegador/celular
    const permission = await Notification.requestPermission();
    
    if (permission === 'granted') {
      console.log('Permissão de notificação concedida.');
      
      // 2. Pega o Token único deste dispositivo
      const token = await getToken(messaging, { vapidKey: VAPID_KEY });
      
      if (token) {
        console.log('Token FCM gerado:', token);
        
        // 3. Verifica se é Admin ou Usuário Comum para saber onde salvar
        const adminRef = doc(db, "admins", userEmail);
        const adminSnap = await getDoc(adminRef);
        
        if (adminSnap.exists()) {
          // Se é Admin, salva na coleção 'admins'
          await updateDoc(adminRef, {
            fcmTokens: arrayUnion(token)
          });
          console.log('Token salvo no perfil do Admin.');
        } else {
          // Se é usuário comum, salva/cria na coleção 'users' (ou onde preferir)
          // Vamos criar uma coleção 'users_tokens' simples para não complicar
          const userTokenRef = doc(db, "users_tokens", userEmail);
          await setDoc(userTokenRef, {
            email: userEmail,
            fcmTokens: arrayUnion(token)
          }, { merge: true });
          console.log('Token salvo para o Usuário.');
        }
      }
    } else {
      console.log('Permissão de notificação negada pelo usuário.');
    }
  } catch (error) {
    console.error('Erro ao configurar notificações:', error);
  }
};