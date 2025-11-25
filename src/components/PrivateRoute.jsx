import { useEffect, useState } from 'react';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { Navigate } from 'react-router-dom';
import { app } from '../firebaseConfig';

export default function PrivateRoute({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const auth = getAuth(app);

  useEffect(() => {
    // Ouve o Firebase para saber se tem usuário logado
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) {
    // Enquanto o Firebase pensa, mostra um carregando simples
    return <div style={{height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>Carregando sistema...</div>;
  }

  // Se não tem usuário, chuta pro Login
  if (!user) {
    return <Navigate to="/login" />;
  }

  // Se tem usuário, deixa entrar
  return children;
}