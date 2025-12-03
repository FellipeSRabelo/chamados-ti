import { useState, useEffect } from 'react';
import { getFirestore, collection, addDoc, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { app } from '../firebaseConfig';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Camera, Save, Loader, MapPin, Building2, ArrowLeftCircle, Image } from 'lucide-react';
import { enviarNotificacao } from '../utils/notificacoes';

// --- LISTAS DE OPÇÕES ---
const SETORES = [
  "Assistente Direção", "Assistente Social", "Biblioteca", "Capela", "Cobrança",
  "Coord. Bilíngue", "Coord Esporte", "Coord. Infantil", "Coord. SOR", "Coord SOD",
  "Coord Fund 1", "Coord Fund 2", "Coord Ensino Médio", "Direção Geral", "Direção Pedagógica",
  "Financeiro", "Ginásio", "Inspetor Auditório", "Inspetor Ensino Médio",
  "Inspetor Infantil", "Inspetor Integral", "Inspetor Térreno", "Inspetor 2º Andar",
  "Laboratório", "Marketing", "Matrículas", "Mecanografia", "Monitoramento",
  "Porta Giratória", "Portal", "Planejamento", "Psicologia Alunos", "Psicopedagogia",
  "Psicologa", "Quadras", "Quiosque", "Recepção", "Redação", "RH",
  "Sala de Reunião", "Sala Professores", "Secretaria",
  "Supervisão 2001A", "Supervisão 2001B", "Torniquetes", "Uniforme"
].sort();

const SALAS = [
  "1020", "1101", "1102", "1103", "1104", "1105", "1108", "1109", "1110", "1111",
  "1202", "1203", "1204", "1205", "1206", "1209", "1210", "1211", "1212",
  "2002", "2003", "2004", "2005", "2006", "2007",
  "3101 Auditório", "3102", "3103", "3104 - A",
  "3201", "3202", "3203", "3204", "3205", "3206",
  "4001", "4002", "4003", "4101", "4102", "4103",
  "7101", "7102", "7103",
  "Integral 1", "Integral 2", "MindMaker"
];

const TIPOS_OCORRENCIA = ["Relatar Problema", "Situação de Emergência", "Sugestão", "Precaução"];

export default function NovoChamadoUser() {
  const [loading, setLoading] = useState(false);
  const [tipoLocal, setTipoLocal] = useState('sala');

  const [formData, setFormData] = useState({
    setor: '', 
    sala: SALAS[0],
    equipamento: 'Computador', 
    problema: '',
    ocorrencia: 'Relatar Problema'
  });
  
  const [foto, setFoto] = useState(null);

  const navigate = useNavigate();
  const auth = getAuth(app);
  const db = getFirestore(app);
  const storage = getStorage(app);

  useEffect(() => {
    if (tipoLocal === 'sala') {
      setFormData(prev => ({ ...prev, setor: 'Sala de Aula' }));
    } else {
      setFormData(prev => ({ ...prev, sala: 'N/A', setor: SETORES[0] }));
    }
  }, [tipoLocal]);

  const getNextId = async () => {
    const q = query(collection(db, "chamados"), orderBy("id_sequencial", "desc"), limit(1));
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      return snapshot.docs[0].data().id_sequencial + 1;
    }
    return 1;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const user = auth.currentUser;
      const nextId = await getNextId();
      const now = new Date();
      const dataFormatada = now.toLocaleString('pt-BR');

      let fotoUrl = "";

      if (foto) {
        const storageRef = ref(storage, `evidencias/${user.email}_${Date.now()}`);
        await uploadBytes(storageRef, foto);
        fotoUrl = await getDownloadURL(storageRef);
      }

      // Define qual local mostrar na notificação
      const localReal = tipoLocal === 'sala' ? `Sala ${formData.sala}` : formData.setor;

      await addDoc(collection(db, "chamados"), {
        id_sequencial: nextId,
        tipo: "Abertura de Chamado",
        data_abertura: dataFormatada,
        
        nome: user.displayName || "Usuário",
        email: user.email,
        solicitante: user.displayName || "Usuário",

        setor: formData.setor,
        sala: formData.sala,
        equipamento_defeito: formData.equipamento,
        defeito_desc: formData.problema,
        ocorrencia: formData.ocorrencia,
        
        foto_url: fotoUrl,
        
        is_realizado: false,
        realizado_em: "",
        parecer: "",
        foto_parecer: ""
      });

      // NOTIFICAÇÃO CORRIGIDA
      await enviarNotificacao(
        "ADMIN", 
        `Novo Chamado #${nextId}`, 
        `${user.displayName || 'Alguém'} relatou um problema em: ${localReal}`,
        `/chamados?id=${nextId}` // <--- MUDANÇA AQUI
      );

      alert("Chamado aberto com sucesso!");
      navigate('/usuario');

    } catch (error) {
      console.error(error);
      alert("Erro ao abrir chamado. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
        <div style={{ minHeight: '100vh', backgroundColor: '#062141ff' }}>

    <div style={{ minHeight: '100vh', backgroundColor: '#f7f7f7ff', padding: '20px', borderRadius: '18px', borderTop: '4px solid #062141ff' }}>
      
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px', gap: '10px' }}>
        <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', cursor: 'pointer'  }}>
          <ArrowLeftCircle size={26} color="#1e293b" />
        </button>
        <h1 style={{ margin: 0, fontSize: '1.2rem', color: '#1e293b' }}>Novo Chamado</h1>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        
        {/* Tipo de Ocorrência */}
        <div>
          <label style={labelStyle}>Tipo de Ocorrência</label>
          <select 
            style={{...inputStyle, fontWeight: 'bold', color: formData.ocorrencia === 'Situação de Emergência' ? '#dc2626' : '#334155'}} 
            value={formData.ocorrencia} 
            onChange={(e) => setFormData({...formData, ocorrencia: e.target.value})}
          >
            {TIPOS_OCORRENCIA.map(tipo => (
              <option key={tipo} value={tipo}>{tipo}</option>
            ))}
          </select>
        </div>

        {/* Seleção de Local */}
        <div>
          <label style={labelStyle}></label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <button
              type="button"
              onClick={() => setTipoLocal('sala')}
              style={{
                padding: '12px',
                borderRadius: '6px',
                background: 'white',
                color: '#202020ff',
                border: 'none',
                fontWeight: '400',
                fontSize: '0.90rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                transition: 'all 0.2s',
                boxShadow:
                  tipoLocal === 'sala'
                    ? 'inset 0 -2px #292929ff, 0 2px 4px rgba(0,0,0,0.1)'
                    : '0 2px 4px rgba(0,0,0,0.1)'
              }}
            >
              <MapPin size={20} /> Sala de Aula
            </button>
            <button
              type="button"
              onClick={() => setTipoLocal('setor')}
              style={{
                padding: '12px',
                borderRadius: '6px',
                background: 'white',
                color: '#202020ff',
                border: 'none',
                fontWeight: '400',
                fontSize: '0.90rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                transition: 'all 0.2s',
                boxShadow:
                  tipoLocal === 'setor'
                    ? 'inset 0 -2px #292929ff, 0 2px 4px rgba(0,0,0,0.1)'
                    : '0 2px 4px rgba(0,0,0,0.1)'
              }}
            >
              <Building2 size={20} /> Administrativo
            </button>
          </div>
        </div>

        {tipoLocal === 'sala' ? (
          <div className="fade-in">
            <label style={labelStyle}>Qual é a Sala?</label>
            <select style={inputStyle} value={formData.sala} onChange={(e) => setFormData({...formData, sala: e.target.value})}>
              {SALAS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        ) : (
          <div className="fade-in">
            <label style={labelStyle}>Qual é o Setor?</label>
            <select style={inputStyle} value={formData.setor} onChange={(e) => setFormData({...formData, setor: e.target.value})}>
              {SETORES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        )}

        {/* Equipamento */}
        <div>
          <label style={labelStyle}>Equipamento</label>
          <select style={inputStyle} value={formData.equipamento} onChange={(e) => setFormData({...formData, equipamento: e.target.value})}>
            <option>Computador</option>
            <option>Impressora</option>
            <option>Internet / Wifi</option>
            <option>Projetor / TV</option>
            <option>Som</option>
            <option>Teclado / Mouse</option>
            <option>Monitor</option>
            <option>Estabilizador</option>
            <option>Outro</option>
          </select>
        </div>

        {/* Problema */}
        <div>
          <label style={labelStyle}>Descrição da Ocorrência</label>
          <textarea required placeholder="Descreva o que está acontecendo..." rows="4"
            value={formData.problema} onChange={(e) => setFormData({...formData, problema: e.target.value})}
            style={{...inputStyle, resize: 'vertical'}} />
        </div>

        {/* Upload Foto */}
        <div>
          <label style={labelStyle}>Foto de Evidência (Opcional)</label>
          {foto ? (
            <div style={{ padding: '15px', border: '2px solid #062141ff', borderRadius: '10px', backgroundColor: '#ffffffff', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ color: '#000000ff', fontWeight: '500', fontSize: '0.75rem' }}>📷 {foto.name}</span>
              <button type="button" onClick={() => setFoto(null)} style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', fontWeight: 'bold' }}>✕</button>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', padding: '7px', border: '2px dashed #cbd5e1', borderRadius: '10px', color: '#64748b', cursor: 'pointer', transition: 'all 0.2s' }}>
                <input type="file" accept="image/*" capture="environment" style={{ display: 'none' }} onChange={(e) => setFoto(e.target.files[0])} />
                <Camera size={22} />
                <span style={{ fontSize: '0.75rem', textAlign: 'center' }}>Tirar Foto</span>
              </label>
              <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', padding: '7px', border: '2px dashed #cbd5e1', borderRadius: '10px', color: '#64748b', cursor: 'pointer', transition: 'all 0.2s' }}>
                <input type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => setFoto(e.target.files[0])} />
                <Image size={22} />
                <span style={{ fontSize: '0.75rem', textAlign: 'center' }}>Escolher da Galeria</span>
              </label>
            </div>
          )}
        </div>

        <button type="submit" disabled={loading} style={{ padding: '15px', background: '#062141ff', color: 'white', border: 'none', borderRadius: '10px', fontSize: '1rem', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginTop: '10px' }}>
          {loading ? <Loader className="spin" /> : <><Save size={20} /> Abrir Chamado</>}
        </button>

      </form>
    </div>
    </div>
  );
}

const labelStyle = { display: 'block', marginBottom: '5px', color: '#202020ff', fontSize: '0.9rem' };
const inputStyle = { width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '1rem', backgroundColor: 'white', boxSizing: 'border-box' };