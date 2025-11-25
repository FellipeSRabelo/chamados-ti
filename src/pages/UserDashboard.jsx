import { useState, useEffect } from 'react';
import { 
  getFirestore, 
  collection, 
  query, 
  where, 
  onSnapshot, 
  doc, 
  updateDoc, 
  arrayUnion 
} from 'firebase/firestore';
import { getAuth, signOut } from 'firebase/auth';
import { app } from '../firebaseConfig';
import { useNavigate } from 'react-router-dom';
import { Calendar, LogOut, Ticket, X } from 'lucide-react';
import { enviarNotificacao } from '../utils/notificacoes';

// --- MODAL DE DETALHES (ATUALIZADO COM CHAT) ---
function UserDetailModal({ isOpen, onClose, data }) {
  const [novoComentario, setNovoComentario] = useState('');
  const [enviando, setEnviando] = useState(false);
  const db = getFirestore(app);

  if (!isOpen || !data) return null;
  
  const statusColor = data.is_realizado ? '#22c55e' : '#f59e0b';
  const statusText = data.is_realizado ? 'Resolvido / Finalizado' : 'Pendente / Em Análise';

  // Verifica quem mandou a última mensagem para aplicar a regra antispam
  const historico = data.historico_conversa || [];
  const ultimaMensagem = historico.length > 0 ? historico[historico.length - 1] : null;
  
  // A regra: Só pode comentar se não houver histórico (primeira msg extra) 
  // OU se a última mensagem for do "admin".
  // Se a última foi do "usuario", bloqueia.
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

      // Adiciona ao array no Firestore
      await updateDoc(chamadoRef, {
        historico_conversa: arrayUnion(novaMensagem)
      });

      await enviarNotificacao(
  "ADMIN", 
  "Nova Mensagem", 
  `Comentário no chamado #${data.id_sequencial}`,
  `/chamados?id=${data.id_sequencial}` // <--- MUDANÇA AQUI: Adicionamos ?id=...
);
      
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
        
        {/* Cabeçalho do Modal */}
        <div style={{ padding: '20px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc' }}>
          <h2 style={{ margin: 0, color: '#1e293b', fontSize: '1.2rem' }}>Detalhes do Chamado</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none' }}><X size={24} /></button>
        </div>

        {/* Corpo com Rolagem */}
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

          {/* ÁREA DE CHAT / HISTÓRICO */}
          <h3 style={{ fontSize: '1rem', color: '#1e293b', marginBottom: '15px' }}>Interações</h3>
          
          {/* Mensagem inicial automática (opcional, para contexto) */}
          {/* <div style={{ marginBottom: '10px', padding: '10px', background: '#f1f5f9', borderRadius: '8px 8px 8px 0', alignSelf: 'flex-start', width: 'fit-content' }}>
             <small style={{display:'block', color: '#64748b', fontSize: '0.7rem'}}>Sistema</small>
             Chamado aberto.
          </div> */}

          {/* Renderiza o histórico */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            
            {/* Mostra o Parecer/Comentário Antigo (Legado) se existir */}
            {data.comentario_publico && (
               <div style={{ alignSelf: 'flex-start', background: '#eff6ff', padding: '10px', borderRadius: '0 10px 10px 10px', maxWidth: '85%', border: '1px solid #bfdbfe' }}>
                 <small style={{display:'block', color: '#3b82f6', fontSize: '0.75rem', fontWeight: 'bold'}}>TI (Mensagem Antiga)</small>
                 {data.comentario_publico}
               </div>
            )}

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
            
            {historico.length === 0 && !data.comentario_publico && (
              <p style={{ textAlign: 'center', color: '#94a3b8', fontSize: '0.9rem' }}>Nenhuma interação ainda.</p>
            )}
          </div>

        </div>

        {/* Área de Input (Rodapé) */}
        <div style={{ padding: '15px', borderTop: '1px solid #e2e8f0', background: '#f8fafc' }}>
          {podeComentar ? (
            <div style={{ display: 'flex', gap: '10px' }}>
              <input 
                type="text" 
                value={novoComentario}
                onChange={(e) => setNovoComentario(e.target.value)}
                placeholder="Adicionar comentário..."
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
              ⏳ Aguarde a resposta do suporte para enviar nova mensagem.
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
  
  const auth = getAuth(app);
  const user = auth.currentUser;
  const db = getFirestore(app);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) { navigate('/login'); return; }

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

  const todosItens = [...chamados, ...agendamentos].sort((a, b) => b.id_sequencial - a.id_sequencial);
  const listaExibida = todosItens.filter(item => tab === 'pendentes' ? !item.is_realizado : item.is_realizado);

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc', paddingBottom: '80px' }}>
      
      <div style={{ background: 'white', padding: '20px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
           <div>
             <h1 style={{ margin: 0, fontSize: '1.3rem', color: '#1e293b' }}>Olá, {user?.displayName?.split(' ')[0] || 'Colaborador'}!</h1>
             <span style={{ fontSize: '0.9rem', color: '#64748b' }}>Painel de Solicitações</span>
           </div>
           <button onClick={() => signOut(auth).then(()=>navigate('/login'))} style={{ background: 'none', border: 'none', color: '#ef4444' }}><LogOut /></button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
          <button onClick={() => navigate('/usuario/novo/chamado')} style={{ padding: '15px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '10px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', fontWeight: '600' }}>
            <Ticket size={24} /> Abrir Chamado
          </button>
          <button onClick={() => navigate('/usuario/novo/agendamento')} style={{ padding: '15px', background: '#10b981', color: 'white', border: 'none', borderRadius: '10px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', fontWeight: '600' }}>
            <Calendar size={24} /> Agendar
          </button>
        </div>
      </div>

      <div style={{ padding: '20px' }}>
        
        <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
          <button onClick={() => setTab('pendentes')} style={{ flex: 1, padding: '10px', borderRadius: '8px', border: 'none', background: tab === 'pendentes' ? '#1e293b' : '#e2e8f0', color: tab === 'pendentes' ? 'white' : '#64748b', fontWeight: '600' }}>Em Aberto</button>
          <button onClick={() => setTab('resolvidos')} style={{ flex: 1, padding: '10px', borderRadius: '8px', border: 'none', background: tab === 'resolvidos' ? '#1e293b' : '#e2e8f0', color: tab === 'resolvidos' ? 'white' : '#64748b', fontWeight: '600' }}>Resolvidos</button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {listaExibida.map(item => (
            <div key={item.id} onClick={() => setSelectedItem(item)} style={{ background: 'white', padding: '15px', borderRadius: '10px', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}>
              <div>
                <div style={{ fontSize: '0.85rem', fontWeight: 'bold', color: item.tipo === 'Abertura de Chamado' ? '#3b82f6' : '#10b981', marginBottom: '4px' }}>
                   {item.tipo === 'Abertura de Chamado' ? 'Chamado TI' : 'Agendamento'}
                </div>
                <div style={{ fontWeight: '600', color: '#334155', marginBottom: '2px' }}>
                  {item.tipo === 'Abertura de Chamado' 
                    ? (item.defeito_desc ? item.defeito_desc.substring(0, 30) + '...' : 'Sem descrição')
                    : (item.evento || 'Evento')}
                </div>
                <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                   #{String(item.id_sequencial).padStart(6, '0')} • {item.data_abertura.split(' ')[0]}
                </div>
              </div>
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: item.is_realizado ? '#22c55e' : '#f59e0b' }}></div>
            </div>
          ))}
          
          {listaExibida.length === 0 && (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#94a3b8' }}>Nenhum item aqui.</div>
          )}
        </div>
      </div>

      <UserDetailModal isOpen={!!selectedItem} onClose={() => setSelectedItem(null)} data={selectedItem} />
    </div>
  );
}