import { useState, useEffect } from 'react';
import { getFirestore, collection, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { app } from '../firebaseConfig';
import CardAgendamento from '../components/CardAgendamento';
import Filters from '../components/Filters';
import ParecerModal from '../components/ParecerModal';

export default function Agendamentos() {
  const [todos, setTodos] = useState([]);
  const [filtrados, setFiltrados] = useState([]);
  const [loading, setLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  const [statusFilter, setStatusFilter] = useState('pendente');
  const [advancedFilters, setAdvancedFilters] = useState({
    dateFrom: '', dateTo: '', email: '', keyword: ''
  });

  const db = getFirestore(app);

  // 1. Busca dados em Tempo Real
  useEffect(() => {
    const q = collection(db, "agendamentos"); 
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const lista = [];
      querySnapshot.forEach((doc) => {
        lista.push({ id: doc.id, ...doc.data() });
      });
      // Ordena por data de USO (não de abertura) para ficar mais útil
      // Mas como a data é string DD/MM/YYYY, vamos ordenar por ID sequencial igual ao outro por segurança
      lista.sort((a, b) => b.id_sequencial - a.id_sequencial);
      
      setTodos(lista);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // 2. Filtros
  useEffect(() => {
    let resultado = todos;
    if (statusFilter === 'pendente') resultado = resultado.filter(item => !item.is_realizado);
    else if (statusFilter === 'realizado') resultado = resultado.filter(item => item.is_realizado);

    const { dateFrom, dateTo, email, keyword } = advancedFilters;
    
    if (email) resultado = resultado.filter(item => item.email && item.email.toLowerCase().includes(email.toLowerCase()));
    
    if (keyword) {
      const termo = keyword.toLowerCase();
      resultado = resultado.filter(item => 
        (item.evento && item.evento.toLowerCase().includes(termo)) ||
        (item.solicitante && item.solicitante.toLowerCase().includes(termo)) ||
        (item.equipamentos && item.equipamentos.toLowerCase().includes(termo)) ||
        (item.local && item.local.toLowerCase().includes(termo))
      );
    }

    // Filtro de Data (Pela data de USO, que é mais importante aqui)
    if (dateFrom || dateTo) {
      resultado = resultado.filter(item => {
        if (!item.data_uso) return false;
        // item.data_uso = "05/05/2025"
        const [d, m, a] = item.data_uso.split('/');
        const itemDate = new Date(`${a}-${m}-${d}`);
        let isValid = true;
        if (dateFrom) isValid = isValid && itemDate >= new Date(dateFrom);
        if (dateTo) isValid = isValid && itemDate <= new Date(dateTo);
        return isValid;
      });
    }
    setFiltrados(resultado);
  }, [todos, statusFilter, advancedFilters]);

  // --- AÇÕES ---

  const handleCheck = async (item) => {
    const novoStatus = !item.is_realizado;
    const dataAtual = new Date().toLocaleString('pt-BR');
    try {
      await updateDoc(doc(db, "agendamentos", item.id), {
        is_realizado: novoStatus,
        realizado_em: novoStatus ? dataAtual : ""
      });
    } catch (error) { alert("Erro ao atualizar."); }
  };

  const handleReturn = async (item) => {
    const novoStatus = !item.is_devolvido;
    const dataAtual = new Date().toLocaleString('pt-BR');
    try {
      await updateDoc(doc(db, "agendamentos", item.id), {
        is_devolvido: novoStatus,
        devolvido_em: novoStatus ? dataAtual : ""
      });
    } catch (error) { alert("Erro ao atualizar."); }
  };

  const handleEditClick = (item) => {
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const handleSaveParecer = async (novoTexto) => {
    if (!editingItem) return;
    try {
      await updateDoc(doc(db, "agendamentos", editingItem.id), { parecer: novoTexto });
    } catch (error) { alert("Erro ao salvar."); }
  };

  return (
    /*<div style={{ padding: '20px' }}>
      <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>Agendamentos</h1>
        <span style={{ color: '#64748b' }}>Exibindo: {filtrados.length}</span>
      </div>*/

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1px', marginTop: '30px' }}>
  <h1 style={{ margin: 0 }}>Agendamentos</h1>
  <span style={{ color: '#64748b', paddingBottom: '40px' }}>
    Exibindo: {filtrados.length}
  </span>

      <Filters 
        currentStatus={statusFilter}
        onStatusChange={setStatusFilter}
        filters={advancedFilters}
        onFilterChange={setAdvancedFilters}
      />

      {loading ? (
        <p>Carregando...</p>
      ) : (
        <div className="cards-grid" style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', justifyContent: 'center' }}>
          {filtrados.map((item) => (
            <CardAgendamento 
              key={item.id} 
              data={item} 
              onEdit={handleEditClick}
              onCheck={handleCheck}
              onReturn={handleReturn}
            />
          ))}
          {filtrados.length === 0 && <p style={{color: '#94a3b8', marginTop: '20px'}}>Nenhum agendamento encontrado.</p>}
        </div>
      )}

      <ParecerModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveParecer}
        initialText={editingItem?.parecer}
      />
    </div>
  );
}