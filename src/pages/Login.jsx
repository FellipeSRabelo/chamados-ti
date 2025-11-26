import { useState } from 'react';
import { getAuth, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import { app } from '../firebaseConfig';
import { useNavigate } from 'react-router-dom';
import InstallButton from '../components/InstallButton';

export default function Login() {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();
  const auth = getAuth(app);
  const db = getFirestore(app);
  const googleProvider = new GoogleAuthProvider();

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError('');

    try {
      // 1. Faz o Login com o Google
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      
      // 2. Verifica no Banco se este e-mail é Admin
      // Procura na coleção "admins" um documento com o ID igual ao email
      const adminRef = doc(db, "admins", user.email);
      const adminSnap = await getDoc(adminRef);

      if (adminSnap.exists()) {
        // É ADMIN (TI) -> Vai para o Painel de Gestão
        console.log("Login Admin detectado:", user.email);
        navigate('/chamados');
      } else {
        // É USUÁRIO COMUM -> Vai para a Área do Colaborador
        console.log("Login Usuário detectado:", user.email);
        navigate('/usuario');
      }

    } catch (err) {
      console.error(err);
      setError('Erro ao conectar com Google. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  // Estilos simples para centralizar
  const styles = {
    container: {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      width: '100vw', // Garante tela cheia
      backgroundColor: '#f0f2f5',
      fontFamily: 'Arial, sans-serif'
    },
    box: {
      width: '90%',
      maxWidth: '400px',
      padding: '40px',
      backgroundColor: 'white',
      borderRadius: '12px',
      boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
      textAlign: 'center'
    },
    logo: {
      width: '80%',
      marginBottom: '30px'
    },
    googleButton: {
      width: '100%',
      padding: '12px',
      backgroundColor: '#fff',
      color: '#3c4043',
      border: '1px solid #dadce0',
      borderRadius: '4px',
      fontSize: '16px',
      fontWeight: '500',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '12px',
      transition: 'background-color 0.2s'
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.box}>
        <img 
          src="https://elisaandreoli.com.br/wp-content/uploads/2023/08/logomarca_cea_sem_fundo-1024x367.png" 
          alt="Logo Colégio" 
          style={styles.logo} 
        />
        
        <h2 style={{marginBottom: '10px', color: '#1e293b'}}>Bem-vindo</h2>
        <p style={{marginBottom: '30px', color: '#64748b'}}>Faça login para acessar o sistema de TI</p>
        
        {error && <p style={{ color: 'red', marginBottom: '15px', fontSize: '14px' }}>{error}</p>}

        <button 
          onClick={handleGoogleLogin} 
          style={styles.googleButton}
          disabled={loading}
          onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f7f8f8'}
          onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#fff'}
        >
          {loading ? 'Verificando...' : (
            <>
              <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="G" style={{width:'18px'}}/>
              Entrar com Google
            </>
          )}
        </button>
        <InstallButton />
      </div>
    </div>
  );
}