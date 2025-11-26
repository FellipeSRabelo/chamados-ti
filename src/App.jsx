import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import PrivateRoute from './components/PrivateRoute'; // Segurança para qualquer logado
import AdminRoute from './components/AdminRoute';     // Segurança SÓ para Admin (NOVO)

// Páginas Admin
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Chamados from './pages/Chamados';
import Agendamentos from './pages/Agendamentos';
import NovoChamadoAdmin from './pages/NovoChamadoAdmin';
import Monitor from './pages/Monitor';
import Limpeza from './Limpeza';

// Páginas Usuário
import UserDashboard from './pages/UserDashboard';
import NovoChamadoUser from './pages/NovoChamadoUser';
import NovoAgendamentoUser from './pages/NovoAgendamentoUser';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Rota Pública */}
        <Route path="/login" element={<Login />} />

        {/* --- ÁREA DO USUÁRIO (Acesso: Qualquer um logado) --- */}
        <Route path="/usuario" element={
          <PrivateRoute><UserDashboard /></PrivateRoute>
        } />
        <Route path="/usuario/novo/chamado" element={
          <PrivateRoute><NovoChamadoUser /></PrivateRoute>
        } />
        <Route path="/usuario/novo/agendamento" element={
          <PrivateRoute><NovoAgendamentoUser /></PrivateRoute>
        } />

        {/* --- ÁREA DO ADMIN (Acesso: SÓ quem está na lista 'admins') --- */}
        {/* Note que trocamos PrivateRoute por AdminRoute aqui no pai */}
        <Route path="/" element={
          <AdminRoute><Layout /></AdminRoute>
        }>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="chamados" element={<Chamados />} />
          <Route path="agendamentos" element={<Agendamentos />} />
          <Route path="novo-chamado" element={<NovoChamadoAdmin />} />
          <Route path="monitor" element={<Monitor />} />
          <Route path="/limpeza" element={<Limpeza />} />
        </Route>
        
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;