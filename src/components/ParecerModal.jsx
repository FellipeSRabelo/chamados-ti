import { useState, useEffect, useRef } from 'react';
import { X, Save, Image as ImageIcon, Trash2, Lock, Send } from 'lucide-react';

export default function ParecerModal({ isOpen, onClose, onSave, initialParecer, initialPhoto, historico = [] }) {
  const [parecerTecnico, setParecerTecnico] = useState(''); // Interno (Texto único)
  const [novaMensagemPublica, setNovaMensagemPublica] = useState(''); // Chat
  
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  
  const chatEndRef = useRef(null); // Para rolar o chat para o final

  useEffect(() => {
    if (isOpen) {
      setParecerTecnico(initialParecer || '');
      setNovaMensagemPublica(''); // Limpa o campo de nova mensagem
      setPreviewUrl(initialPhoto || '');
      setFile(null);
    }
  }, [isOpen, initialParecer, initialPhoto]);

  // Rola o chat para baixo quando abre ou muda
  useEffect(() => {
    if (isOpen && chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [isOpen, historico]);

  if (!isOpen) return null;

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setPreviewUrl(URL.createObjectURL(selectedFile));
    }
  };

  const handleSave = () => {
    // Envia: Parecer Interno (atualizado), Nova Mensagem (se houver) e Foto
    onSave(parecerTecnico, novaMensagemPublica, file);
    onClose(); // Fecha após salvar (opcional, poderia manter aberto se quisesse um chat real-time)
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex',
      alignItems: 'center', justifyContent: 'center', zIndex: 1000
    }}>
      <div style={{
        background: 'white', padding: '0', borderRadius: '10px',
        width: '90%', maxWidth: '800px', height: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden',
        boxShadow: '0 10px 25px rgba(0,0,0,0.2)'
      }}>
        
        {/* CABEÇALHO */}
        <div style={{ padding: '20px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc' }}>
          <h2 style={{ margin: 0, fontSize: '1.2rem', color: '#1e293b' }}>Gerenciar Chamado</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={24} /></button>
        </div>

        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
          
          {/* COLUNA DA ESQUERDA: PARECER INTERNO + FOTO */}
          <div style={{ width: '40%', padding: '20px', borderRight: '1px solid #e2e8f0', overflowY: 'auto', background: '#fff' }}>
             <h3 style={{fontSize: '0.9rem', color: '#64748b', marginTop: 0, display: 'flex', alignItems: 'center', gap: '5px'}}><Lock size={14}/> Dados Internos (TI)</h3>
             
             <textarea
                value={parecerTecnico}
                onChange={(e) => setParecerTecnico(e.target.value)}
                placeholder="Anotações técnicas privadas..."
                style={{
                  width: '100%', height: '150px', padding: '10px', marginBottom: '20px',
                  borderRadius: '5px', border: '1px solid #cbd5e1', fontSize: '14px', resize: 'vertical', 
                  backgroundColor: '#fff9db', color: '#333'
                }}
              />

              {/* FOTO */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: '#007bff', fontWeight: '500', fontSize: '0.9rem' }}>
                  <input type="file" accept="image/*" onChange={handleFileChange} style={{ display: 'none' }} />
                  <ImageIcon size={18} /> {previewUrl ? 'Trocar Foto' : 'Anexar Foto'}
                </label>
                {previewUrl && (
                  <div style={{ marginTop: '10px', position: 'relative' }}>
                    <img src={previewUrl} alt="Prévia" style={{ width: '100%', borderRadius: '5px', border: '1px solid #eee' }} />
                  </div>
                )}
              </div>
          </div>

          {/* COLUNA DA DIREITA: CHAT PÚBLICO */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#f1f5f9' }}>
            <div style={{ padding: '15px', background: 'white', borderBottom: '1px solid #e2e8f0' }}>
              <h3 style={{fontSize: '0.9rem', color: '#64748b', margin: 0}}>Chat com Usuário</h3>
            </div>

            {/* ÁREA DAS MENSAGENS */}
            <div style={{ flex: 1, padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '15px' }}>
              {historico.length === 0 ? (
                <p style={{textAlign: 'center', color: '#94a3b8', fontSize: '0.9rem', marginTop: '20px'}}>Nenhuma mensagem ainda.</p>
              ) : (
                historico.map((msg, idx) => (
                  <div key={idx} style={{
                    alignSelf: msg.autor === 'admin' ? 'flex-end' : 'flex-start',
                    maxWidth: '80%',
                    display: 'flex', flexDirection: 'column', alignItems: msg.autor === 'admin' ? 'flex-end' : 'flex-start'
                  }}>
                    <div style={{
                      background: msg.autor === 'admin' ? '#3b82f6' : 'white',
                      color: msg.autor === 'admin' ? 'white' : '#334155',
                      padding: '10px 15px', borderRadius: '12px',
                      boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                      borderBottomRightRadius: msg.autor === 'admin' ? '0' : '12px',
                      borderBottomLeftRadius: msg.autor === 'admin' ? '12px' : '0'
                    }}>
                      {msg.texto}
                    </div>
                    <span style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: '4px' }}>
                      {msg.autor === 'admin' ? 'TI' : 'Usuário'} • {msg.data.split(' ')[1]?.substring(0,5)}
                    </span>
                  </div>
                ))
              )}
              <div ref={chatEndRef} />
            </div>

            {/* INPUT DE MENSAGEM */}
            <div style={{ padding: '15px', background: 'white', borderTop: '1px solid #e2e8f0' }}>
               <textarea
                value={novaMensagemPublica}
                onChange={(e) => setNovaMensagemPublica(e.target.value)}
                placeholder="Escreva uma resposta para o usuário..."
                style={{
                  width: '100%', height: '50px', padding: '10px',
                  borderRadius: '8px', border: '1px solid #cbd5e1',
                  fontSize: '14px', resize: 'none', marginBottom: '10px'
                }}
              />
              <button onClick={handleSave} style={{
                width: '100%', padding: '10px', borderRadius: '8px', border: 'none',
                background: '#10b981', color: 'white', fontWeight: 'bold', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
              }}>
                <Send size={18} /> Enviar Resposta & Salvar
              </button>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}