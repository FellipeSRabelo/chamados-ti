import { useState } from 'react';
import { getFirestore, collection, query, where, getDocs, deleteDoc, doc, writeBatch } from 'firebase/firestore';
import { app } from './firebaseConfig';

export default function Limpeza() {
  const [listaParaExcluir, setListaParaExcluir] = useState([]);
  const [status, setStatus] = useState('Aguardando comando...');
  const [loading, setLoading] = useState(false);
  
  const db = getFirestore(app);

  // ---------------------------------------------------------
  // CONFIGURAÇÃO DO FILTRO (MUDE AQUI)
  // ---------------------------------------------------------
  const buscarLixo = async () => {
    setLoading(true);
    setStatus('Buscando dados...');
    setListaParaExcluir([]);

    try {
      const colecaoRef = collection(db, "agendamentos"); // ou "agendamentos"

      // --- EXEMPLO 1: Apagar por Nome (Quem abriu foi "teste") ---
      // const q = query(colecaoRef, where("nome", "==", "teste"));

      // --- EXEMPLO 2: Apagar por ID Sequencial (Ex: IDs maiores que 500) ---
      const q = query(colecaoRef, where("id_sequencial", ">=", 568));

      // --- EXEMPLO 3: Apagar TUDO (CUIDADO!!!!) ---
      // const q = query(colecaoRef); 

      const snapshot = await getDocs(q);
      
      const itens = snapshot.docs.map(doc => ({
        id: doc.id, // ID interno do firebase
        ...doc.data()
      }));

      setListaParaExcluir(itens);
      setStatus(`${itens.length} itens encontrados para exclusão.`);

    } catch (error) {
      console.error(error);
      setStatus('Erro ao buscar: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // ---------------------------------------------------------
  // FUNÇÃO DELETAR
  // ---------------------------------------------------------
  const executarExclusao = async () => {
    if (!confirm(`TEM CERTEZA que deseja excluir ${listaParaExcluir.length} registros permanentemente?`)) return;
    
    setLoading(true);
    setStatus('Excluindo...');
    
    try {
      // O Firebase permite deletar em lotes (batch) de 500 em 500
      // Vamos fazer um loop simples deletando um por um para ser mais fácil de entender
      let count = 0;
      for (const item of listaParaExcluir) {
        await deleteDoc(doc(db, "agendamentos", item.id)); // Certifique se é "chamados" ou "agendamentos"
        count++;
      }
      
      setStatus(`Sucesso! ${count} itens foram excluídos.`);
      setListaParaExcluir([]); // Limpa a lista

    } catch (error) {
      console.error(error);
      setStatus('Erro ao excluir: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '50px', fontFamily: 'Arial', maxWidth: '800px', margin: '0 auto' }}>
      <h1 style={{color: '#dc2626'}}>Ferramenta de Limpeza em Massa</h1>
      
      <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '8px', marginBottom: '20px', border: '1px solid #e2e8f0' }}>
        <h3>Passo 1: Buscar o que será apagado</h3>
        <p>Edite o código na linha 24 para escolher o filtro (por nome, por ID, etc).</p>
        <button 
          onClick={buscarLixo} 
          disabled={loading}
          style={{ padding: '10px 20px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
        >
          {loading ? 'Processando...' : '🔍 Buscar Candidatos a Exclusão'}
        </button>
      </div>

      <p>Status: <strong>{status}</strong></p>

      {listaParaExcluir.length > 0 && (
        <div>
          <h3>Itens encontrados ({listaParaExcluir.length}):</h3>
          <div style={{ maxHeight: '300px', overflowY: 'auto', background: '#fff', border: '1px solid #ddd', marginBottom: '20px' }}>
            <ul style={{ listStyle: 'none', padding: 0 }}>
              {listaParaExcluir.map(item => (
                <li key={item.id} style={{ padding: '10px', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between' }}>
                  <span><strong>#{item.id_sequencial}</strong> - {item.tipo}</span>
                  <span>{item.nome} ({item.data_abertura})</span>
                </li>
              ))}
            </ul>
          </div>

          <button 
            onClick={executarExclusao} 
            disabled={loading}
            style={{ width: '100%', padding: '15px', background: '#dc2626', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold', fontSize: '1.2rem' }}
          >
            🗑️ EXCLUIR {listaParaExcluir.length} ITENS AGORA
          </button>
        </div>
      )}
    </div>
  );
}