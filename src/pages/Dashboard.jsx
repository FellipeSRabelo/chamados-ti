import { useState, useEffect } from 'react';
import { getFirestore, collection, query, onSnapshot } from 'firebase/firestore';
import { app } from '../firebaseConfig';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, PieChart, Pie, Cell, Legend
} from 'recharts';
import './Dashboard.css';
import { Loader } from 'lucide-react';

const CORES = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658'];

export default function Dashboard() {
  const [chamados, setChamados] = useState([]);
  const [agendamentos, setAgendamentos] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filtros do Gráfico de Montanha
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1); // Mês atual (1-12)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const db = getFirestore(app);

  // 1. Busca Dados
  useEffect(() => {
    const qChamados = query(collection(db, "chamados"));
    const qAgendamentos = query(collection(db, "agendamentos"));

    const unsub1 = onSnapshot(qChamados, (snap) => {
      setChamados(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    const unsub2 = onSnapshot(qAgendamentos, (snap) => {
      setAgendamentos(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });

    return () => { unsub1(); unsub2(); };
  }, []);

  // --- FUNÇÕES DE PROCESSAMENTO DE DADOS ---

  // Conta frequência de um campo (ex: setor) e retorna Top N
  const getStats = (dataList, field, topN = 5) => {
    const counts = {};
    dataList.forEach(item => {
      const val = item[field] || 'N/A';
      counts[val] = (counts[val] || 0) + 1;
    });

    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, topN);
  };

  // Processa dados para o gráfico de dias do mês
  const getDailyStats = () => {
    const daysInMonth = new Date(selectedYear, selectedMonth, 0).getDate();
    const stats = Array.from({ length: daysInMonth }, (_, i) => ({
      day: i + 1, chamados: 0, agendamentos: 0
    }));

    const filterByMonth = (item) => {
        if (!item.data_abertura) return false;
        // data_abertura = "DD/MM/YYYY HH:mm:ss"
        const [datePart] = item.data_abertura.split(' ');
        const [d, m, y] = datePart.split('/');
        return parseInt(m) === parseInt(selectedMonth) && parseInt(y) === parseInt(selectedYear);
    };

    chamados.filter(filterByMonth).forEach(c => {
        const dia = parseInt(c.data_abertura.split('/')[0]);
        if (stats[dia - 1]) stats[dia - 1].chamados++;
    });

    agendamentos.filter(filterByMonth).forEach(a => {
        const dia = parseInt(a.data_abertura.split('/')[0]);
        if (stats[dia - 1]) stats[dia - 1].agendamentos++;
    });

    return stats;
  };

  if (loading) return <div style={{padding:50, textAlign:'center'}}><Loader className="spin" /> Carregando dados...</div>;

  // Preparando os dados para os gráficos
  const dadosPorSala = getStats(chamados, 'sala', 10);
  const dadosPorSetor = getStats(chamados, 'setor', 5);
  const dadosPorEquipamento = getStats(chamados, 'equipamento_defeito', 5);
  const dadosPorUsuario = getStats(chamados, 'nome', 10);
  const dadosDiarios = getDailyStats();
  
  // Últimos itens (ordenados por ID decrescente)
  const ultimosChamados = [...chamados].sort((a,b) => b.id_sequencial - a.id_sequencial).slice(0, 5);
  const ultimosAgendamentos = [...agendamentos].sort((a,b) => b.id_sequencial - a.id_sequencial).slice(0, 5);

  return (
    <div className="dashboard-wrapper">
      <h1 className="dashboard-title">Visão Geral da TI</h1>

      {/* --- LINHA 1: LISTAS RECENTES --- */}
      <div className="dashboard-grid">
        <div className="dashboard-card">
            <h3>Últimos Chamados</h3>
            <ul className="recent-list">
                {ultimosChamados.map(c => (
                    <li key={c.id} className="recent-item">
                        <span className="recent-id">#{c.id_sequencial}</span>
                        <span className="recent-desc" title={c.defeito_desc}>{c.defeito_desc}</span>
                        <span className="recent-date">{c.data_abertura.split(' ')[0]}</span>
                    </li>
                ))}
            </ul>
        </div>
        <div className="dashboard-card">
            <h3>Últimos Agendamentos</h3>
            <ul className="recent-list">
                {ultimosAgendamentos.map(a => (
                    <li key={a.id} className="recent-item">
                        <span className="recent-id">#{a.id_sequencial}</span>
                        <span className="recent-desc" title={a.evento}>{a.evento}</span>
                        <span className="recent-date">{a.data_abertura.split(' ')[0]}</span>
                    </li>
                ))}
            </ul>
        </div>
      </div>

      {/* --- LINHA 2: GRÁFICO DE MONTANHA (DIÁRIO) --- */}
      <div className="dashboard-grid">
        <div className="dashboard-card full-width-card">
            <div className="chart-header">
                <h3>Volume Diário (Chamados vs Agendamentos)</h3>
                <div className="chart-filters">
                    <select className="chart-select" value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)}>
                        {Array.from({length: 12}, (_, i) => (
                            <option key={i+1} value={i+1}>{new Date(0, i).toLocaleString('pt-BR', {month: 'long'})}</option>
                        ))}
                    </select>
                    <select className="chart-select" value={selectedYear} onChange={e => setSelectedYear(e.target.value)}>
                        <option value="2024">2024</option>
                        <option value="2025">2025</option>
                        <option value="2026">2026</option>
                    </select>
                </div>
            </div>
            
            <div style={{ width: '100%', height: 300 }}>
                <ResponsiveContainer>
                    <AreaChart data={dadosDiarios} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                        <defs>
                            <linearGradient id="colorChamados" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
                                <stop offset="95%" stopColor="#8884d8" stopOpacity={0}/>
                            </linearGradient>
                            <linearGradient id="colorAgendamentos" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#82ca9d" stopOpacity={0.8}/>
                                <stop offset="95%" stopColor="#82ca9d" stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <XAxis dataKey="day" />
                        <YAxis allowDecimals={false} />
                        <CartesianGrid strokeDasharray="3 3" />
                        <Tooltip />
                        <Legend />
                        <Area type="monotone" dataKey="chamados" stroke="#8884d8" fillOpacity={1} fill="url(#colorChamados)" name="Chamados" />
                        <Area type="monotone" dataKey="agendamentos" stroke="#82ca9d" fillOpacity={1} fill="url(#colorAgendamentos)" name="Agendamentos" />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
      </div>

      {/* --- LINHA 3: TOP RANKINGS --- */}
      <div className="dashboard-grid">
        
        {/* Top Salas */}
        <div className="dashboard-card">
            <h3>Top 10 Salas com Problemas</h3>
            <div style={{ width: '100%', height: 300 }}>
                <ResponsiveContainer>
                    <BarChart data={dadosPorSala} layout="vertical" margin={{left: 20}}>
                        <XAxis type="number" allowDecimals={false} />
                        <YAxis dataKey="name" type="category" width={80} fontSize={12} />
                        <Tooltip />
                        <Bar dataKey="value" fill="#3b82f6" name="Chamados" radius={[0, 4, 4, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>

        {/* Top Equipamentos (Pizza) */}
        <div className="dashboard-card">
            <h3>Equipamentos Defeituosos</h3>
            <div style={{ width: '100%', height: 300 }}>
                <ResponsiveContainer>
                    <PieChart>
                        <Pie data={dadosPorEquipamento} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                            {dadosPorEquipamento.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={CORES[index % CORES.length]} />
                            ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                    </PieChart>
                </ResponsiveContainer>
            </div>
        </div>

        {/* Top Setores */}
        <div className="dashboard-card">
            <h3>Top 5 Setores</h3>
            <div style={{ width: '100%', height: 300 }}>
                <ResponsiveContainer>
                    <BarChart data={dadosPorSetor}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" fontSize={11} interval={0} angle={-15} textAnchor="end" height={60} />
                        <YAxis allowDecimals={false} />
                        <Tooltip />
                        <Bar dataKey="value" fill="#f59e0b" name="Chamados" />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>

      </div>

      {/* --- LINHA 4: USUÁRIOS --- */}
      <div className="dashboard-grid">
        <div className="dashboard-card full-width-card">
            <h3>Top 10 Usuários que mais abrem chamados</h3>
            <div style={{ width: '100%', height: 300 }}>
                <ResponsiveContainer>
                    <BarChart data={dadosPorUsuario}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis allowDecimals={false} />
                        <Tooltip />
                        <Bar dataKey="value" fill="#10b981" name="Total de Chamados" />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
      </div>

    </div>
  );
}