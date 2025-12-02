import React, { useState } from 'react';
import { Calendar } from 'lucide-react';

function AgendamentosView({ agendamentos, setSelectedItem, navigate }) {
  const [tab, setTab] = useState('pendentes');
  
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
                  color: tab === 'pendentes' ? 'white' : '#64748b',
                  transition: 'color 0.3s ease',
                }}
              >
                Em Aberto
              </span>
              <span
                style={{
                  flex: 1,
                  textAlign: 'center',
                  zIndex: 1,
                  fontWeight: '600',
                  fontSize: '14px',
                  color: tab === 'resolvidos' ? 'white' : '#64748b',
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
      {/* Botão de Adicionar Novo Agendamento */}
      <div style={{ position: 'fixed', bottom: '90px', right: '20px', zIndex: '20' }}>
        <button 
          onClick={() => navigate('/usuario/novo/agendamento')} 
          style={{
            background: '#073870ff',
            color: 'white',
            border: 'none',
            borderRadius: '50%',
            width: '56px',
            height: '56px',
            fontSize: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
            cursor: 'pointer'
          }}
        >
          <Calendar size={24} color="white" />
        </button>
      </div>
    </>
  );
}

export default AgendamentosView;