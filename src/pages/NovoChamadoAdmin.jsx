import { useState } from 'react';
import { getFirestore, collection, addDoc, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { app } from '../firebaseConfig';
import { useNavigate } from 'react-router-dom';
import { Camera, Save, Loader, User } from 'lucide-react';

// Listas (Mantidas iguais)
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

export default function NovoChamadoAdmin() {
  const auth = getAuth(app);
  const user = auth.currentUser;
  const navigate = useNavigate();
  const db = getFirestore(app);
  const storage = getStorage(app);

  const [loading, setLoading] = useState(false);
  const [tipoLocal, setTipoLocal] = useState('sala');
  const [formData, setFormData] = useState({
    nomeSolicitante: user?.displayName || "TI Interno", 
    setor: '', 
    sala: SALAS[0],
    equipamento: 'Computador', 
    problema: '',
    ocorrencia: 'Relatar Problema'
  });
  const [foto, setFoto] = useState(null);

  if (tipoLocal === 'sala' && formData.setor !== 'Sala de Aula') {
    setFormData(prev => ({ ...prev, setor: 'Sala de Aula' }));
  }

  const getNextId = async () => {
    const q = query(collection(db, "chamados"), orderBy("id_sequencial", "desc"), limit(1));
    const snapshot = await getDocs(q);
    return !snapshot.empty ? snapshot.docs[0].data().id_sequencial + 1 : 1;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const nextId = await getNextId();
      const now = new Date();
      const dataFormatada = now.toLocaleString('pt-BR');
      let fotoUrl = "";

      if (foto) {
        const storageRef = ref(storage, `evidencias/${user.email}_${Date.now()}`);
        await uploadBytes(storageRef, foto);
        fotoUrl = await getDownloadURL(storageRef);
      }

      await addDoc(collection(db, "chamados"), {
        id_sequencial: nextId,
        tipo: "Abertura de Chamado",
        data_abertura: dataFormatada,
        nome: formData.nomeSolicitante, 
        solicitante: formData.nomeSolicitante,
        email: user.email,
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

      alert(`Chamado #${nextId} criado com sucesso!`);
      navigate('/chamados');

    } catch (error) {
      console.error(error);
      alert("Erro ao abrir chamado.");
    } finally {
      setLoading(false);
    }
  };

  return (
    // Removemos o 'minHeight: 100vh' e o fundo cinza global para encaixar no Layout
    <div style={{ padding: '20px', maxWidth: '900px', margin: '0 auto' }}>
      
      {/* Cartão Branco do Formulário */}
      <div style={{ background: 'white', padding: '30px', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0' }}>
        
        <h2 style={{ marginTop: 0, marginBottom: '25px', color: '#1e293b', borderBottom: '1px solid #e2e8f0', paddingBottom: '15px' }}>
          Abrir Chamado (Interno)
        </h2>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* CAMPO EXTRA: NOME DO SOLICITANTE */}
          <div style={{background: '#f8fafc', padding: '20px', borderRadius: '8px', border: '1px dashed #cbd5e1'}}>
              <label style={labelStyle}> <User size={16} style={{marginRight: 5, marginBottom: -2}}/> Nome do Solicitante</label>
              <input 
                required 
                type="text" 
                placeholder="Quem pediu ajuda?" 
                value={formData.nomeSolicitante} 
                onChange={(e) => setFormData({...formData, nomeSolicitante: e.target.value})}
                style={{...inputStyle, borderColor: '#3b82f6', backgroundColor: 'white'}} 
              />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div>
                  <label style={labelStyle}>Tipo de Ocorrência</label>
                  <select 
                      style={inputStyle} 
                      value={formData.ocorrencia} 
                      onChange={(e) => setFormData({...formData, ocorrencia: e.target.value})}
                  >
                      {TIPOS_OCORRENCIA.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
              </div>

              <div>
                  <label style={labelStyle}>Localização</label>
                  <div style={{display: 'flex', gap: '10px'}}>
                      <button type="button" onClick={() => setTipoLocal('sala')} style={{...btnToggleStyle, background: tipoLocal === 'sala' ? '#3b82f6' : '#fff', color: tipoLocal === 'sala' ? '#fff' : '#64748b'}}>Sala</button>
                      <button type="button" onClick={() => setTipoLocal('setor')} style={{...btnToggleStyle, background: tipoLocal === 'setor' ? '#3b82f6' : '#fff', color: tipoLocal === 'setor' ? '#fff' : '#64748b'}}>Setor</button>
                  </div>
              </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              {tipoLocal === 'sala' ? (
                  <div>
                      <label style={labelStyle}>Sala</label>
                      <select style={inputStyle} value={formData.sala} onChange={(e) => setFormData({...formData, sala: e.target.value})}>
                      {SALAS.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                  </div>
              ) : (
                  <div>
                      <label style={labelStyle}>Setor</label>
                      <select style={inputStyle} value={formData.setor} onChange={(e) => setFormData({...formData, setor: e.target.value})}>
                      {SETORES.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                  </div>
              )}
              
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
                      <option>Outro</option>
                  </select>
              </div>
          </div>

          <div>
            <label style={labelStyle}>Descrição do Problema</label>
            <textarea required rows="4"
              value={formData.problema} onChange={(e) => setFormData({...formData, problema: e.target.value})}
              style={{...inputStyle, resize: 'vertical'}} />
          </div>

          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px', border: '1px dashed #cbd5e1', borderRadius: '8px', color: '#64748b', cursor: 'pointer', width: 'fit-content' }}>
              <input type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => setFoto(e.target.files[0])} />
              <Camera size={20} />
              {foto ? <span style={{color: '#10b981'}}>{foto.name}</span> : 'Anexar Foto (Opcional)'}
            </label>
          </div>

          <button type="submit" disabled={loading} style={{
            padding: '15px', background: '#10b981', color: 'white', border: 'none', borderRadius: '8px',
            fontSize: '1rem', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginTop: '10px'
          }}>
            {loading ? <Loader className="spin" /> : <><Save size={20} /> Criar Chamado</>}
          </button>

        </form>
      </div>
    </div>
  );
}

const labelStyle = { display: 'block', marginBottom: '5px', color: '#64748b', fontSize: '0.9rem', fontWeight: '600' };
const inputStyle = { width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '1rem', backgroundColor: '#fff', boxSizing: 'border-box' };
const btnToggleStyle = { flex: 1, padding: '10px', border: '1px solid #cbd5e1', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', transition: 'all 0.2s' };