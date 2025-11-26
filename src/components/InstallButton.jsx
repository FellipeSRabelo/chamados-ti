import { useState, useEffect } from 'react';
import { Download } from 'lucide-react';

export default function InstallButton() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstallable, setIsInstallable] = useState(false);

  useEffect(() => {
    // Ouve o evento que o navegador dispara se o app for instalável
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault(); // Impede o banner padrão feio do Chrome
      setDeferredPrompt(e);
      setIsInstallable(true);
    });
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    
    deferredPrompt.prompt(); // Mostra a janelinha nativa de instalação
    
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
      setIsInstallable(false);
    }
  };

  if (!isInstallable) return null; // Se já estiver instalado ou não suportar, não mostra nada

  return (
    <button 
      onClick={handleInstallClick}
      style={{
        marginTop: '20px',
        background: 'none',
        border: '1px solid #007bff',
        color: '#007bff',
        padding: '10px 20px',
        borderRadius: '25px',
        fontWeight: 'bold',
        display: 'flex', alignItems: 'center', gap: '8px',
        cursor: 'pointer',
        width: '100%',
        justifyContent: 'center'
      }}
    >
      <Download size={18} />
      Instalar Aplicativo
    </button>
  );
}