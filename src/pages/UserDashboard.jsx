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
        
        <div style={{ padding: '20px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc' }}>
          <h2 style={{ margin: 0, color: '#1e293b', fontSize: '1.2rem' }}>Detalhes do Chamado</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none' }}><X size={24} /></button>
        </div>

        <div style={{ padding: '20px', overflowY: 'auto', flex: 1 }}>
          <div style={{ display: 'inline-block', padding: '5px 12px', borderRadius: '20px', backgroundColor: statusColor + '20', color: statusColor, fontWeight: 'bold', fontSize: '0.9rem', marginBottom: '20px' }}>
            {statusText}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.95rem', color: '#475569', marginBottom: '20px' }}>
            <p><strong>Tipo:</strong> {data.tipo}</p>
            {data.tipo === 'Abertura de Chamado' ? (
              <>
                <p><strong>Problema:</strong> {data.defeito_desc}</p>
                <p><strong>Local:</strong> {data.sala} - {data.setor}</p>
              </>
            ) : (
               <p><strong>Evento:</strong> {data.evento}</p>
            )}
             <p style={{fontSize: '0.8rem', color: '#94a3b8'}}>ID: #{String(data.id_sequencial).padStart(6, '0')}</p>
          </div>

          <hr style={{ border: '0', borderTop: '1px solid #e2e8f0', margin: '20px 0' }} />

          <h3 style={{ fontSize: '1rem', color: '#1e293b', marginBottom: '15px' }}>Interações</h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {/* Mensagem Legada (Se houver) */}
            {data.comentario_publico && (
               <div style={{ alignSelf: 'flex-start', background: '#eff6ff', padding: '10px', borderRadius: '0 10px 10px 10px', maxWidth: '85%', border: '1px solid #bfdbfe' }}>
                 <small style={{display:'block', color: '#3b82f6', fontSize: '0.75rem', fontWeight: 'bold'}}>TI (Mensagem Antiga)</small>
                 {data.comentario_publico}
               </div>
            )}

            {/* Histórico do Chat */}
            {historico.map((msg, idx) => (
              <div key={idx} style={{
                alignSelf: msg.autor === 'usuario' ? 'flex-end' : 'flex-start',
                background: msg.autor === 'usuario' ? '#dcfce7' : '#eff6ff',
                padding: '10px',
                borderRadius: msg.autor === 'usuario' ? '10px 0 10px 10px' : '0 10px 10px 10px',
                maxWidth: '85%',
                border: msg.autor === 'usuario' ? '1px solid #86efac' : '1px solid #bfdbfe'
              }}>
                <small style={{display:'block', color: msg.autor === 'usuario' ? '#166534' : '#3b82f6', fontSize: '0.75rem', fontWeight: 'bold'}}>
                  {msg.autor === 'usuario' ? 'Você' : 'Suporte TI'} - {msg.data}
                </small>
                {msg.texto}
              </div>
            ))}
            <div ref={chatEndRef} />
            
            {historico.length === 0 && !data.comentario_publico && (
              <p style={{ textAlign: 'center', color: '#94a3b8', fontSize: '0.9rem' }}>Nenhuma interação ainda.</p>
            )}
          </div>
        </div>

        {/* Área de Input */}
        <div style={{ padding: '15px', borderTop: '1px solid #e2e8f0', background: '#f8fafc' }}>
          {podeComentar ? (
            <div style={{ display: 'flex', gap: '10px' }}>
              <input 
                type="text" 
                value={novoComentario}
                onChange={(e) => setNovoComentario(e.target.value)}
                placeholder="Responder..."
                style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
              />
              <button 
                onClick={handleEnviarComentario}
                disabled={enviando || !novoComentario.trim()}
                style={{ background: '#3b82f6', color: 'white', border: 'none', padding: '0 20px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', opacity: enviando ? 0.7 : 1 }}
              >
                Enviar
              </button>
            </div>
          ) : (
            <div style={{ textAlign: 'center', color: '#64748b', fontSize: '0.9rem', padding: '10px', background: '#e2e8f0', borderRadius: '8px' }}>
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
  const [tab, setTab] = useState('pendentes'); 
  const [selectedItem, setSelectedItem] = useState(null);
  
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

  const todosItens = [...chamados, ...agendamentos].sort((a, b) => b.id_sequencial - a.id_sequencial);
  const listaExibida = todosItens.filter(item => tab === 'pendentes' ? !item.is_realizado : item.is_realizado);

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f3f2f2ff', paddingBottom: '80px' }}>
      
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
               <span style={{ fontSize: '0.8rem', color: '#64748b' }}>TI - Elisa Andreoli</span>
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
{/* BOTÕES DE AÇÃO (NOVO ESTILO) */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', borderTop: '1px solid #e7e7e7ff', paddingTop: '20px' }}>
          
          {/* Botão Chamado */}
          <button 
            onClick={() => navigate('/usuario/novo/chamado')} 
            style={{ 
              padding: '6px', 
              background: 'white', 
              color: '#202020ff', 
              border: 'none', 
              borderRadius: '8px', 
              display: 'flex', 
              flexDirection: 'row', /* Ícone ao lado */
              alignItems: 'center', 
              justifyContent: 'center', 
              gap: '2px', 
              fontWeight: '500',
              fontSize: '0.90rem',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)', /* Sombra bonita */
              cursor: 'pointer',
              transition: 'transform 0.1s'
            }}
            onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.98)'}
            onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            <div style={{ padding: '8px', borderRadius: '50%', display: 'flex' }}>
              <PlusCircle size={20} color="#073870ff" /> {/* Ícone azul */}
            </div>
            Novo Chamado
          </button>

          {/* Botão Agendar */}
          <button 
            onClick={() => navigate('/usuario/novo/agendamento')} 
            style={{ 
              padding: '6px', 
              background: 'white', 
              color: '#202020ff', 
              border: 'none', 
              borderRadius: '8px', 
              display: 'flex', 
              flexDirection: 'row',
              alignItems: 'center', 
              justifyContent: 'center', 
              gap: '2px', 
              fontWeight: '500',
              fontSize: '0.90rem',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
              cursor: 'pointer',
              transition: 'transform 0.1s'
            }}
            onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.98)'}
            onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            <div style={{ padding: '8px', borderRadius: '50%', display: 'flex' }}>
              <Calendar size={18} color="#073870ff" /> {/* Ícone verde */}
            </div>
            Agendamento
          </button>

        </div>
      </div>

      {/* LISTA DE ITENS */}
     <div style={{ padding: '0px' }}>
      {/* <div style={{ background: '#fff', display: 'flex', gap: '0px', marginBottom: '15px' }}>
        <button onClick={() => setTab('pendentes')} style={{ flex: 1, padding: '10px', borderRadius: '8px', border: 'none', background: tab === 'pendentes' ? '#1e293b' : '#ffffffff', color: tab === 'pendentes' ? 'white' : '#64748b', fontWeight: '600' }}>Em Aberto</button>
         <button onClick={() => setTab('resolvidos')} style={{ flex: 1, padding: '10px', borderRadius: '8px', border: 'none', background: tab === 'resolvidos' ? '#1e293b' : '#ffffffff', color: tab === 'resolvidos' ? 'white' : '#64748b', fontWeight: '600' }}>Resolvidos</button>
         </div> */}
        
<div style={{ 
  padding: '20px',
      display: 'flex',
      justifyContent: 'center'
 }}>
      {/* Container da chave deslizante */}
      <div
        onClick={() => setTab(tab === 'pendentes' ? 'resolvidos' : 'pendentes')}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          background: '#ddddddff',
          borderRadius: '9999px',
          padding: '4px',
          cursor: 'pointer',
          position: 'relative',
          width: '300px',
          height: '38px',
          transition: 'background 0.3s ease',
          userSelect: 'none',
        }}
      >
        {/* Fundo que muda de cor quando ativo (opcional) */}
        <div
          style={{
            position: 'absolute',
            top: '4px',
            left: tab === 'pendentes' ? '4px' : 'calc(50% + 4px)',
            width: 'calc(50% - 8px)',
            height: '38px',
            background: '#1e293b',
            borderRadius: '9999px',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
          }}
        />

        {/* Texto "Em Aberto" */}
        <span
          style={{
            flex: 1,
            textAlign: 'center',
            zIndex: 1,
            fontWeight: '600',
            fontSize: '14px',
            color: tab === 'pendentes' ? 'white' : '#64748b',
            transition: 'color 0.3s ease',
          }}
        >
          Em Aberto
        </span>

        {/* Texto "Resolvidos" */}
        <span
          style={{
            flex: 1,
            textAlign: 'center',
            zIndex: 1,
            fontWeight: '600',
            fontSize: '14px',
            color: tab === 'resolvidos' ? 'white' : '#64748b',
            transition: 'color 0.3s ease',
          }}
        >
          Resolvidos
        </span>
      </div>
    </div>


        

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '0 20px 0px 20px' }}>
          {listaExibida.map(item => (
            <div key={item.id} onClick={() => setSelectedItem(item)} style={{ background: 'white', padding: '15px', borderRadius: '10px', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}>
              <div>
                
                <div style={{ fontSize: '0.8rem', color: '#3f3f3fff' }}>
                   #{String(item.id_sequencial).padStart(6, '0')} • {item.data_abertura.split(' ')[0]}
                </div>
                <div style={{ fontSize: '0.85rem', fontWeight: 'bold', color: item.tipo === 'Abertura de Chamado' ? '#3b82f6' : '#10b981', marginBottom: '4px' }}>
                   {item.tipo === 'Abertura de Chamado' ? 'Chamado' : 'Agendamento'}
                </div>
                <div style={{ fontWeight: '600', color: '#334155', marginBottom: '2px' }}>
                  {item.tipo === 'Abertura de Chamado' 
                    ? (item.defeito_desc ? item.defeito_desc.substring(0, 30) + '...' : 'Sem descrição')
                    : (item.evento || 'Evento')}
                </div>
                
              </div>
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: item.is_realizado ? '#22c55e' : '#f59e0b' }}></div>
            </div>
          ))}
          {listaExibida.length === 0 && <div style={{ textAlign: 'center', padding: '40px 0', color: '#94a3b8' }}>Nenhum item aqui.</div>}
        </div>
      </div>

      <UserDetailModal isOpen={!!selectedItem} onClose={() => setSelectedItem(null)} data={selectedItem} />
    </div>
  );
}