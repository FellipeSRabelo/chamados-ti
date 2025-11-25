import { useState, useEffect, useRef } from 'react';
import './Monitor.css';

// --- DADOS DOS SERVIÇOS (Suas listas completas) ---
// Colei as que você me passou. Se tiver mais, adicione aqui.

const SERVICES_MAIN = [
               {'nome': 'Site do Colégio', 'tipo': 'http', 'target': 'https://www.elisaandreoli.com.br', 'group': 'servicos'},
            {'nome': 'Servidor Externo', 'tipo': 'ping', 'target': '177.136.78.103', 'group': 'servicos'},
            // Grupo 'acesso'
            {'nome': 'Giratória 1 - Entrada', 'tipo': 'ping', 'target': '192.168.60.135', 'group': 'acesso'},
            {'nome': 'Giratória 1 - Saída', 'tipo': 'ping', 'target': '192.168.60.134', 'group': 'acesso'},
            {'nome': 'Giratória 2 - Entrada', 'tipo': 'ping', 'target': '192.168.60.110', 'group': 'acesso'},
            {'nome': 'Giratória 2 - Saída', 'tipo': 'ping', 'target': '192.168.60.112', 'group': 'acesso'},
            {'nome': 'Giratória 3 - Entrada', 'tipo': 'ping', 'target': '192.168.60.105', 'group': 'acesso'},
            {'nome': 'Giratória 3 - Saída', 'tipo': 'ping', 'target': '192.168.60.106', 'group': 'acesso'},
            {'nome': 'Giratória 4 - Entrada', 'tipo': 'ping', 'target': '192.168.60.108', 'group': 'acesso'},
            {'nome': 'Giratória 4 - Saída', 'tipo': 'ping', 'target': '192.168.60.109', 'group': 'acesso'},
            {'nome': 'Torniquete 1 - Entrada', 'tipo': 'ping', 'target': '192.168.60.102', 'group': 'acesso'},
            {'nome': 'Torniquete 1 - Saída', 'tipo': 'ping', 'target': '192.168.60.101', 'group': 'acesso'},
            {'nome': 'Torniquete 2 - Entrada', 'tipo': 'ping', 'target': '192.168.60.103', 'group': 'acesso'},
            {'nome': 'Torniquete 2 - Saída', 'tipo': 'ping', 'target': '192.168.60.104', 'group': 'acesso'},
            {'nome': 'Torniquete 3 - Entrada', 'tipo': 'ping', 'target': '192.168.60.126', 'group': 'acesso'},
            {'nome': 'Torniquete 3 - Saída', 'tipo': 'ping', 'target': '192.168.60.125', 'group': 'acesso'},
            {'nome': 'Facial Lateral - Entrada', 'tipo': 'ping', 'target': '192.168.60.140', 'group': 'acesso'},
            {'nome': 'Facial Lateral - Saída', 'tipo': 'ping', 'target': '192.168.60.142', 'group': 'acesso'},
            {'nome': 'Facial Funcionários - E', 'tipo': 'ping', 'target': '192.168.60.216', 'group': 'acesso'},
            {'nome': 'Facial Funcionários - S', 'tipo': 'ping', 'target': '192.168.60.38', 'group': 'acesso'},
            {'nome': 'Facial Infantil', 'tipo': 'ping', 'target': '192.168.60.129', 'group': 'acesso'},
            {'nome': 'Facial Secretaria', 'tipo': 'ping', 'target': '192.168.60.141', 'group': 'acesso'},
            {'nome': 'Camera LPR - Entrada', 'tipo': 'ping', 'target': '192.168.60.11', 'group': 'infra'},
            {'nome': 'Camera LPR - Saída', 'tipo': 'ping', 'target': '192.168.60.86', 'group': 'infra'},
            // Grupo 'infra'
            {'nome': 'NVR1', 'tipo': 'ping', 'target': '192.168.57.9', 'group': 'infra'},
            {'nome': 'NVR2', 'tipo': 'ping', 'target': '192.168.57.10', 'group': 'infra'},
            {'nome': 'NVR3', 'tipo': 'ping', 'target': '192.168.57.11', 'group': 'infra'},
            {'nome': 'CloudKey Unifi (Wi-Fi)', 'tipo': 'port', 'target': '192.168.56.16', 'port': 8443, 'group': 'infra'},
            {'nome': 'Central Telefonica', 'tipo': 'port', 'target': '192.168.56.98', 'port': 80, 'group': 'infra'},
            {'nome': 'OLT (Fibra)', 'tipo': 'port', 'target': '192.168.56.100', 'port': 22, 'group': 'infra'},
            {'nome': 'Relógio Ponto 1 (Ping)', 'tipo': 'ping', 'target': '192.168.60.30', 'group': 'infra'},
            {'nome': 'Relógio Ponto 2 (Ping)', 'tipo': 'ping', 'target': '192.168.60.31', 'group': 'infra'},
    {'nome': 'IntegrationServ (Serviço)', 'tipo': 'winservice', 'target': '10.102.1.4', 'service_name': 'IntegrationServ', 'group': 'servicos'},
    {'nome': 'SRV_GerAcesso', 'tipo': 'winservice', 'target': '10.102.1.4', 'service_name': 'ServGerAcesso', 'group': 'servicos'},
    {'nome': 'ControlID Server Acesso', 'tipo': 'winservice', 'target': '10.102.1.4', 'service_name': 'ServControlID', 'group': 'servicos'},
    {'nome': 'BBMensageiro', 'tipo': 'winservice', 'target': '10.102.1.4', 'service_name': 'frmServicoBBMensageiro', 'group': 'servicos'},
];

const NVR_IPS_CAMERAS = { 
    1: "192.168.57.9",
    2: "192.168.57.10",
    3: "192.168.57.11"
};

// Exemplo de Câmeras (adicionei algumas do seu código, complete com a lista completa se precisar)
const SERVICES_CAMERAS = [
    {'nome': 'NVR1-Cam001', 'tipo': 'ping', 'target': '192.168.58.46', 'nvr': 1},
    {'nome': 'NVR1-Cam002', 'tipo': 'ping', 'target': '192.168.58.61', 'nvr': 1},
    {'nome': 'NVR1-Cam003', 'tipo': 'ping', 'target': '192.168.58.26', 'nvr': 1},
    {'nome': 'NVR1-Cam004', 'tipo': 'ping', 'target': '192.168.58.75', 'nvr': 1},
    {'nome': 'NVR1-Cam005', 'tipo': 'ping', 'target': '192.168.58.58', 'nvr': 1},
    {'nome': 'NVR1-Cam006', 'tipo': 'ping', 'target': '192.168.58.64', 'nvr': 1},
    {'nome': 'NVR1-Cam007', 'tipo': 'ping', 'target': '192.168.58.40', 'nvr': 1},
    {'nome': 'NVR1-Cam008', 'tipo': 'ping', 'target': '192.168.58.60', 'nvr': 1},
    {'nome': 'NVR1-Cam009', 'tipo': 'ping', 'target': '192.168.58.54', 'nvr': 1},
    {'nome': 'NVR1-Cam010', 'tipo': 'ping', 'target': '192.168.58.39', 'nvr': 1},
    {'nome': 'NVR1-Cam011', 'tipo': 'ping', 'target': '192.168.58.80', 'nvr': 1},
    {'nome': 'NVR1-Cam012', 'tipo': 'ping', 'target': '192.168.58.68', 'nvr': 1},
    {'nome': 'NVR1-Cam013', 'tipo': 'ping', 'target': '192.168.58.45', 'nvr': 1},
    {'nome': 'NVR1-Cam014', 'tipo': 'ping', 'target': '192.168.58.42', 'nvr': 1},
    {'nome': 'NVR1-Cam015', 'tipo': 'ping', 'target': '192.168.58.56', 'nvr': 1},
    {'nome': 'NVR1-Cam016', 'tipo': 'ping', 'target': '192.168.57.44', 'nvr': 1},
    {'nome': 'NVR1-Cam017', 'tipo': 'ping', 'target': '192.168.58.31', 'nvr': 1},
    {'nome': 'NVR1-Cam018', 'tipo': 'ping', 'target': '192.168.58.62', 'nvr': 1},
    {'nome': 'NVR1-Cam019', 'tipo': 'ping', 'target': '192.168.57.43', 'nvr': 1},
    {'nome': 'NVR1-Cam020', 'tipo': 'ping', 'target': '192.168.58.66', 'nvr': 1},
    {'nome': 'NVR1-Cam021', 'tipo': 'ping', 'target': '192.168.58.77', 'nvr': 1},
    {'nome': 'NVR1-Cam022', 'tipo': 'ping', 'target': '192.168.58.48', 'nvr': 1},
    {'nome': 'NVR1-Cam023', 'tipo': 'ping', 'target': '192.168.58.43', 'nvr': 1},
    {'nome': 'NVR1-Cam024', 'tipo': 'ping', 'target': '192.168.58.44', 'nvr': 1},
    {'nome': 'NVR1-Cam025', 'tipo': 'ping', 'target': '192.168.58.55', 'nvr': 1},
    {'nome': 'NVR1-Cam026', 'tipo': 'ping', 'target': '192.168.58.41', 'nvr': 1},
    {'nome': 'NVR1-Cam027', 'tipo': 'ping', 'target': '192.168.58.94', 'nvr': 1},
    {'nome': 'NVR1-Cam028', 'tipo': 'ping', 'target': '192.168.58.71', 'nvr': 1},
    {'nome': 'NVR1-Cam029', 'tipo': 'ping', 'target': '192.168.58.52', 'nvr': 1},
    {'nome': 'NVR1-Cam030', 'tipo': 'ping', 'target': '192.168.58.69', 'nvr': 1},
    {'nome': 'NVR1-Cam031', 'tipo': 'ping', 'target': '192.168.58.47', 'nvr': 1},
    {'nome': 'NVR1-Cam032', 'tipo': 'ping', 'target': '192.168.58.29', 'nvr': 1},
    {'nome': 'NVR1-Cam033', 'tipo': 'ping', 'target': '192.168.58.67', 'nvr': 1},
    {'nome': 'NVR1-Cam034', 'tipo': 'ping', 'target': '192.168.58.49', 'nvr': 1},
    {'nome': 'NVR1-Cam035', 'tipo': 'ping', 'target': '192.168.58.57', 'nvr': 1},
    {'nome': 'NVR1-Cam036', 'tipo': 'ping', 'target': '192.168.58.73', 'nvr': 1},
    {'nome': 'NVR1-Cam037', 'tipo': 'ping', 'target': '192.168.58.53', 'nvr': 1},
    {'nome': 'NVR1-Cam038', 'tipo': 'ping', 'target': '192.168.58.63', 'nvr': 1},
    {'nome': 'NVR1-Cam039', 'tipo': 'ping', 'target': '192.168.58.38', 'nvr': 1},
    {'nome': 'NVR1-Cam040', 'tipo': 'ping', 'target': '192.168.58.59', 'nvr': 1},
    {'nome': 'NVR1-Cam041', 'tipo': 'ping', 'target': '192.168.57.66', 'nvr': 1},
    {'nome': 'NVR1-Cam042', 'tipo': 'ping', 'target': '192.168.58.65', 'nvr': 1},
    {'nome': 'NVR1-Cam043', 'tipo': 'ping', 'target': '192.168.58.76', 'nvr': 1},
    {'nome': 'NVR1-Cam044', 'tipo': 'ping', 'target': '192.168.58.74', 'nvr': 1},
    {'nome': 'NVR1-Cam045', 'tipo': 'ping', 'target': '192.168.58.33', 'nvr': 1},
    {'nome': 'NVR1-Cam046', 'tipo': 'ping', 'target': '192.168.58.93', 'nvr': 1},
    {'nome': 'NVR1-Cam047', 'tipo': 'ping', 'target': '192.168.58.90', 'nvr': 1},
    {'nome': 'NVR1-Cam048', 'tipo': 'ping', 'target': '192.168.57.89', 'nvr': 1},
    {'nome': 'NVR1-Cam049', 'tipo': 'ping', 'target': '192.168.58.70', 'nvr': 1},
    {'nome': 'NVR1-Cam050', 'tipo': 'ping', 'target': '192.168.58.92', 'nvr': 1},
    {'nome': 'NVR1-Cam051', 'tipo': 'ping', 'target': '192.168.58.96', 'nvr': 1},
    {'nome': 'NVR1-Cam052', 'tipo': 'ping', 'target': '192.168.58.97', 'nvr': 1},
    {'nome': 'NVR1-Cam053', 'tipo': 'ping', 'target': '192.168.58.95', 'nvr': 1},
    {'nome': 'NVR1-Cam054', 'tipo': 'ping', 'target': '192.168.58.98', 'nvr': 1},
    {'nome': 'NVR1-Cam055', 'tipo': 'ping', 'target': '192.168.58.99', 'nvr': 1},
    {'nome': 'NVR1-Cam056', 'tipo': 'ping', 'target': '192.168.58.28', 'nvr': 1},
    {'nome': 'NVR1-Cam057', 'tipo': 'ping', 'target': '192.168.58.32', 'nvr': 1},
    {'nome': 'NVR1-Cam058', 'tipo': 'ping', 'target': '192.168.58.27', 'nvr': 1},
    {'nome': 'NVR2-Cam001-Ginasio/mochileiro', 'tipo': 'ping', 'target': '192.168.58.10', 'nvr': 2},
    {'nome': 'NVR2-Cam002-Ginasio/mochileiro', 'tipo': 'ping', 'target': '192.168.58.12', 'nvr': 2},
    {'nome': 'NVR2-Cam003-Estacionamento', 'tipo': 'ping', 'target': '192.168.58.23', 'nvr': 2},
    {'nome': 'NVR2-Cam004-Entrada de veículos', 'tipo': 'ping', 'target': '192.168.58.11', 'nvr': 2},
    {'nome': 'NVR2-Cam005-Externo bancos', 'tipo': 'ping', 'target': '192.168.58.20', 'nvr': 2},
    {'nome': 'NVR2-Cam006-Quadro coberto', 'tipo': 'ping', 'target': '192.168.58.16', 'nvr': 2},
    {'nome': 'NVR2-Cam007-Entrada de veículos', 'tipo': 'ping', 'target': '192.168.58.18', 'nvr': 2},
    {'nome': 'NVR2-Cam008-Banheiros Ginásio', 'tipo': 'ping', 'target': '192.168.58.22', 'nvr': 2},
    {'nome': 'NVR2-Cam009-Ginasio1', 'tipo': 'ping', 'target': '192.168.58.14', 'nvr': 2},
    {'nome': 'NVR2-Cam010-Ginasio2', 'tipo': 'ping', 'target': '192.168.58.15', 'nvr': 2},
    {'nome': 'NVR2-Cam011-Ginasio3', 'tipo': 'ping', 'target': '192.168.58.17', 'nvr': 2},
    {'nome': 'NVR2-Cam012-Quadra externa', 'tipo': 'ping', 'target': '192.168.58.24', 'nvr': 2},
    {'nome': 'NVR2-Cam013-Ginasio4', 'tipo': 'ping', 'target': '192.168.58.21', 'nvr': 2},
    {'nome': 'NVR2-Cam014-Quadro coberto', 'tipo': 'ping', 'target': '192.168.58.19', 'nvr': 2},
    {'nome': 'NVR2-Cam015-Mesas Xadrez', 'tipo': 'ping', 'target': '192.168.58.13', 'nvr': 2},
    {'nome': 'NVR2-Cam016-Pátio Geral', 'tipo': 'ping', 'target': '192.168.58.25', 'nvr': 2},
    {'nome': 'NVR3-Cam001-3201-201 E', 'tipo': 'ping', 'target': '192.168.58.150', 'nvr': 3},
    {'nome': 'NVR3-Cam002-3201-201 F', 'tipo': 'ping', 'target': '192.168.58.151', 'nvr': 3},
    {'nome': 'NVR3-Cam003-3202-101 F', 'tipo': 'ping', 'target': '192.168.58.152', 'nvr': 3},
    {'nome': 'NVR3-Cam004-3202-101 E', 'tipo': 'ping', 'target': '192.168.58.153', 'nvr': 3},
    {'nome': 'NVR3-Cam005-Banheiro Hall', 'tipo': 'ping', 'target': '192.168.58.154', 'nvr': 3},
    {'nome': 'NVR3-Cam006-3203-303 E', 'tipo': 'ping', 'target': '192.168.58.155', 'nvr': 3},
    {'nome': 'NVR3-Cam007-3203-303 F', 'tipo': 'ping', 'target': '192.168.58.156', 'nvr': 3},
    {'nome': 'NVR3-Cam008-Mesa Hall', 'tipo': 'ping', 'target': '192.168.58.157', 'nvr': 3},
    {'nome': 'NVR3-Cam009-3204-302 E', 'tipo': 'ping', 'target': '192.168.58.158', 'nvr': 3},
    {'nome': 'NVR3-Cam010-3205-301 E', 'tipo': 'ping', 'target': '192.168.58.160', 'nvr': 3},
    {'nome': 'NVR3-Cam011-3205-301 F', 'tipo': 'ping', 'target': '192.168.58.161', 'nvr': 3},
    {'nome': 'NVR3-Cam012-3206-6263 E', 'tipo': 'ping', 'target': '192.168.58.162', 'nvr': 3},
    {'nome': 'NVR3-Cam013-3206-6264 F', 'tipo': 'ping', 'target': '192.168.58.163', 'nvr': 3},
    {'nome': 'NVR3-Cam014-Entrada Hall', 'tipo': 'ping', 'target': '192.168.58.164', 'nvr': 3},
    {'nome': 'NVR3-Cam015-Escada Hall', 'tipo': 'ping', 'target': '192.168.58.165', 'nvr': 3},
    {'nome': 'NVR3-Cam016-Escada 4 N', 'tipo': 'ping', 'target': '192.168.58.166', 'nvr': 3},
    {'nome': 'NVR3-Cam017-Escada 5 N', 'tipo': 'ping', 'target': '192.168.58.167', 'nvr': 3},
    {'nome': 'NVR3-Cam018-Escada 1 N', 'tipo': 'ping', 'target': '192.168.58.181', 'nvr': 3},
    {'nome': 'NVR3-Cam019-Acesso Cantina', 'tipo': 'ping', 'target': '192.168.58.180', 'nvr': 3},
    {'nome': 'NVR3-Cam020-Escada 2 N', 'tipo': 'ping', 'target': '192.168.58.182', 'nvr': 3},
    {'nome': 'NVR3-Cam021-Escada 3 N', 'tipo': 'ping', 'target': '192.168.58.183', 'nvr': 3},
    {'nome': 'NVR3-Cam022-3204-302 F', 'tipo': 'ping', 'target': '192.168.58.188', 'nvr': 3},
    {'nome': 'NVR3-Cam023-Escada Horta', 'tipo': 'ping', 'target': '192.168.58.184', 'nvr': 3},
    {'nome': 'NVR3-Cam024-Catracas Portaria', 'tipo': 'ping', 'target': '192.168.58.185', 'nvr': 3},
    {'nome': 'NVR3-Cam025-Lixeira', 'tipo': 'ping', 'target': '192.168.58.186', 'nvr': 3},
    {'nome': 'NVR3-Cam026-Estacionamento', 'tipo': 'ping', 'target': '192.168.58.187', 'nvr': 3},
    {'nome': 'NVR3-Cam027-Biblioteca-6', 'tipo': 'ping', 'target': '192.168.58.195', 'nvr': 3},
    {'nome': 'NVR3-Cam028-Biblioteca-5', 'tipo': 'ping', 'target': '192.168.58.194', 'nvr': 3},
    {'nome': 'NVR3-Cam029-Biblioteca-4', 'tipo': 'ping', 'target': '192.168.58.193', 'nvr': 3},
    {'nome': 'NVR3-Cam030-Biblioteca-3', 'tipo': 'ping', 'target': '192.168.58.192', 'nvr': 3},
    {'nome': 'NVR3-Cam031-Biblioteca-2', 'tipo': 'ping', 'target': '192.168.58.191', 'nvr': 3},
    {'nome': 'NVR3-Cam032-Biblioteca-1', 'tipo': 'ping', 'target': '192.168.58.190', 'nvr': 3},
];

const SERVICES_WIFI = [
    {'nome': 'AUDITORIO', 'tipo': 'ping', 'target': '192.168.57.28'},
    {'nome': 'Corredor 1102', 'tipo': 'ping', 'target': '192.168.57.29'},
    {'nome': 'Corredor Biblioteca', 'tipo': 'ping', 'target': '192.168.57.55'},
    {'nome': 'Corredor sala 1104', 'tipo': 'ping', 'target': '192.168.57.35'},
    {'nome': 'Corredor sala 1109', 'tipo': 'ping', 'target': '192.168.57.31'},
    {'nome': 'Corredor Sala 1110', 'tipo': 'ping', 'target': '192.168.57.32'},
    {'nome': 'Corredor sala 1203', 'tipo': 'ping', 'target': '192.168.57.36'},
    {'nome': 'Corredor sala 1205', 'tipo': 'ping', 'target': '192.168.57.37'},
    {'nome': 'Corredor sala 1209', 'tipo': 'ping', 'target': '192.168.57.38'},
    {'nome': 'Corredor sala 1211', 'tipo': 'ping', 'target': '192.168.57.39'},
    {'nome': 'Corredor Sala 2004', 'tipo': 'ping', 'target': '192.168.56.20'},
    {'nome': 'Corredor Sala 2007', 'tipo': 'ping', 'target': '192.168.57.47'},
    {'nome': 'Corredor sala 3103', 'tipo': 'ping', 'target': '192.168.57.33'},
    {'nome': 'Corredor sala 4102', 'tipo': 'ping', 'target': '192.168.57.41'},
    {'nome': 'Corredor secretaria', 'tipo': 'ping', 'target': '192.168.57.49'},
    {'nome': 'Guarita', 'tipo': 'ping', 'target': '192.168.56.23'},
    {'nome': 'Integral', 'tipo': 'ping', 'target': '192.168.56.21'},
    {'nome': 'Mind', 'tipo': 'ping', 'target': '192.168.57.34'},
    {'nome': 'Quadra Esportes', 'tipo': 'ping', 'target': '192.168.57.24'},
    {'nome': 'Quiosque', 'tipo': 'ping', 'target': '192.168.57.51'},
    {'nome': 'Sala 4001', 'tipo': 'ping', 'target': '192.168.57.45'},
    {'nome': 'Sala 4003', 'tipo': 'ping', 'target': '192.168.57.50'},
    {'nome': 'Sala Comp 7101', 'tipo': 'ping', 'target': '192.168.57.42'},
    {'nome': 'Sala de som Ginasio', 'tipo': 'ping', 'target': '192.168.57.25'},
    {'nome': 'Secretaria Nova', 'tipo': 'ping', 'target': '192.168.57.52'},
];

const SERVICES_ONUS = [
    {'nome': 'ONU 01 - Bloco A', 'tipo': 'port', 'target': '192.168.56.100', 'port': 51944},
    {'nome': 'ONU 02 - Bloco B', 'tipo': 'port', 'target': '192.168.56.100', 'port': 51942},
];


const API_BASE_URL = 'http://localhost:5000';

export default function Monitor() {
  const [page, setPage] = useState('main'); // main, cameras, wifi, onus
  const [isTesting, setIsTesting] = useState(false);
  const [lastRun, setLastRun] = useState('(Aguardando...)');
  
  // Estado dos resultados: { "Nome do Serviço": "Online" | "Offline" | "Verificando..." }
  const [results, setResults] = useState({});
  
  // Estado dos checkboxes: { "Nome do Serviço": true/false }
  const [checkedItems, setCheckedItems] = useState({});

  // Referência para abortar o fetch se clicar em Parar
  const abortControllerRef = useRef(null);

  // --- FUNÇÕES AUXILIARES ---
  
  const getServicesForPage = (p) => {
    switch(p) {
      case 'cameras': return SERVICES_CAMERAS;
      case 'wifi': return SERVICES_WIFI;
      case 'onus': return SERVICES_ONUS;
      default: return SERVICES_MAIN;
    }
  };

  const getTargetString = (service) => {
    let targetStr = service.target || 'N/A';
    if (service.tipo === 'port' && service.port) targetStr += `:${service.port}`;
    if (service.tipo === 'http') targetStr = targetStr.replace('https://', '').replace('http://', '');
    return targetStr;
  };

  // Marca/Desmarca todos da página atual
  const toggleSelectAll = (checked) => {
    const services = getServicesForPage(page);
    const newChecked = { ...checkedItems };
    services.forEach(s => newChecked[s.nome] = checked);
    setCheckedItems(newChecked);
  };

  const toggleItem = (name) => {
    setCheckedItems(prev => ({ ...prev, [name]: !prev[name] }));
  };

  // --- LÓGICA DE TESTE ---
  
  const startTest = async () => {
    if (isTesting) return;
    setIsTesting(true);
    
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    const currentServices = getServicesForPage(page);
    
    // Filtra os marcados (se undefined, considera marcado por padrão)
    const itemsToTest = currentServices
      .filter(s => checkedItems[s.nome] !== false)
      .map(s => s.nome);

    // Atualiza UI para "Verificando..."
    const initialResults = { ...results };
    itemsToTest.forEach(name => initialResults[name] = 'Verificando...');
    setResults(initialResults);

    try {
      const response = await fetch(`${API_BASE_URL}/api/status/${page}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items_to_test: itemsToTest }),
        signal: signal
      });

      if (!response.ok) throw new Error('Erro na API');

      const data = await response.json();
      
      // Atualiza com os resultados reais
      setResults(prev => ({ ...prev, ...data }));
      setLastRun(new Date().toLocaleString('pt-BR'));

    } catch (error) {
      if (error.name === 'AbortError') {
        setLastRun('Teste interrompido');
      } else {
        console.error(error);
        alert('Erro ao conectar com o servidor Python. Verifique se ele está rodando.');
      }
    } finally {
      setIsTesting(false);
    }
  };

  const stopTest = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  };

  // --- RENDERIZAÇÃO DOS ITENS ---

  const renderServiceItem = (service, displayName) => {
    const isChecked = checkedItems[service.nome] !== false; // Padrão true
    const status = results[service.nome] || 'Aguardando...';
    
    let badgeClass = 'status-aguardando';
    if (status === 'Online') badgeClass = 'status-online';
    if (status === 'Offline') badgeClass = 'status-offline';
    if (status === 'Verificando...') badgeClass = 'status-verificando';

    return (
      <div key={service.nome} className="service-row">
        <label className="service-label">
          <input 
            type="checkbox" 
            checked={isChecked} 
            onChange={() => toggleItem(service.nome)} 
          />
          {displayName || service.nome}
        </label>
        <div style={{display:'flex', alignItems:'center'}}>
           <span className="service-target">{getTargetString(service)}</span>
           <span className={`status-badge ${badgeClass}`}>{status}</span>
        </div>
      </div>
    );
  };

  // Renderização baseada na página
  const renderContent = () => {
    const services = getServicesForPage(page);

    if (page === 'main') {
      // Agrupa por 'group'
      const groups = {
        'acesso': { title: 'Controle de Acesso', items: [] },
        'infra': { title: 'Infraestrutura Core', items: [] },
        'servicos': { title: 'Serviços e Integrações', items: [] }
      };
      services.forEach(s => {
        const g = groups[s.group] ? s.group : 'servicos';
        groups[g].items.push(s);
      });

      return (
        <div className="monitor-grid">
          {Object.values(groups).map(group => (
            <div key={group.title} className="service-block">
              <div className="service-block-title">{group.title}</div>
              <div className="service-block-content">
                {group.items.map(s => renderServiceItem(s))}
              </div>
            </div>
          ))}
        </div>
      );
    }

    if (page === 'cameras') {
      // Agrupa por NVR
      const nvrGroups = {};
      Object.keys(NVR_IPS_CAMERAS).forEach(n => nvrGroups[n] = []);
      services.forEach(s => {
        if(nvrGroups[s.nvr]) nvrGroups[s.nvr].push(s);
      });

      return (
        <div className="monitor-grid">
          {Object.keys(nvrGroups).map(nvr => (
            <div key={nvr} className="service-block">
              <div className="service-block-title">NVR {nvr} ({NVR_IPS_CAMERAS[nvr]})</div>
              <div className="service-block-content">
                {nvrGroups[nvr].map(s => renderServiceItem(s, s.nome.replace(`NVR${nvr}-`, '')))}
              </div>
            </div>
          ))}
        </div>
      );
    }

    // Wifi e ONUs (Grid simples)
    return (
      <div className="monitor-grid">
        <div className="service-block" style={{gridColumn: '1 / -1'}}>
            <div className="service-block-title">{page === 'wifi' ? 'Pontos de Acesso Wi-Fi' : 'ONUs Fibra Óptica'}</div>
            <div className="service-block-content" style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(300px, 1fr))', gap:'10px'}}>
                 {services.map(s => renderServiceItem(s))}
            </div>
        </div>
      </div>
    );
  };

  return (
    <div className="monitor-container">
      
      {/* CONTROLES DE NAVEGAÇÃO */}
      <div className="monitor-nav">
        <button className={`nav-btn ${page==='main'?'active':'inactive'}`} onClick={()=>setPage('main')}>Principal</button>
        <button className={`nav-btn ${page==='cameras'?'active':'inactive'}`} onClick={()=>setPage('cameras')}>Câmeras</button>
        <button className={`nav-btn ${page==='wifi'?'active':'inactive'}`} onClick={()=>setPage('wifi')}>Wi-Fi</button>
        <button className={`nav-btn ${page==='onus'?'active':'inactive'}`} onClick={()=>setPage('onus')}>ONUs</button>
        
        <div className="nav-divider"></div>

        <button className="action-btn btn-test" onClick={startTest} disabled={isTesting}>
           {isTesting ? 'Testando...' : 'Testar Marcados'}
        </button>
        
        <button className="action-btn btn-stop" onClick={stopTest} disabled={!isTesting}>
           Parar
        </button>

        <div style={{marginLeft:'auto', fontSize:'0.9rem', color:'#555'}}>
           Último Teste: <strong>{lastRun}</strong>
        </div>
      </div>

      {/* CONTROLE DE MARCAR TODOS */}
      <div style={{textAlign:'center', marginBottom:'15px'}}>
         <label style={{cursor:'pointer', fontWeight:'500', color:'#4b5563'}}>
            <input type="checkbox" defaultChecked onChange={(e) => toggleSelectAll(e.target.checked)} /> Marcar/Desmarcar Todos desta página
         </label>
      </div>

      {/* ÁREA DE CONTEÚDO */}
      {renderContent()}

    </div>
  );
}