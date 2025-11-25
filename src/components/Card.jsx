import './Card.css';
import { 
  User, Mail, MapPin, Monitor, Wrench, MessageSquare, 
  Camera, Edit, CheckSquare, Image, Map
} from 'lucide-react';

// Função auxiliar para formatar data (Versão Blindada)
const formatDataHeader = (dataStr) => {
  if (!dataStr) return 'Data N/A';
  
  // 1. LIMPEZA: Remove vírgulas ou espaços extras que possam ter vindo da planilha
  const cleanStr = dataStr.replace(',', '').trim();
  
  // Tenta separar data e hora
  const partes = cleanStr.split(' ');
  const apenasData = partes[0]; 
  const horaCompleta = partes[1] || '';

  if (!apenasData.includes('/')) return cleanStr;

  const [d, m, a] = apenasData.split('/');
  
  // Tratamento da Hora (pega só HH:MM)
  const [h, min] = horaCompleta.split(':');
  const horaFormatada = h && min ? `${h}:${min}` : '';

  // Tratamento do Ano (O Pulo do Gato)
  // Remove qualquer coisa que não seja número do ano
  let anoLimpo = a ? a.replace(/\D/g, '') : ''; 

  // Se o ano tiver 4 dígitos (2025), corta para 25.
  // Se já tiver 2 dígitos (25), deixa como está.
  let anoFinal = anoLimpo;
  if (anoLimpo.length === 4) {
    anoFinal = anoLimpo.slice(-2);
  }

  // Se não tiver hora, retorna só a data
  if (!horaFormatada) return `${d}/${m}/${anoFinal}`;

  return `${d}/${m}/${anoFinal} - ${horaFormatada}`;
};

export default function Card({ data, onEdit, onCheck, onPhotoClick }) {
  return (
    <div className="card">
      
      {/* --- CABEÇALHO ESCURO --- */}
      <div className="card-header">
        <div className="card-header-actions">
          {/* Botão de Evidência (se tiver link) */}
          {data.foto_url && (
            <button className="action-btn active" title="Ver Evidência" onClick={() => window.open(data.foto_url, '_blank')}>
              <Camera size={18} />
            </button>
          )}

          {/* Botão Editar Parecer */}
          <button className={`action-btn ${data.parecer ? 'active' : ''}`} title="Parecer Técnico" onClick={() => onEdit(data)}>
            <Edit size={18} />
          </button>

          {/* Checkbox Realizado */}
          <button 
            className={`action-btn ${data.is_realizado ? 'success' : ''}`} 
            title={data.is_realizado ? `Realizado em: ${data.realizado_em}` : "Marcar como Realizado"}
            onClick={() => onCheck(data)}
          >
            <CheckSquare size={18} />
          </button>
        </div>

        {/* Data e ID */}
        <div className="card-id">
          {formatDataHeader(data.data_abertura)} <strong>#{String(data.id_sequencial).padStart(6, '0')}</strong>
        </div>
      </div>

      {/* --- TIPO DE OCORRÊNCIA --- */}
      <div className="card-ocorrencia">
        {data.ocorrencia || 'Sem Categoria'}
      </div>

      {/* --- CORPO --- */}
      <div className="card-body">
        
        {/* Linhas de Informação (Icone + Texto) */}
        <div className="info-row">
          <User size={16} className="info-icon" />
          <div className="info-content"><strong>Nome:</strong> {data.nome}</div>
        </div>

        <div className="info-row">
          <Mail size={16} className="info-icon" />
          <div className="info-content"><strong>E-mail:</strong> {data.email}</div>
        </div>

        <div className="info-row">
          <Map size={16} className="info-icon" />
          <div className="info-content"><strong>Setor:</strong> {data.setor}</div>
        </div>

        <div className="info-row">
          <MapPin size={16} className="info-icon" />
          <div className="info-content"><strong>Sala:</strong> {data.sala}</div>
        </div>

        <div className="info-row">
          <Monitor size={16} className="info-icon" />
          <div className="info-content"><strong>Equipamento:</strong> {data.equipamento_defeito}</div>
        </div>

        <div className="info-row">
          <Wrench size={16} className="info-icon" />
          <div className="info-content"><strong>Problema:</strong> {data.defeito_desc}</div>
        </div>

        {/* --- ÁREA DO PARECER (Só mostra se tiver parecer ou foto de parecer) --- */}
        {(data.parecer || data.foto_parecer) && (
          <>
            <div className="card-divider"></div>
            <div className="info-row parecer-box">
              <MessageSquare size={16} className="info-icon" />
              <div className="info-content">
                <strong>Parecer:</strong> {data.parecer}
                
                {/* Ícone da foto do parecer (se houver) */}
                {data.foto_parecer && (
                  <a href={data.foto_parecer} target="_blank" rel="noopener noreferrer" title="Ver foto do parecer">
                    <Image size={16} className="parecer-foto-icon" />
                  </a>
                )}
              </div>
            </div>
          </>
        )}

      </div>
    </div>
  );
}