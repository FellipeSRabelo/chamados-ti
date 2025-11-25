import { useState } from 'react';
import { ChevronDown, ChevronUp, Eraser } from 'lucide-react';
import './Filters.css';

export default function Filters({ currentStatus, onStatusChange, filters, onFilterChange }) {
  const [isOpen, setIsOpen] = useState(false);

  // Função para limpar os campos avançados
  const handleClear = () => {
    onFilterChange({ dateFrom: '', dateTo: '', email: '', keyword: '' });
  };

  // Função genérica para atualizar um campo
  const handleChange = (e) => {
    const { name, value } = e.target;
    onFilterChange({ ...filters, [name]: value });
  };

  return (
    <div>
      {/* 1. Botões de Status */}
      <div className="status-buttons">
        <button 
          className={`status-btn ${currentStatus === 'pendente' ? 'active' : ''}`}
          onClick={() => onStatusChange('pendente')}
        >
          Pendentes
        </button>
        <button 
          className={`status-btn ${currentStatus === 'realizado' ? 'active' : ''}`}
          onClick={() => onStatusChange('realizado')}
        >
          Realizados
        </button>
        <button 
          className={`status-btn ${currentStatus === 'todos' ? 'active' : ''}`}
          onClick={() => onStatusChange('todos')}
        >
          Todos
        </button>
      </div>

      {/* 2. Filtros Avançados (Acordeão) */}
      <div className="advanced-filters-container">
        <button className="toggle-filters-btn" onClick={() => setIsOpen(!isOpen)}>
          {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          Filtros Avançados
        </button>

        {isOpen && (
          <div className="filters-body">
            <div className="filter-row">
              <input 
                type="date" 
                name="dateFrom"
                value={filters.dateFrom} 
                onChange={handleChange}
                className="filter-input date"
                placeholder="Data Início"
              />
              <input 
                type="date" 
                name="dateTo"
                value={filters.dateTo} 
                onChange={handleChange}
                className="filter-input date"
                placeholder="Data Fim"
              />
              <button className="clear-btn" title="Limpar Filtros" onClick={handleClear}>
                <Eraser size={18} />
              </button>
            </div>

            <div className="filter-row">
              <input 
                type="email" 
                name="email"
                value={filters.email} 
                onChange={handleChange}
                className="filter-input text"
                placeholder="Filtrar por e-mail"
              />
            </div>

            <div className="filter-row">
              <input 
                type="text" 
                name="keyword"
                value={filters.keyword} 
                onChange={handleChange}
                className="filter-input text"
                placeholder="Pesquisar por palavra (Nome, Problema...)"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}