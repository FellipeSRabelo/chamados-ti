import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// Layouts
import Layout from './components/Layout';

// Páginas Admin
import Login from './pages/Login';
import Dashboard from './pages/Dashboard'; // <--- IMPORTANDO O ARQUIVO REAL AGORA
import Chamados from './pages/Chamados';
import Agendamentos from './pages/Agendamentos';

// Páginas Usuário
import UserDashboard from './pages/UserDashboard';
import NovoChamadoUser from './pages/NovoChamadoUser';
import NovoAgendamentoUser from './pages/NovoAgendamentoUser';
import NovoChamadoAdmin from './pages/NovoChamadoAdmin';
import Monitor from './pages/Monitor';

// Páginas Placeholder (Só Monitor continua em construção por enquanto)
const NovoChamado = () => <div style={{padding: 20}}><h1>Novo Chamado Admin (Em construção)</h1></div>;

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* --- ROTA PÚBLICA (LOGIN) --- */}
        <Route path="/login" element={<Login />} />

        {/* --- ÁREA DO USUÁRIO (SEM LAYOUT ADMIN) --- */}
        <Route path="/usuario" element={<UserDashboard />} />
        <Route path="/usuario/novo/chamado" element={<NovoChamadoUser />} />
        <Route path="/usuario/novo/agendamento" element={<NovoAgendamentoUser />} />
       

        {/* --- ÁREA DO ADMIN (COM LAYOUT LATERAL) --- */}
        <Route path="/" element={<Layout />}>
          {/* AQUI ESTÁ A MUDANÇA: Redireciona para o DASHBOARD ao entrar */}
          <Route index element={<Navigate to="/dashboard" replace />} />
          
          
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="chamados" element={<Chamados />} />
          <Route path="agendamentos" element={<Agendamentos />} />
          {/* AQUI: O Novo Chamado do Admin deve estar aqui dentro! */}
          <Route path="novo-chamado" element={<NovoChamadoAdmin />} />
          <Route path="novo-chamado" element={<NovoChamado />} />
          <Route path="monitor" element={<Monitor />} />
        </Route>

        {/* Rota de Erro 404 */}
        <Route path="*" element={<div style={{padding: 50, textAlign: 'center'}}><h1>404 - Página não encontrada</h1><a href="/login">Voltar ao Login</a></div>} />

      </Routes>
    </BrowserRouter>
  );
}

export default App;