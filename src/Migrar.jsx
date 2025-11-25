import { useState } from 'react';
import { getFirestore, collection, addDoc, doc, setDoc } from 'firebase/firestore';
import { app } from './firebaseConfig';
import chamadosData from './chamados.json';
import agendamentosData from './agendamentos.json';

const db = getFirestore(app);

function Migrar() {
  const [status, setStatus] = useState('Aguardando...');

  // Função para limpar os dados e renomear as chaves (deixando o código profissional)
  const formatarDados = (item) => {
    return {
      // Dados Principais
      id_sequencial: item["ID Chamado"] || 0,
      data_abertura: item["Carimbo de data/hora"] || "",
      email: item["Endereço de e-mail"] || "",
      tipo: item["Qual a sua solicitação?"] || "", // "Agendar..." ou "Abertura..."
      
      // Detalhes
      equipamentos: item["Quais equipamentos"] || "",
      observacao: item["Observação"] || "",
      evento: item["Qual Evento?"] || "",
      local: item["Local do evento;"] || "",
      solicitante: item["Solicitante"] || "",
      
      // Datas de Uso
      data_uso: item["Data que será usado:"] || "",
      hora_uso: item["Horário que será usado"] || "",
      
      // Dados do Chamado TI (quando é defeito)
      nome: item["Nome"] || "",
      setor: item["Setor"] || "",
      sala: item["Sala"] || "",
      equipamento_defeito: item["Qual equipamento apresenta defeito?"] || "", // Coluna do chamado
      defeito_desc: item["Explique:"] || "",
      ocorrencia: item["Tipo de Ocorrência"] || "",
      
      // Status e Parecer
      realizado_em: item["Realizado"] || "", // Se tiver data, está feito
      devolvido_em: item["Devolvido"] || "", // Se tiver data, foi devolvido
      parecer: item["Parecer Técnico"] || "",
      foto_url: item["foto"] || "", // Link da foto antiga (se houver)
      
      // Flags booleanas para facilitar filtros no React (Criação automática)
      is_realizado: item["Realizado"] ? true : false,
      is_devolvido: item["Devolvido"] ? true : false,
    };
  };

  const enviarChamados = async () => {
    setStatus('Processando Chamados...');
    const colecao = collection(db, 'chamados');
    
    try {
      let count = 0;
      // Filtra apenas os que são "Abertura de Chamado" no JSON
      const apenasChamados = chamadosData.filter(i => i["Qual a sua solicitação?"] === "Abertura de Chamado");

      for (const item of apenasChamados) {
        const dadosLimpos = formatarDados(item);
        await addDoc(colecao, dadosLimpos);
        count++;
      }
      setStatus(`Sucesso! ${count} chamados migrados.`);
    } catch (error) {
      console.error(error);
      setStatus('Erro. Veja o console.');
    }
  };

  const enviarAgendamentos = async () => {
    setStatus('Processando Agendamentos...');
    const colecao = collection(db, 'agendamentos');
    
    try {
      let count = 0;
      // Filtra apenas os que são "Agendar uso..." no JSON
      const apenasAgendamentos = agendamentosData.filter(i => i["Qual a sua solicitação?"] === "Agendar uso de Equipamento");

      for (const item of apenasAgendamentos) {
        const dadosLimpos = formatarDados(item);
        await addDoc(colecao, dadosLimpos);
        count++;
      }
      setStatus(`Sucesso! ${count} agendamentos migrados.`);
    } catch (error) {
      console.error(error);
      setStatus('Erro. Veja o console.');
    }
  };

  return (
    <div style={{ padding: '50px', fontFamily: 'Arial', textAlign: 'center' }}>
      <h1>Migração Inteligente (Limpeza de Dados)</h1>
      <p>Status: <strong>{status}</strong></p>
      
      <div style={{ display: 'flex', gap: '20px', justifyContent: 'center', marginTop: '20px' }}>
        <button onClick={enviarChamados} style={{ padding: '15px 30px', cursor: 'pointer', background: '#007bff', color: 'white', border: 'none', borderRadius: '5px' }}>
          Migrar CHAMADOS
        </button>
        
        <button onClick={enviarAgendamentos} style={{ padding: '15px 30px', cursor: 'pointer', background: '#28a745', color: 'white', border: 'none', borderRadius: '5px' }}>
          Migrar AGENDAMENTOS
        </button>
      </div>
    </div>
  );
}

export default Migrar;