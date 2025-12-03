import { useState } from 'react';
import { getFirestore, collection, addDoc, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { app } from '../firebaseConfig';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Loader, Check, ArrowLeftCircle, CheckCircle, CheckCircle2, CheckCircleIcon } from 'lucide-react';
import { enviarNotificacao } from '../utils/notificacoes';

const EQUIPAMENTOS_OPCOES = [
  "Bluetooth/Mixer",
  "1 Caixa de som",
  "2 Caixas de som",
  "Caixa de som JBL",
  "Mesa de Som",
  "Chromebook",
  "Computador",
  "Microfone Coral",
  "Microfone com fio",
  "Microfone sem fio",
  "PenDrive com músicas",
  "Projetor",
  "Televisão",
  "Telão",
  "Outros"
];

export default function NovoAgendamentoUser() {
  const [loading, setLoading] = useState(false);
  const [descFocused, setDescFocused] = useState(false);
  
  // Estado separado para equipamentos (array)
  const [equipamentosSelecionados, setEquipamentosSelecionados] = useState([]);
  
  const [formData, setFormData] = useState({
    evento: '', local: '', data: '', hora: '', comentario: ''
  });

  const navigate = useNavigate();
  const auth = getAuth(app);
  const db = getFirestore(app);

  // Lógica para selecionar/desmarcar equipamentos
  const toggleEquipamento = (item) => {
    if (equipamentosSelecionados.includes(item)) {
      setEquipamentosSelecionados(prev => prev.filter(i => i !== item));
    } else {
      setEquipamentosSelecionados(prev => [...prev, item]);
    }
  };

  const getNextId = async () => {
    const q = query(collection(db, "agendamentos"), orderBy("id_sequencial", "desc"), limit(1));
    const snapshot = await getDocs(q);
    return !snapshot.empty ? snapshot.docs[0].data().id_sequencial + 1 : 1;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (equipamentosSelecionados.length === 0) {
      alert("Por favor, selecione pelo menos um equipamento.");
      return;
    }

    setLoading(true);

    try {
      const user = auth.currentUser;
      const nextId = await getNextId();
      const now = new Date();
      const dataAbertura = now.toLocaleString('pt-BR');

      const [ano, mes, dia] = formData.data.split('-');
      const dataUsoBR = `${dia}/${mes}/${ano}`;

      // Transforma o array de equipamentos em uma string separada por vírgula
      const equipamentosString = equipamentosSelecionados.join(', ');

      await addDoc(collection(db, "agendamentos"), {
        id_sequencial: nextId,
        tipo: "Agendar uso de Equipamento",
        data_abertura: dataAbertura,
        
        nome: user.displayName || "Usuário",
        email: user.email,
        solicitante: user.displayName || "Usuário",

        evento: formData.evento,
        local: formData.local,
        data_uso: dataUsoBR,
        hora_uso: formData.hora,
        
        equipamentos: equipamentosString, // Salva a lista formatada
        observacao: formData.comentario,  // Salva o comentário do usuário
        
        is_realizado: false,
        realizado_em: "",
        is_devolvido: false,
        devolvido_em: "",
        parecer: "" // Campo vazio, uso exclusivo da gestão
      });

      await enviarNotificacao(
  "ADMIN", 
  "Novo Agendamento", 
  `${user.displayName} agendou ${formData.evento} para ${formData.data}`,
  "/agendamentos"
);

      alert("Agendamento realizado com sucesso!");
      navigate('/usuario');

    } catch (error) {
      console.error(error);
      alert("Erro ao agendar.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f7f7f7ff', padding: '20px', borderTop: '4px solid #062141ff', borderRadius: '18px',}}>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px', gap: '10px' }}>
        <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
          <ArrowLeftCircle size={26} color="#1e293b" />
        </button>
        <h1 style={{ margin: 0, fontSize: '1.2rem', color: '#1e293b' }}>Novo Agendamento</h1>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        
        <div>
          <label style={labelStyle}>Nome do Evento / Aula</label>
          <input required type="text" placeholder="" 
            value={formData.evento} onChange={(e) => setFormData({...formData, evento: e.target.value})}
            style={inputStyle} />
        </div>

        <div>
          <label style={labelStyle}>Local</label>
          <input required type="text" placeholder=" " 
            value={formData.local} onChange={(e) => setFormData({...formData, local: e.target.value})}
            style={inputStyle} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
          <div>
            <label style={labelStyle}>Data de Uso</label>
            <input required type="date" 
              value={formData.data} onChange={(e) => setFormData({...formData, data: e.target.value})}
              style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Hora</label>
            <input required type="time" 
              value={formData.hora} onChange={(e) => setFormData({...formData, hora: e.target.value})}
              style={inputStyle} />
          </div>
        </div>

        {/* SELEÇÃO MÚLTIPLA DE EQUIPAMENTOS */}
        <div>
          <label style={labelStyle}>Equipamentos Necessários (Selecione)</label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            {EQUIPAMENTOS_OPCOES.map(item => {
              const isSelected = equipamentosSelecionados.includes(item);
              return (
                <button
                  key={item}
                  type="button"
                  onClick={() => toggleEquipamento(item)}
                  style={{
                    padding: '12px',
                    borderRadius: '8px',
                    border: isSelected ? '2px solid #062141ff' : '1px solid #cbd2e1ff',
                    backgroundColor: isSelected ? '#ecf3fdff' : 'white',
                    color: isSelected ? '#062141ff' : '#64748b',
                    fontWeight: isSelected ? '500' : '400',
                    cursor: 'pointer',
                    textAlign: 'left',
                    fontSize: '0.8rem',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                  }}
                >
                  {item}
                  {isSelected && <CheckCircle size={14} />}
                </button>
              )
            })}
          </div>
        </div>

        <div>
          <label style={labelStyle}>Comentário / Observação (Opcional)</label>
          <textarea
            placeholder="Algum detalhe extra?"
            rows="3"
            value={formData.comentario}
            onChange={(e) => setFormData({...formData, comentario: e.target.value})}
            onFocus={() => setDescFocused(true)}
            onBlur={() => setDescFocused(false)}
            style={{...inputStyle, resize: 'vertical', border: descFocused ? '1px solid #062141ff' : inputStyle.border, boxShadow: descFocused ? '0 0 0 3px rgba(6,33,65,0.15)' : 'none'}}
          />
        </div>

        <button type="submit" disabled={loading} style={{ padding: '15px', background: '#062141ff', color: 'white', border: 'none', borderRadius: '10px', fontSize: '1rem', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginTop: '10px' }}>
          {loading ? <Loader className="spin" /> : <><Save size={20} /> Confirmar Agendamento</>}
        </button>

      </form>
    </div>
  );
}

const labelStyle = { display: 'block', marginBottom: '5px', color: '#202020ff', fontSize: '0.9rem' };
const inputStyle = { width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '1rem', backgroundColor: 'white', boxSizing: 'border-box' };