import { useState, useEffect, useRef } from 'react';
import { 
  getFirestore, 
  collection, 
  query, 
  where, 
  onSnapshot, 
  doc, 
  updateDoc, 
  arrayUnion, 
  orderBy, 
  limit 
} from 'firebase/firestore';
import { getAuth, signOut } from 'firebase/auth';
import { app } from '../firebaseConfig';
import { useNavigate } from 'react-router-dom';
import { Calendar, LogOut, Ticket, X, Bell, PlusCircle } from 'lucide-react';
import { enviarNotificacao } from '../utils/notificacoes';
import { requestNotificationPermission } from '../utils/pushNotification'; // <--- IMPORTANTE
import '../components/Layout.css'; // Estilos do sino
import ChamadosView from './ChamadosView';
import AgendamentosView from './AgendamentosView';

// --- MODAL DE DETALHES (COM CHAT E REGRAS) ---
function UserDetailModal({ isOpen, onClose, data }) {
  const [novoComentario, setNovoComentario] = useState('');
  const [enviando, setEnviando] = useState(false);
  const chatEndRef = useRef(null); // Para rolar o chat
  const db = getFirestore(app);

  // Rola para baixo quando abre ou chega mensagem nova
  useEffect(() => {
    if (isOpen && chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [isOpen, data?.historico_conversa]);

  if (!isOpen || !data) return null;
  
  const statusColor = data.is_realizado ? '#22c55e' : '#f59e0b';
  const statusText = data.is_realizado ? 'Resolvido / Finalizado' : 'Pendente / Em Análise';

  // Regra Anti-Spam
  const historico = data.historico_conversa || [];
  const ultimaMensagem = historico.length > 0 ? historico[historico.length - 1] : null;
  const podeComentar = !ultimaMensagem || ultimaMensagem.autor === 'admin';

  const handleEnviarComentario = async () => {
    if (!novoComentario.trim()) return;
    setEnviando(true);

    try {
      const chamadoRef = doc(db, "chamados", data.id);
      const novaMensagem = {
        autor: 'usuario',
        texto: novoComentario,
        data: new Date().toLocaleString('pt-BR')
      };

      // 1. Salva no Banco
      await updateDoc(chamadoRef, {
        historico_conversa: arrayUnion(novaMensagem)
      });

      // 2. Notifica o Admin (Com o link correto)
      await enviarNotificacao(
        "ADMIN", 
        "Nova Mensagem do Usuário", 
        `Comentário no chamado #${data.id_sequencial}`,
        `/chamados?id=${data.id_sequencial}`
      );
      
      // 3. Atualização Visual Imediata
      setNovoComentario('');
      data.historico_conversa = [...(data.historico_conversa || []), novaMensagem];

    } catch (error) {
      console.error("Erro ao comentar:", error);
      alert("Erro ao enviar comentário.");
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 999,
      backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
    }} onClick={onClose}>
      <div style={{
        background: 'white', borderRadius: '15px', width: '100%', maxWidth: '500px',
        maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden'
      }} onClick={(e) => e.stopPropagation()}>
        
        <div style={{ padding: '10px', borderBottom: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '5px', background: '#f8fafc' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ margin: 0, color: '#1e293b', fontSize: '1.2rem' }}>Detalhes do Chamado</h2>
            <button onClick={onClose} style={{ background: 'none', border: 'none' }}><X size={20} /></button>
          </div>
          <div style={{ display: 'flex', alignItems: 'left' }}>
          <p style={{ margin: 0, color: '#3d3d3dff', fontSize: '0.8rem' }}>Nº {String(data.id_sequencial).padStart(6, '0')}</p>
          <p style={{ marginLeft: '15px', marginTop: 0, marginBottom: 0, color: '#3d3d3dff', fontSize: '0.8rem' }}> {String(data.data_abertura).padStart(6, '0')}</p>
        </div>
        </div>


        <div style={{ padding: '15px', overflowY: 'auto', flex: 1, background: '#fff' }}>
          <div style={{ display: 'inline-block', padding: '5px 10px', borderRadius: '20px', backgroundColor: statusColor + '20', color: statusColor, fontWeight: 'bold', fontSize: '0.9rem', marginBottom: '20px' }}>
            {statusText}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.95rem', color: '#475569', marginBottom: '5px' }}>
            <p style={{ margin: '0' }}><strong>Tipo:</strong> {data.tipo}</p>
            {data.tipo === 'Abertura de Chamado' ? (
              <>
                <p style={{ margin: '0' }}><strong>Problema:</strong> {data.defeito_desc}</p>
                <p style={{ margin: '0' }}><strong>Local:</strong> {data.sala} - {data.setor}</p>
              </>
            ) : (
               <p style={{ margin: '0' }}><strong>Evento:</strong> {data.evento}</p>
            )}
          </div></div>
        <div style={{ padding: '10px', overflowY: 'auto', flex: 1, background: '#f3f2edff' }}>
  
            {/*<hr style={{ border: '0', borderTop: '1px solid #e2e8f0', margin: '20px 0' }} />*/}

          <h3 style={{ fontSize: '1rem', color: '#1e293b', marginBottom: '15px' }}>Suporte:</h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {/* Mensagem Legada (Se houver) */}
            {data.comentario_publico && (
               <div style={{ alignSelf: 'flex-start', background: '#ffffff', padding: '8px 12px', borderRadius: '10px 10px 10px 0', maxWidth: '85%', boxShadow: '0 1px 0.5px rgba(0,0,0,0.13)', lineHeight: '1.3' }}>
                 <small style={{display:'block', color: '#333', fontSize: '0.75rem', fontWeight: 'bold', marginBottom: '3px'}}>TI (Mensagem Antiga)</small>
                 {data.comentario_publico}
               </div>
            )}

            {/* Histórico do Chat */}
            {historico.map((msg, idx) => (
              <div key={idx} style={{
                alignSelf: msg.autor === 'usuario' ? 'flex-end' : 'flex-start',
                background: msg.autor === 'usuario' ? '#d1fae0ff' : '#ffffff',
                padding: '8px 12px',
                borderRadius: msg.autor === 'usuario' ? '10px 10px 0 10px' : '10px 10px 10px 0',
                maxWidth: '85%',
                boxShadow: '2px 2px 4px rgba(0,0,0,0.18)',
                lineHeight: '1.3',
              }}>
                <small style={{display:'block', color: msg.autor === 'usuario' ? '#1d1d1dff' : '#252525ff', fontSize: '0.75rem', fontWeight: 'bold', marginBottom: '3px'}}>
                  {msg.autor === 'usuario' ? 'Você' : 'Suporte TI'} - {msg.data}
                </small>
                <div style={{ wordWrap: 'break-word' }}>{msg.texto}</div>
              </div>
            ))}
            <div ref={chatEndRef} />
            
            {historico.length === 0 && !data.comentario_publico && (
              <p style={{ textAlign: 'center', color: '#bac4d3ff', fontSize: '0.9rem' }}>Nenhuma interação ainda.</p>
            )}
          </div>
        </div>

        {/* Área de Input */}
        <div style={{ padding: '12px 15px', borderTop: '1px solid #e2e8f0', background: '#f8fafc', display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
          {podeComentar ? (
            <>
              <input 
                type="text" 
                value={novoComentario}
                onChange={(e) => setNovoComentario(e.target.value)}
                placeholder="Escrever mensagem..."
                style={{ flex: 1, padding: '10px 15px', borderRadius: '20px', border: '1px solid #cbd5e1', background: '#ffffff', fontSize: '0.95rem', outline: 'none', fontFamily: 'inherit' }}
              />
              <button 
                onClick={handleEnviarComentario}
                disabled={enviando || !novoComentario.trim()}
                style={{ 
                  background: novoComentario.trim() ? '#128c7e' : '#ccc', 
                  color: 'white', 
                  border: 'none', 
                  padding: '8px 12px', 
                  borderRadius: '50%', 
                  fontWeight: 'bold', 
                  cursor: novoComentario.trim() ? 'pointer' : 'not-allowed', 
                  opacity: enviando ? 0.7 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '36px',
                  height: '36px',
                  fontSize: '18px'
                }}
              >
                ➤
              </button>
            </>
          ) : (
            <div style={{ textAlign: 'center', color: '#64748b', fontSize: '0.9rem', padding: '10px', background: '#e2e8f0', borderRadius: '8px', width: '100%' }}>
              ⏳ Aguarde a resposta do suporte.
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

// --- PÁGINA PRINCIPAL ---
export default function UserDashboard() {
  const [chamados, setChamados] = useState([]);
  const [agendamentos, setAgendamentos] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [currentView, setCurrentView] = useState('chamados'); // 'chamados' ou 'agendamentos'
  
  // Estados de Notificação
  const [notifOpen, setNotifOpen] = useState(false);
  const [notificacoes, setNotificacoes] = useState([]);
  
  const auth = getAuth(app);
  const user = auth.currentUser;
  const db = getFirestore(app);
  const navigate = useNavigate();

  // 1. Busca Dados Principais
  useEffect(() => {
    if (!user) { navigate('/login'); return; }

    // >>> AQUI ESTÁ A LINHA QUE FALTAVA <<<
    requestNotificationPermission(user.email);

    const qChamados = query(collection(db, "chamados"), where("email", "==", user.email));
    const qAgendamentos = query(collection(db, "agendamentos"), where("email", "==", user.email));

    const unsub1 = onSnapshot(qChamados, (snap) => {
      setChamados(snap.docs.map(d => ({ id: d.id, ...d.data(), tipo: 'Abertura de Chamado' })));
    });
    const unsub2 = onSnapshot(qAgendamentos, (snap) => {
      setAgendamentos(snap.docs.map(d => ({ id: d.id, ...d.data(), tipo: 'Agendar uso de Equipamento' })));
    });

    return () => { unsub1(); unsub2(); };
  }, [user]);

  // 2. Busca Notificações
  useEffect(() => {
    if (!user) return;
    const q = query(
        collection(db, "notificacoes"), 
        where("para", "==", user.email), 
        orderBy("timestamp", "desc"),
        limit(10)
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
        const lista = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setNotificacoes(lista);
    });
    return () => unsubscribe();
  }, [user]);

  // Lógica de Notificações
  const naoLidas = notificacoes.filter(n => !n.lida).length;
  const handleClickNotif = async (notificacao) => {
    if (!notificacao.lida) {
      await updateDoc(doc(db, "notificacoes", notificacao.id), { lida: true });
    }
    setNotifOpen(false);
    if (notificacao.link) {
        // Se tiver link específico, pode tratar aqui (ex: abrir modal se estiver na lista)
    }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f3f2f2ff', paddingBottom: '80px', paddingTop: '10px' }}>
      
      {/* LOGO DA ESCOLA */}
    {/*<div style={{ display: 'flex', justifyContent: 'center' }}>
      <img 
        src="https://elisaandreoli.com.br/wp-content/uploads/2023/08/logomarca_cea_sem_fundo-1024x367.png" 
        alt="Logomarca da Escola" 
        style={{ maxWidth: '80px', height: 'auto' }}
      />
    </div>*/}


      {/* HEADER MOBILE */}
      <div style={{ background: '#f3f2f2ff', padding: '10px', paddingTop: '20px', position: 'sticky', top: 0, zIndex: 10 }}>


        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
           
           {/* ÁREA DO USUÁRIO (COM FOTO) */}
           <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
             {/* Se tiver foto, mostra. Se não, mostra um ícone padrão ou nada */}
             {user?.photoURL ? (
               <img 
                 src={user.photoURL} 
                 alt="Perfil" 
                 referrerPolicy="no-referrer" // <--- O SEGREDINHO ESTÁ AQUI
                 style={{ width: '45px', height: '45px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #e2e8f0' }} 
               />
             ) : (
               // Opcional: Um círculo com a inicial se não tiver foto
               <div style={{ width: '45px', height: '45px', borderRadius: '50%', background: '#3b82f6', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '1.2rem' }}>
                 {user?.displayName?.charAt(0) || 'U'}
               </div>
             )}
             
             <div>
               <h1 style={{ margin: 0, fontSize: '1.2rem', color: '#1e293b', lineHeight: '1.2' }}>
                 Olá, {user?.displayName?.split(' ')[0] || 'Colaborador'}!
               </h1>
               <span style={{ fontSize: '0.8rem', color: '#3c434dff' }}>TI - Elisa Andreoli</span>
             
             
             
             </div>
           </div>
           
           <div style={{display: 'flex', alignItems: 'center', gap: '15px' }}>
               {/* SINO DE NOTIFICAÇÕES (MANTENHA IGUAL) */}
               <div className="notification-wrapper" style={{ position: 'relative' }}>
                  <button className="icon-btn" onClick={() => setNotifOpen(!notifOpen)} style={{background: 'none', border: 'none', cursor: 'pointer'}}>
                    <Bell size={24} color="#313131ff" />
                    {naoLidas > 0 && <span className="badge-dot"></span>}
                  </button>
                  {notifOpen && (
                    <div className="notification-dropdown" style={{right: '-10px', width: '280px'}}>
                      {/* ... (conteúdo do dropdown mantém igual) ... */}
                      <div className="notif-header">
                        <strong>Notificações ({naoLidas})</strong>
                        <button onClick={() => setNotifOpen(false)}><X size={16} /></button>
                      </div>
                      <div className="notif-list">
                        {notificacoes.length === 0 ? (
                          <div className="notif-empty">Nenhuma notificação</div>
                        ) : (
                          notificacoes.map((notif) => (
                            <div key={notif.id} className={`notif-item ${!notif.lida ? 'unread' : ''}`} onClick={() => handleClickNotif(notif)}>
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

               <button onClick={() => signOut(auth).then(()=>navigate('/login'))} style={{ background: 'none', border: 'none', color: '#2b2b2bff' }}><LogOut /></button>
           </div>
        </div>

        {/* Botões de navegação Chamados/Agendamentos */}
        <div style={{ display: 'flex', gap: '10px', padding: '0 20px', marginTop: '15px' }}>
          <button
            onClick={() => setCurrentView('chamados')}
            style={{
              flex: 1,
              padding: '12px',
              background: currentView === 'chamados' ? '#073870ff' : 'white',
              color: currentView === 'chamados' ? 'white' : '#64748b',
              border: 'none',
              borderRadius: '10px',
              fontWeight: '600',
              fontSize: '0.95rem',
              cursor: 'pointer',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              transition: 'all 0.2s'
            }}
          >
            Chamados
          </button>
          <button
            onClick={() => setCurrentView('agendamentos')}
            style={{
              flex: 1,
              padding: '12px',
              background: currentView === 'agendamentos' ? '#073870ff' : 'white',
              color: currentView === 'agendamentos' ? 'white' : '#64748b',
              border: 'none',
              borderRadius: '10px',
              fontWeight: '600',
              fontSize: '0.95rem',
              cursor: 'pointer',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              transition: 'all 0.2s'
            }}
          >
            Agendamentos
          </button>
        </div>
      </div>

      {/* Renderização das views separadas */}
      {currentView === 'chamados' ? (
        <ChamadosView 
          chamados={chamados}
          setSelectedItem={setSelectedItem}
          navigate={navigate}
        />
      ) : (
        <AgendamentosView 
          agendamentos={agendamentos}
          setSelectedItem={setSelectedItem}
          navigate={navigate}
        />
      )}

      {/* Modal de detalhes */}
      <UserDetailModal isOpen={!!selectedItem} onClose={() => setSelectedItem(null)} data={selectedItem} />
    </div>
  );
}