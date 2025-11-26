importScripts('https://www.gstatic.com/firebasejs/compat/9.22.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/compat/9.22.0/firebase-messaging-compat.js');

// ATENÇÃO: Copie os valores do seu firebaseConfig.js e cole aqui ENTRE ASPAS.
// Não use variáveis, coloque os valores reais.
const firebaseConfig = {
  apiKey: "SUA_API_KEY_AQUI_COPIE_DO_OUTRO_ARQUIVO",
  authDomain: "seu-projeto.firebaseapp.com",
  projectId: "seu-projeto-id",
  storageBucket: "seu-projeto.appspot.com",
  messagingSenderId: "NUMERO_SENDER_ID",
  appId: "SEU_APP_ID"
};

firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();

messaging.onBackgroundMessage(function(payload) {
  console.log('[firebase-messaging-sw.js] Mensagem em background:', payload);
  
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/pwa-192x192.png'
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});