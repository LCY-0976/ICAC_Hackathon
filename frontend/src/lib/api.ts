import axios from 'axios';

const API_BASE_URL = '';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 seconds timeout
  timeoutErrorMessage: 'Request timeout - please check your connection and try again',
});

// Add auth token to requests if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle auth errors and timeouts
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.code, error.message, error.response?.status, error.response?.data);
    
    // Handle timeout errors
    if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
      console.error('Request timed out');
      error.message = 'Request timed out. Please check your connection and try again.';
    }
    
    // Handle network errors
    if (error.code === 'ERR_NETWORK' || !error.response) {
      console.error('Network error');
      error.message = 'Network error. Please check if the server is running and try again.';
    }
    
    // Handle authentication errors
    if (error.response?.status === 401) {
      console.warn('Authentication failed, redirecting to login');
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      
      // Only redirect if not already on login/register page
      if (!window.location.pathname.includes('/login') && !window.location.pathname.includes('/register')) {
        window.location.href = '/login';
      }
    }
    
    return Promise.reject(error);
  }
);

// Types
export interface User {
  user_name: string;
  user_id: string;
  user_password: string;
  company: string;
  e_signature: string;
  created_at: string;
  last_login: string;
}

export interface RegisterRequest {
  user_name: string;
  user_id: string;
  user_password: string;
  company: string;
}

export interface LoginRequest {
  user_id: string;
  user_password: string;
}

export interface ContractUpload {
  contract_title: string;
  contract_content: string;
  contract_amount: number;
  contract_type: string; // "internal" or "cross-company"
  other_company?: string; // Required if contract_type is "cross-company"
  uploader: string;
  timestamp: string;
}

export interface PendingContract {
  contract_id: string;
  contract_title: string;
  contract_content: string;
  contract_amount: number;
  contract_type: string; // "internal" or "cross-company"
  uploader_company: string;
  other_company?: string;
  uploader: string;
  company_signatures: { [key: string]: string[] }; // {"company_name": ["user1", "user2"]}
  created_at: string;
  status: string; // "pending", "completed", "cancelled"
  blockchain_index?: number;
}

export interface Block {
  index: number;
  hash: string;
  previousHash: string;
  data: {
    amount: number;
    senderKey: string;
    receiverKey: string;
    timestamp: number;
    timestamp_readable?: string;
  };
  contract_info?: {
    contract_id?: string;
    uploader_company?: string;
    type?: string;
    partner_company?: string;
    company?: string;
  };
  is_valid: boolean;
}

export interface BlockchainContract {
  block_index: number;
  hash: string;
  data: {
    amount: number;
    senderKey: string;
    receiverKey: string;
    timestamp: number;
    timestamp_readable: string;
  };
  contract_info: {
    contract_id?: string;
    uploader_company?: string;
    type?: string;
    partner_company?: string;
    company?: string;
  };
  is_valid: boolean;
}

export interface BlockchainInfo {
  message: string;
  chain_size: number;
  is_valid: boolean;
  using: string;
}

// Simple Risk Analysis Types
export interface SimpleRiskAnalysis {
  contract_id: string;
  risk_level: 'Low' | 'Medium' | 'High';
  risk_factors: string[];
  recommendations: string[];
  analysis_timestamp: string;
}

export interface BasicRiskSummary {
  total_contracts: number;
  high_risk_count: number;
  medium_risk_count: number;
  low_risk_count: number;
  total_value: number;
}

// Corruption Analysis Types
export interface CorruptionAnalysisResult {
  contract_id: string;
  corruption_risk_level: string;
  risk_score: number;
  corruption_indicators: string[];
  red_flags: string[];
  recommendations: string[];
  analysis_details: string;
  analysis_timestamp: string;
}

export interface CorruptionAnalysisResponse {
  success: boolean;
  message: string;
  analysis_type: 'lightrag_advanced' | 'enhanced_rules';
  contract_id: string;
  lightrag_analysis?: CorruptionAnalysisResult;
  fallback_analysis?: CorruptionAnalysisResult;
}

export interface BatchCorruptionAnalysis {
  success: boolean;
  message: string;
  summary: {
    total_contracts_analyzed: number;
    high_risk_contracts: number;
    total_contract_value: number;
    average_corruption_score: number;
    requires_immediate_attention: number;
  };
  detailed_results: Array<{
    contract_id: string;
    contract_title: string;
    contract_amount: number;
    corruption_risk_level: string;
    corruption_score: number;
    risk_factors: string[];
    recommendations: string[];
  }>;
  high_risk_contracts: Array<{
    contract_id: string;
    contract_title: string;
    contract_amount: number;
    corruption_risk_level: string;
    corruption_score: number;
    risk_factors: string[];
    recommendations: string[];
  }>;
}

// Word Analysis Types
export interface WordAnalysisRequest {
  contract_id: string;
  analysis_type: 'sensitive_word_detection';
  use_lightrag?: boolean;
  lightrag_api_url?: string;
}

export interface WordAnalysisResult {
  text_content: string;
  analysis_type: string;
  corruption_risk_level: string;
  risk_score: number;
  key_findings: string[];
  risk_indicators: string[];
  red_flags: string[];
  recommendations: string[];
  analysis_details: string;
  analysis_timestamp: string;
}

export interface WordAnalysisResponse {
  success: boolean;
  message: string;
  analysis_type: 'lightrag_advanced' | 'enhanced_rules';
  word_analysis?: WordAnalysisResult;
}

// Auth API
export const authAPI = {
  register: async (userData: RegisterRequest) => {
    const response = await api.post('/auth/register', userData);
    return response.data;
  },

  login: async (credentials: LoginRequest) => {
    const response = await api.post('/auth/login', credentials);
    return response.data;
  },

  logout: async () => {
    const response = await api.post('/auth/logout');
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    return response.data;
  },

  getProfile: async () => {
    const response = await api.get('/auth/profile');
    return response.data;
  },

  getAllUsers: async () => {
    const response = await api.get('/auth/users');
    return response.data;
  },

  getAllCompanies: async () => {
    const response = await api.get('/auth/companies');
    return response.data;
  },
};

// Contract API
export const contractAPI = {
  uploadContract: async (contract: ContractUpload) => {
    const response = await api.post('/api/contract/upload', contract);
    return response.data;
  },

  signContract: async (contractId: string) => {
    const response = await api.post(`/api/contract/sign/${contractId}`);
    return response.data;
  },

  getPendingContracts: async () => {
    const response = await api.get('/api/contracts/pending');
    return response.data;
  },

  getAllContracts: async () => {
    const response = await api.get('/api/contracts/all');
    return response.data;
  },

  getContractDetails: async (contractId: string) => {
    const response = await api.get(`/api/contract/${contractId}`);
    return response.data;
  },

  getUserContractsOnBlockchain: async () => {
    const response = await api.get('/api/user/contracts');
    return response.data;
  },
};

// Blockchain API
export const blockchainAPI = {
  getInfo: async (): Promise<BlockchainInfo> => {
    const response = await api.get('/api/blockchain/info');
    return response.data;
  },

  getBlock: async (index: number): Promise<{ message: string; block: Block; blockchain_valid: boolean }> => {
    const response = await api.get(`/api/block/${index}`);
    return response.data;
  },

  validateBlockchain: async () => {
    const response = await api.get('/api/blockchain/validate');
    return response.data;
  },

  exploreBlockchain: async (): Promise<{
    message: string;
    chain_size: number;
    is_valid: boolean;
    blocks: Block[];
    using: string;
  }> => {
    const response = await api.get('/api/blockchain/explore');
    return response.data;
  },

  getBlockchainContracts: async (): Promise<{
    message: string;
    company: string;
    contracts_count: number;
    contracts: BlockchainContract[];
    blockchain_valid: boolean;
  }> => {
    const response = await api.get('/api/blockchain/contracts');
    return response.data;
  },

  getStatus: async () => {
    const response = await api.get('/');
    return response.data;
  },

  exportBlockchainData: async (includeUserContracts: boolean = true) => {
    const response = await api.get(`/api/blockchain/export?include_user_contracts=${includeUserContracts}`);
    return response.data;
  },

  saveBlockchainJson: async (includeUserContracts: boolean = true) => {
    const response = await api.post(`/api/blockchain/save-json?include_user_contracts=${includeUserContracts}`);
    return response.data;
  },
};

// Export API for contracts and blockchain data
export const exportAPI = {
  exportContracts: async () => {
    const response = await api.get('/api/contracts/export');
    return response.data;
  },

  exportBlockchain: async (includeUserContracts: boolean = true) => {
    const response = await api.get(`/api/blockchain/export?include_user_contracts=${includeUserContracts}`);
    return response.data;
  },

  saveBlockchainToServer: async (includeUserContracts: boolean = true) => {
    const response = await api.post(`/api/blockchain/save-json?include_user_contracts=${includeUserContracts}`);
    return response.data;
  },
};

// Simple Risk Analysis API
export const riskAPI = {
  analyzeContract: async (contractId: string): Promise<{ success: boolean; analysis: SimpleRiskAnalysis; message: string }> => {
    const response = await api.post(`/api/risk/analyze/${contractId}`);
    return response.data;
  },

  getRiskSummary: async (): Promise<{ success: boolean; summary: BasicRiskSummary; message: string }> => {
    const response = await api.get('/api/risk/summary');
    return response.data;
  },
};

// Corruption Analysis API
export const corruptionAPI = {
  analyzeContract: async (contractId: string, useLightRAG: boolean = true): Promise<CorruptionAnalysisResponse> => {
    const response = await api.post(`/api/corruption/analyze/${contractId}`, {
      contract_id: contractId,
      use_lightrag: useLightRAG,
      lightrag_api_url: 'http://localhost:9621'
    });
    return response.data;
  },

  batchAnalyze: async (): Promise<BatchCorruptionAnalysis> => {
    const response = await api.get('/api/corruption/batch-analyze');
    return response.data;
  },
};

// Word Analysis API
export const wordAnalysisAPI = {
  analyzeContract: async (request: WordAnalysisRequest): Promise<WordAnalysisResponse> => {
    const response = await api.post('/api/word/analyze', {
      contract_id: request.contract_id,
      analysis_type: request.analysis_type,
      use_lightrag: request.use_lightrag ?? true,
      lightrag_api_url: request.lightrag_api_url ?? 'http://localhost:9621'
    });
    return response.data;
  },
};

export default api;
