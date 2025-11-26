import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom'; // <--- IMPORTANTE
import { getFirestore, collection, query, onSnapshot, doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { app } from '../firebaseConfig';
import Card from '../components/Card';
import Filters from '../components/Filters';
import ParecerModal from '../components/ParecerModal'; // Importamos o Modal
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { enviarNotificacao } from '../utils/notificacoes';

export default function Chamados() {
  const [todosChamados, setTodosChamados] = useState([]);
  const [chamadosFiltrados, setChamadosFiltrados] = useState([]);
  const [loading, setLoading] = useState(true);

  // Estados para controlar o Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingChamado, setEditingChamado] = useState(null);

  // Filtros
  const [statusFilter, setStatusFilter] = useState('pendente');
  const [advancedFilters, setAdvancedFilters] = useState({
    dateFrom: '', dateTo: '', email: '', keyword: ''
  });

  const db = getFirestore(app);

  // Hook para ler a URL
  const [searchParams, setSearchParams] = useSearchParams();
  const idParaAbrir = searchParams.get('id');

  // Efeito para abrir o modal automaticamente se houver um ID na URL
  useEffect(() => {
    // Só roda se tivermos um ID na URL e a lista de chamados já tiver carregado
    if (idParaAbrir && todosChamados.length > 0) {
      // Procura o chamado com esse ID sequencial (converte para string para garantir)
      const chamadoEncontrado = todosChamados.find(c => String(c.id_sequencial) === String(idParaAbrir));
      
      if (chamadoEncontrado) {
        handleEditClick(chamadoEncontrado); // Abre o modal
        
        // (Opcional) Limpa o ID da URL para não ficar abrindo se der F5
        setSearchParams({}); 
      }
    }
  }, [idParaAbrir, todosChamados]);

  // 1. Busca dados (Mantido igual)
  useEffect(() => {
    const q = collection(db, "chamados"); 
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const lista = [];
      querySnapshot.forEach((doc) => {
        lista.push({ id: doc.id, ...doc.data() });
      });
      lista.sort((a, b) => b.id_sequencial - a.id_sequencial);
      setTodosChamados(lista);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // 2. Filtros (Mantido igual)
  useEffect(() => {
    let resultado = todosChamados;
    if (statusFilter === 'pendente') resultado = resultado.filter(item => !item.is_realizado);
    else if (statusFilter === 'realizado') resultado = resultado.filter(item => item.is_realizado);

    const { dateFrom, dateTo, email, keyword } = advancedFilters;
    if (email) resultado = resultado.filter(item => item.email && item.email.toLowerCase().includes(email.toLowerCase()));
    if (keyword) {
      const termo = keyword.toLowerCase();
      resultado = resultado.filter(item => 
        (item.nome && item.nome.toLowerCase().includes(termo)) ||
        (item.defeito_desc && item.defeito_desc.toLowerCase().includes(termo)) ||
        (item.equipamento_defeito && item.equipamento_defeito.toLowerCase().includes(termo)) ||
        (item.setor && item.setor.toLowerCase().includes(termo))
      );
    }
    if (dateFrom || dateTo) {
      resultado = resultado.filter(item => {
        if (!item.data_abertura) return false;
        const [dataPart] = item.data_abertura.split(' ');
        const [dia, mes, ano] = dataPart.split('/');
        const itemDate = new Date(`${ano}-${mes}-${dia}`);
        let isValid = true;
        if (dateFrom) isValid = isValid && itemDate >= new Date(dateFrom);
        if (dateTo) isValid = isValid && itemDate <= new Date(dateTo);
        return isValid;
      });
    }
    setChamadosFiltrados(resultado);
  }, [todosChamados, statusFilter, advancedFilters]);

  // --- AÇÕES DO USUÁRIO (AQUI É A NOVIDADE) ---

  // Ação 1: Clicar no Checkbox "Realizado"
  const handleCheck = async (chamado) => {
    const novoStatus = !chamado.is_realizado;
    const dataAtual = new Date().toLocaleString('pt-BR'); // Formato brasileiro

    // Referência ao documento no banco
    const chamadoRef = doc(db, "chamados", chamado.id);

    try {
      await updateDoc(chamadoRef, {
        is_realizado: novoStatus,
        realizado_em: novoStatus ? dataAtual : "" // Grava a data ou limpa
      });

      if (novoStatus) {
  await enviarNotificacao(
    chamado.email, // Manda pro email do dono do chamado
    "Chamado Finalizado", 
    `Seu chamado #${chamado.id_sequencial} foi concluído!`,
    "/usuario"
  );
}
      // Não precisa fazer mais nada! O onSnapshot vai ver a mudança no banco 
      // e atualizar a tela sozinho automaticamente. Mágica! ✨
    } catch (error) {
      console.error("Erro ao atualizar:", error);
      alert("Erro ao salvar. Veja o console.");
    }
  };

  // Ação 2: Clicar no botão Editar (Abre o Modal)
  const handleEditClick = (chamado) => {
    setEditingChamado(chamado); // Guarda qual chamado estamos mexendo
    setIsModalOpen(true);       // Abre a janela
  };

 const storage = getStorage(app); // Inicializa o storage

// Ação 3: Salvar (Parecer Interno + Mensagem Pública + Foto)
  // IMPORTANTE: Os nomes aqui (textoInterno, textoPublico, novoArquivo) devem ser usados dentro da função
  const handleSaveParecer = async (textoInterno, textoPublico, novoArquivo) => {
    if (!editingChamado) return;

    const chamadoRef = doc(db, "chamados", editingChamado.id);
    
    // 1. Dados básicos (Parecer interno sempre salva)
    let dadosParaAtualizar = {
      parecer: textoInterno
    };

    // 2. Se tiver mensagem pública, adiciona ao histórico
    // AQUI ESTAVA O ERRO: A variável precisa ser 'textoPublico'
    if (textoPublico && textoPublico.trim() !== "") {
        dadosParaAtualizar.historico_conversa = arrayUnion({
            autor: 'admin',
            texto: textoPublico,
            data: new Date().toLocaleString('pt-BR')
        });
    }

    try {
      // 3. Upload da Foto
      if (novoArquivo) {
        console.log("Enviando foto...");
        const nomeArquivo = `pareceres/${editingChamado.id}_${Date.now()}`;
        const storageRef = ref(storage, nomeArquivo);
        await uploadBytes(storageRef, novoArquivo);
        const urlDaFoto = await getDownloadURL(storageRef);
        dadosParaAtualizar.foto_parecer = urlDaFoto;
      }

      // 4. Salva no Banco
      await updateDoc(chamadoRef, dadosParaAtualizar);
      
      // Notificação
      if (textoPublico) {
         await enviarNotificacao(
           editingChamado.email,
           "Nova mensagem da TI",
           `Atualização no chamado #${editingChamado.id_sequencial}`,
           `/chamados?id=${editingChamado.id_sequencial}`
         );
      }

    } catch (error) {
      console.error("Erro ao salvar:", error);
      alert("Erro ao salvar. Verifique o console.");
    }
  };

  return (
<div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1px', marginTop: '30px' }}>
  <h1 style={{ margin: 0 }}>Chamados de TI</h1>
  <span style={{ color: '#64748b', paddingBottom: '40px' }}>
    Exibindo: {chamadosFiltrados.length}
  </span>

      <Filters 
        currentStatus={statusFilter}
        onStatusChange={setStatusFilter}
        filters={advancedFilters}
        onFilterChange={setAdvancedFilters}
      />

      {loading ? (
        <p>Carregando chamados...</p>
      ) : (
        <div className="cards-grid" style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', justifyContent: 'center' }}>
          {chamadosFiltrados.map((chamado) => (
            <Card 
              key={chamado.id} 
              data={chamado} 
              onEdit={handleEditClick}
              onCheck={handleCheck}
            />
          ))}
          {chamadosFiltrados.length === 0 && <p style={{color: '#94a3b8', marginTop: '20px'}}>Nenhum chamado encontrado.</p>}
        </div>
      )}

{/* O MODAL FICA AQUI, FORA DO LOOP */}
      <ParecerModal 
    isOpen={isModalOpen}
    onClose={() => setIsModalOpen(false)}
    onSave={handleSaveParecer}
    initialParecer={editingChamado?.parecer}
    initialPhoto={editingChamado?.foto_parecer}
    historico={editingChamado?.historico_conversa} // <--- PASSA O HISTÓRICO
  />
    </div>
  );
}