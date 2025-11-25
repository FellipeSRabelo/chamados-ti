import './Card.css'; // Reaproveita o CSS do outro card
import { 
  User, Mail, MapPin, Box, Calendar, Clock, FileText, 
  Edit, CheckSquare, Undo2, CalendarPlus, MessageSquare
} from 'lucide-react';

// Função para gerar link do Google Calendar
const generateCalendarLink = (data) => {
  const title = encodeURIComponent(data.evento || 'Evento');
  const location = encodeURIComponent(data.local || '');
  const description = encodeURIComponent(`Equipamentos: ${data.equipamentos}\nObs: ${data.observacao}\nSolicitante: ${data.solicitante}`);
  
  // data.data_uso vem como "DD/MM/YYYY"
  if (!data.data_uso || !data.hora_uso) return '#';
  
  const [d, m, y] = data.data_uso.split('/');
  const [h, min] = data.hora_uso.split(':');
  
  // Formato YYYYMMDDTHHMMSS
  const start = `${y}${m}${d}T${h}${min}00`;
  // Adiciona 1 hora para o fim
  const endH = String(parseInt(h) + 1).padStart(2, '0');
  const end = `${y}${m}${d}T${endH}${min}00`;

  const calendarId = 'fc29a1e43a473980888b1df9e9ca40bf90b044f42396dfd4d2f45fd060b8bd5f@group.calendar.google.com';
  
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${start}/${end}&details=${description}&location=${location}&add=${calendarId}`;
};

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

export default function CardAgendamento({ data, onEdit, onCheck, onReturn }) {
  const calendarLink = generateCalendarLink(data);

  return (
    <div className="card">
      
      <div className="card-header">
        <div className="card-header-actions">
          {/* Botão Agenda */}
          <a href={calendarLink} target="_blank" className="action-btn" title="Adicionar à Agenda">
            <CalendarPlus size={18} />
          </a>

          {/* Botão Editar Parecer */}
          <button className={`action-btn ${data.parecer ? 'active' : ''}`} title="Parecer" onClick={() => onEdit(data)}>
            <Edit size={18} />
          </button>

          {/* Checkbox Realizado */}
          <button 
            className={`action-btn ${data.is_realizado ? 'success' : ''}`} 
            title={data.is_realizado ? `Realizado em: ${data.realizado_em}` : "Marcar Realizado"}
            onClick={() => onCheck(data)}
          >
            <CheckSquare size={18} />
          </button>

          {/* Botão Devolvido */}
          <button 
            className={`action-btn ${data.is_devolvido ? 'active' : ''}`} 
            title={data.is_devolvido ? `Devolvido em: ${data.devolvido_em}` : "Marcar Devolvido"}
            onClick={() => onReturn(data)}
          >
            <Undo2 size={18} />
          </button>
        </div>

        <div className="card-id">
           {formatDataHeader(data.data_abertura)} <strong>#{String(data.id_sequencial).padStart(6, '0')}</strong>
        </div>
      </div>

      {/* Ocorrência/Evento */}
      <div className="card-ocorrencia" style={{fontSize: '1.1rem'}}>
        {data.evento || 'Evento Sem Nome'}
      </div>

      <div className="card-body">
        <div className="info-row">
          <User size={16} className="info-icon" />
          <div className="info-content"><strong>Solicitante:</strong> {data.solicitante}</div>
        </div>

        <div className="info-row">
          <Mail size={16} className="info-icon" />
          <div className="info-content"><strong>E-mail:</strong> {data.email}</div>
        </div>

        <div className="info-row">
          <Box size={16} className="info-icon" />
          <div className="info-content"><strong>Equipamentos:</strong> {data.equipamentos}</div>
        </div>

        <div className="info-row">
          <MapPin size={16} className="info-icon" />
          <div className="info-content"><strong>Local:</strong> {data.local}</div>
        </div>

        <div className="info-row">
          <Calendar size={16} className="info-icon" />
          <div className="info-content"><strong>Data Uso:</strong> {data.data_uso}</div>
        </div>

        <div className="info-row">
          <Clock size={16} className="info-icon" />
          <div className="info-content"><strong>Hora Uso:</strong> {data.hora_uso}</div>
        </div>

        {data.observacao && (
          <div className="info-row">
            <FileText size={16} className="info-icon" />
            <div className="info-content"><strong>Obs:</strong> {data.observacao}</div>
          </div>
        )}

        {/* Áreas de Status (Parecer e Devolução) */}
        {(data.parecer || data.is_devolvido) && <div className="card-divider"></div>}

        {data.is_devolvido && (
           <div className="info-row" style={{color: '#ef4444'}}>
             <Undo2 size={16} className="info-icon" style={{color: '#ef4444'}} />
             <div className="info-content"><strong>Devolvido em:</strong> {data.devolvido_em.split(' ')[0]}</div>
           </div>
        )}

        {data.parecer && (
          <div className="info-row parecer-box">
            <MessageSquare size={16} className="info-icon" />
            <div className="info-content"><strong>Parecer:</strong> {data.parecer}</div>
          </div>
        )}

      </div>
    </div>
  );
}