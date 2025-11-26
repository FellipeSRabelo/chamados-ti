importScripts('https://www.gstatic.com/firebasejs/compat/9.22.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/compat/9.22.0/firebase-messaging-compat.js');

// ATENÇÃO: Copie os valores do seu firebaseConfig.js e cole aqui ENTRE ASPAS.
// Não use variáveis, coloque os valores reais.
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

messaging.onBackgroundMessage(function(payload) {
  console.log('[firebase-messaging-sw.js] Mensagem em background:', payload);
  
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/pwa-192x192.png'
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});