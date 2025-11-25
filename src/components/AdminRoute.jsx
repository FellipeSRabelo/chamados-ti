import { useEffect, useState } from 'react';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import { Navigate } from 'react-router-dom';
import { app } from '../firebaseConfig';

export default function AdminRoute({ children }) {
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(null); // null = ainda verificando
  const [loading, setLoading] = useState(true);
  
  const auth = getAuth(app);
  const db = getFirestore(app);

  useEffect(() => {
    // 1. Verifica se está logado
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        
        // 2. Se estiver logado, verifica se é ADMIN no banco
        try {
          const adminRef = doc(db, "admins", currentUser.email);
          const adminSnap = await getDoc(adminRef);
          setIsAdmin(adminSnap.exists());
        } catch (error) {
          console.error("Erro ao verificar admin:", error);
          setIsAdmin(false);
        }
      } else {
        setUser(null);
        setIsAdmin(false);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return <div style={{height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>Verificando permissões...</div>;
  }

  // Se não estiver logado -> Login
  if (!user) {
    return <Navigate to="/login" />;
  }

  // Se estiver logado mas NÃO for admin -> Área do Usuário
  if (isAdmin === false) {
    return <Navigate to="/usuario" />;
  }

  // Se for admin -> Libera o acesso
  return children;
}