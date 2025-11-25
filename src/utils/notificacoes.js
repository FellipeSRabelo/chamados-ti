import { getFirestore, collection, addDoc } from 'firebase/firestore';
import { app } from '../firebaseConfig';

const db = getFirestore(app);

/**
 * Envia uma notificação para o Firestore.
 * @param {string} destinatario - Pode ser o email do usuário ou "ADMIN"
 * @param {string} titulo - Título curto (ex: "Novo Chamado")
 * @param {string} mensagem - Detalhe (ex: "João abriu um chamado no Lab 1")
 * @param {string} link - Para onde vai ao clicar (opcional)
 */
export const enviarNotificacao = async (destinatario, titulo, mensagem, link = '') => {
  try {
    await addDoc(collection(db, "notificacoes"), {
      para: destinatario,
      titulo: titulo,
      mensagem: mensagem,
      link: link,
      lida: false,
      data: new Date().toLocaleString('pt-BR'),
      timestamp: Date.now() // Para ordenar
    });
    console.log("Notificação enviada para:", destinatario);
  } catch (error) {
    console.error("Erro ao enviar notificação:", error);
  }
};