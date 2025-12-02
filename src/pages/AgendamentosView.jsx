import React, { useState } from 'react';
import { Calendar, PlusCircle, PlusIcon, Ticket } from 'lucide-react';

function AgendamentosView({ agendamentos, setSelectedItem, navigate }) {
  const [tab, setTab] = useState('pendentes');
  const [menuOpen, setMenuOpen] = useState(false);
  
  const listaAgendamentos = agendamentos.filter(item => 
    tab === 'pendentes' ? !item.is_realizado : item.is_realizado
  );

  return (
    <>
      <div style={{ 
        padding: '20px',
            display: 'flex',
            justifyContent: 'center'
       }}>
            <div
              onClick={() => setTab(tab === 'pendentes' ? 'resolvidos' : 'pendentes')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                background: '#ddddddff',
                borderRadius: '9999px',
                padding: '4px',
                cursor: 'pointer',
                position: 'relative',
                width: '300px',
                height: '38px',
                transition: 'background 0.3s ease',
                userSelect: 'none',
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  top: '4px',
                  left: tab === 'pendentes' ? '4px' : 'calc(50% + 4px)',
                  width: 'calc(50% - 8px)',
                  height: '38px',
                  background: '#1e293b',
                  borderRadius: '9999px',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                }}
              />
              <span
                style={{
                  flex: 1,
                  textAlign: 'center',
                  zIndex: 1,
                  fontWeight: '600',
                  fontSize: '14px',
                  color: tab === 'pendentes' ? 'white' : '#1b1b1bff',
                  transition: 'color 0.3s ease',
                }}
              >
                Pendentes
              </span>
              <span
                style={{
                  flex: 1,
                  textAlign: 'center',
                  zIndex: 1,
                  fontWeight: '600',
                  fontSize: '14px',
                  color: tab === 'resolvidos' ? 'white' : '#1b1b1bff',
                  transition: 'color 0.3s ease',
                }}
              >
                Resolvidos
              </span>
            </div>
          </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '0 20px 0px 20px' }}>
        {listaAgendamentos.map(item => (
          <div key={item.id} onClick={() => setSelectedItem(item)} style={{ 
            background: 'white', 
            padding: '15px', 
            borderRadius: '10px', 
            border: '1px solid #e2e8f0', 
            borderLeft: '4px solid ' + (item.is_realizado ? '#22c55e' : '#f59e0b'),
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            cursor: 'pointer' 
          }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', color: '#242424ff' }}>
                 <span>{String(item.id_sequencial).padStart(6, '0')}</span>
                 <span>{item.data_abertura.split(' ')[0]}</span>
              </div>
              <div style={{ fontWeight: '600', color: '#334155', marginBottom: '2px' }}>
                {item.evento || 'Sem evento'}
              </div>
              <div style={{ textAlign: 'right', fontSize: '0.85rem', fontWeight: 'bold', color: '#222222ff', marginBottom: '4px' }}>
                 Agendamento
              </div>
            </div>
          </div>
        ))}
        {listaAgendamentos.length === 0 && <div style={{ textAlign: 'center', padding: '40px 0', color: '#94a3b8' }}>Nenhum agendamento aqui.</div>}
      </div>
      {/* Botão de Adicionar com Menu */}
            <div style={{ position: 'fixed', bottom: '90px', right: '20px', zIndex: '20' }}>
              {/* Menu de opções */}
              {menuOpen && (
                <div style={{
                  position: 'absolute',
                  bottom: '70px',
                  right: '0',
                  background: 'white',
                  borderRadius: '12px',
                  border: '1px solid #dbdbdbff',
                  boxShadow: '2px 4px 6px rgba(0,0,0,0.35)',
                  padding: '6px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  minWidth: '190px'
                }}>
                  <button
                    onClick={() => {
                      navigate('/usuario/novo/chamado');
                      setMenuOpen(false);
                    }}
                    style={{
                      padding: '12px 16px',
                      background: '#f8fafc',
                      border: 'none',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      cursor: 'pointer',
                      fontSize: '0.9rem',
                      fontWeight: '500',
                      color: '#1e293b',
                      transition: 'background 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#e2e8f0'}
                    onMouseLeave={(e) => e.currentTarget.style.background = '#f8fafc'}
                  >
                    <PlusCircle size={20} color="#1e293b" />
                    Abrir Chamado
                  </button>
                  <div style={{ height: '1px', background: '#dbdbdbff', margin: '0 0' }}></div>
                  <button
                    onClick={() => {
                      navigate('/usuario/novo/agendamento');
                      setMenuOpen(false);
                    }}
                    style={{
                      padding: '12px 16px',
                      background: '#f8fafc',
                      border: 'none',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      cursor: 'pointer',
                      fontSize: '0.9rem',
                      fontWeight: '500',
                      color: '#1e293b',
                      transition: 'background 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#e2e8f0'}
                    onMouseLeave={(e) => e.currentTarget.style.background = '#f8fafc'}
                  >
                    <PlusCircle size={20} color="#1e293b" />
                    Criar Agendamento
                  </button>
                </div>
              )}
        
        {/* Botão Principal */}
        <button 
          onClick={() => setMenuOpen(!menuOpen)} 
          style={{
            background: menuOpen ? '#334155' : '#1e293b',
            color: 'white',
            border: 'none',
            borderRadius: '50%',
            width: '56px',
            height: '56px',
            fontSize: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '2px 2px 8px rgba(0,0,0,0.55)',
            cursor: 'pointer',
            transform: menuOpen ? 'rotate(45deg)' : 'rotate(0deg)',
            transition: 'all 0.3s',
            animation: 'fadeInRight 0.5s ease-out 0.3s both'
          }}
        >
          <PlusIcon size={34} color="white" />
        </button>
      </div>
    </>
  );
}

export default AgendamentosView;