// Usando a versão 10.12.2 (Mais recente e estável)
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js');

// ▼▼▼ COLE SUAS CHAVES AQUI (NÃO USE IMPORT, COLE OS DADOS REAIS) ▼▼▼
const firebaseConfig = {
  apiKey: "AIzaSyBn3otnFDtySDsHQK8fzD_yJqKPdONKKsY",
  authDomain: "chamadosti-501e8.firebaseapp.com",
  projectId: "chamadosti-501e8",
  storageBucket: "chamadosti-501e8.firebasestorage.app",
  messagingSenderId: "125531522166",
  appId: "1:125531522166:web:9bf465b592b1096705cb57"
};

firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();
/*
// Configura o recebimento em segundo plano
messaging.onBackgroundMessage(function(payload) {
  console.log('[firebase-messaging-sw.js] Recebeu mensagem em background ', payload);
  
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/pwa-192x192.png', // Certifique-se que essa imagem existe na pasta public
    data: payload.data // Passa dados extras (como o link)
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Lida com o clique na notificação
self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  
  // Tenta pegar o link que enviamos no payload
  const link = event.notification.data?.click_action || '/dashboard';
  
  event.waitUntil(
    clients.openWindow(link)
  );
});*/