import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import PrivateRoute from './components/PrivateRoute';

// Páginas Admin
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Chamados from './pages/Chamados';
import Agendamentos from './pages/Agendamentos';
import NovoChamadoAdmin from './pages/NovoChamadoAdmin';
import Monitor from './pages/Monitor'; // <--- O IMPORT CORRETO ESTÁ AQUI AGORA

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

        {/* --- ÁREA DO USUÁRIO (PROTEGIDA) --- */}
        <Route path="/usuario" element={
          <PrivateRoute><UserDashboard /></PrivateRoute>
        } />
        <Route path="/usuario/novo/chamado" element={
          <PrivateRoute><NovoChamadoUser /></PrivateRoute>
        } />
        <Route path="/usuario/novo/agendamento" element={
          <PrivateRoute><NovoAgendamentoUser /></PrivateRoute>
        } />

        {/* --- ÁREA DO ADMIN (PROTEGIDA COM LAYOUT) --- */}
        <Route path="/" element={
          <PrivateRoute><Layout /></PrivateRoute>
        }>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="chamados" element={<Chamados />} />
          <Route path="agendamentos" element={<Agendamentos />} />
          <Route path="novo-chamado" element={<NovoChamadoAdmin />} />
          
          {/* Rota do Monitor */}
          <Route path="monitor" element={<Monitor />} />
        </Route>
        
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;