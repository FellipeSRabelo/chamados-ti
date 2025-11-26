import { useState, useEffect } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { getAuth, signOut } from 'firebase/auth';
import { getFirestore, collection, query, where, onSnapshot, orderBy, doc, getDoc, updateDoc } from 'firebase/firestore';
import { app } from '../firebaseConfig';
import './Layout.css';

// ▼▼▼ 1. IMPORTAÇÃO NOVA AQUI ▼▼▼
import { requestNotificationPermission } from '../utils/pushNotification';

import { 
  Menu, Maximize, Bell, MoreVertical, LogOut, 
  LayoutDashboard, Ticket, Calendar, PlusCircle, Monitor, X
} from 'lucide-react';

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [menuUserOpen, setMenuUserOpen] = useState(false);
  
  const [notifOpen, setNotifOpen] = useState(false);
  const [notificacoes, setNotificacoes] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const auth = getAuth(app);
  const db = getFirestore(app);
  const user = auth.currentUser;

  // Efeito 1: Busca notificações do banco (Sino) e verifica Admin
  useEffect(() => {
    if (!user) return;

    const checkAdminAndSubscribe = async () => {
      const adminRef = doc(db, "admins", user.email);
      const adminSnap = await getDoc(adminRef);
      const ehAdmin = adminSnap.exists();
      setIsAdmin(ehAdmin);

      const destinatario = ehAdmin ? "ADMIN" : user.email;

      const q = query(
        collection(db, "notificacoes"), 
        where("para", "==", destinatario),
        orderBy("timestamp", "desc")
      );

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const lista = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setNotificacoes(lista);
      });

      return unsubscribe;
    };

    checkAdminAndSubscribe();
  }, [user]);

  // ▼▼▼ 2. EFEITO NOVO: PEDIR PERMISSÃO DE PUSH (CELULAR) ▼▼▼
  useEffect(() => {
    if (user) {
      // Chama a função que pede permissão e salva o token no banco
      requestNotificationPermission(user.email);
    }
  }, [user]); // Roda sempre que o usuário logar/carregar a página
  // ▲▲▲ FIM DA INSERÇÃO ▲▲▲


  // Conta não lidas
  const naoLidas = notificacoes.filter(n => !n.lida).length;

  const handleLogout = () => {
    signOut(auth).then(() => navigate('/login'));
  };

  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  const handleClickNotif = async (notificacao) => {
    if (!notificacao.lida) {
      await updateDoc(doc(db, "notificacoes", notificacao.id), { lida: true });
    }
    if (notificacao.link) navigate(notificacao.link);
    setNotificacoesOpen(false);
  };

  const menuItemsAdmin = [
    { path: '/dashboard', name: 'Dashboard', icon: <LayoutDashboard size={20} /> },
    { path: '/chamados', name: 'Chamados', icon: <Ticket size={20} /> },
    { path: '/agendamentos', name: 'Agendamentos', icon: <Calendar size={20} /> },
    { path: '/novo-chamado', name: 'Novo Chamado', icon: <PlusCircle size={20} /> },
    { path: '/monitor', name: 'Monitor', icon: <Monitor size={20} /> },
  ];

  const menuItemsUser = [
     { path: '/usuario', name: 'Meus Chamados', icon: <Ticket size={20} /> },
  ];

  const menuItems = isAdmin ? menuItemsAdmin : menuItemsUser;

  return (
    <div className="dashboard-container">
      
      <aside className={`sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
        <div className="sidebar-header">
          {sidebarOpen ? 'TI Elisa Andreoli' : 'TI'}
        </div>
        <nav className="sidebar-menu">
          {menuItems.map((item) => (
            <Link key={item.path} to={item.path} className={`menu-item ${location.pathname === item.path ? 'active' : ''}`}>
              <i>{item.icon}</i>
              <span>{item.name}</span>
            </Link>
          ))}
        </nav>
      </aside>

      <div className="main-content">
        <header className="top-header">
          <div className="header-left">
            <button className="icon-btn" onClick={() => setSidebarOpen(!sidebarOpen)}>
              <Menu size={24} />
            </button>
            <h2 style={{ margin: 0, fontSize: '1.2rem', color: '#334155' }}>
              {menuItems.find(i => i.path === location.pathname)?.name || 'Sistema TI'}
            </h2>
          </div>

          <div className="header-right">
            <button className="icon-btn" title="Tela Cheia" onClick={toggleFullScreen}>
              <Maximize size={20} />
            </button>
            
            <div className="notification-wrapper" style={{ position: 'relative' }}>
              <button className="icon-btn" onClick={() => setNotifOpen(!notifOpen)}>
                <Bell size={20} />
                {naoLidas > 0 && <span className="badge-dot"></span>}
              </button>

              {notifOpen && (
                <div className="notification-dropdown">
                  <div className="notif-header">
                    <strong>Notificações ({naoLidas})</strong>
                    <button onClick={() => setNotifOpen(false)}><X size={16} /></button>
                  </div>
                  <div className="notif-list">
                    {notificacoes.length === 0 ? (
                      <div className="notif-empty">Nenhuma notificação</div>
                    ) : (
                      notificacoes.map((notif) => (
                        <div 
                          key={notif.id} 
                          className={`notif-item ${!notif.lida ? 'unread' : ''}`}
                          onClick={() => handleClickNotif(notif)}
                        >
                          <div className="notif-title">{notif.titulo}</div>
                          <div className="notif-msg">{notif.mensagem}</div>
                          <div className="notif-time">{notif.data}</div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="user-menu-container">
              <button className="icon-btn" onClick={() => setMenuUserOpen(!menuUserOpen)}>
                <MoreVertical size={20} />
              </button>
              {menuUserOpen && (
                <div className="user-dropdown show">
                  <div className="dropdown-header">
                    <strong>Logado como:</strong><br/>
                    {user?.email}
                  </div>
                  <div className="dropdown-item danger" onClick={handleLogout}>
                    <LogOut size={20} /> Sair
                  </div>
                </div>
              )}
            </div>

          </div>
        </header>

        <main className="page-content">
          <Outlet /> 
        </main>

      </div>
    </div>
  );
}