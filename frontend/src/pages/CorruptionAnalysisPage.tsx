import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Shield, 
  AlertTriangle, 
  Zap, 
  FileText, 
  BarChart3,
  Bot,
  Calendar,
  MessageSquare,
  Send
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useAuth } from '@/contexts/AuthContext';
import { 
  contractAPI, 
  corruptionAPI,
  wordAnalysisAPI,
  type PendingContract, 
  type BatchCorruptionAnalysis,
  type WordAnalysisResponse,
  type WordAnalysisRequest 
} from '@/lib/api';
import { formatCurrency } from '@/lib/utils';

type TabType = 'overview' | 'batch' | 'word-analysis';

export function CorruptionAnalysisPage() {
  const { } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [contracts, setContracts] = useState<PendingContract[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [batchResult, setBatchResult] = useState<BatchCorruptionAnalysis | null>(null);
  const [isBatchAnalyzing, setIsBatchAnalyzing] = useState(false);
  const [selectedContractId, setSelectedContractId] = useState<string>('');
  const [wordAnalysisType] = useState<'sensitive_word_detection'>('sensitive_word_detection');
  const [wordAnalysisResult, setWordAnalysisResult] = useState<WordAnalysisResponse | null>(null);
  const [isWordAnalyzing, setIsWordAnalyzing] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchContracts = async () => {
      try {
        setIsLoading(true);
        setError('');

        // Fetch contracts
        let response;
        try {
          response = await contractAPI.getAllContracts();
        } catch {
          response = await contractAPI.getPendingContracts();
        }

        if (response.success) {
          setContracts(response.contracts || []);
        } else {
          setError(response.message || 'Failed to load contracts');
        }
      } catch (error) {
        console.error('Error fetching contracts:', error);
        setError('Failed to connect to the server');
      } finally {
        setIsLoading(false);
      }
    };

    fetchContracts();
  }, []);


  const handleBatchAnalysis = async () => {
    try {
      setIsBatchAnalyzing(true);
      setError('');
      setBatchResult(null);

      const response = await corruptionAPI.batchAnalyze();
      setBatchResult(response);
    } catch (error) {
      console.error('Batch analysis error:', error);
      setError('Failed to perform batch analysis. Please try again.');
    } finally {
      setIsBatchAnalyzing(false);
    }
  };

  const handleWordAnalysis = async () => {
    if (!selectedContractId) {
      setError('Please select a contract for analysis.');
      return;
    }

    try {
      setIsWordAnalyzing(true);
      setError('');
      setWordAnalysisResult(null);

      const request: WordAnalysisRequest = {
        contract_id: selectedContractId,
        analysis_type: wordAnalysisType,
        use_lightrag: true,
        lightrag_api_url: 'http://localhost:9621'
      };

      const response = await wordAnalysisAPI.analyzeContract(request);
      setWordAnalysisResult(response);
    } catch (error: any) {
      console.error('Word analysis error:', error);
      if (error.response?.status === 503) {
        setError('LightRAG service is unavailable. Please ensure LightRAG is running and try again.');
      } else if (error.response?.status === 404) {
        setError('Selected contract not found. Please try again.');
      } else {
        setError('Failed to analyze contract. Please check that LightRAG is running and try again.');
      }
    } finally {
      setIsWordAnalyzing(false);
    }
  };


  const getRiskLevelColor = (level: string) => {
    switch (level.toLowerCase()) {
      case 'high':
      case 'critical':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'medium':
      case 'moderate':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low':
      case 'minimal':
        return 'text-green-600 bg-green-50 border-green-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };



  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'batch', label: 'Batch Analysis', icon: Zap },
    { id: 'word-analysis', label: 'Sensitive Word Detection', icon: MessageSquare },
  ];

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <LoadingSpinner size="lg" className="mx-auto mb-4" />
            <p className="text-gray-600">Loading corruption analysis...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center">
              <Shield className="mr-3 text-primary" size={32} />
              Corruption Analysis
            </h1>
            <p className="text-gray-600 mt-1">
              AI-powered corruption risk assessment and detection system
            </p>
          </div>
          
          <div className="mt-4 md:mt-0">
            <Link to="/contracts">
              <Button variant="outline" className="w-full sm:w-auto">
                <FileText size={16} className="mr-2" />
                View Contracts
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="text-red-500" size={20} />
            <p className="text-red-600">{error}</p>
          </div>
        </div>
      )}

      {/* Analysis Mode Info */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Bot className="text-blue-500" size={24} />
              <div>
                <h3 className="font-medium">
                  AI-Powered Corruption Analysis
                </h3>
                <p className="text-sm text-gray-600">
                  Using LightRAG for advanced corruption detection with AI reasoning and knowledge graph technology
                </p>
              </div>
            </div>
            <Badge variant="default">
              LightRAG AI
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as TabType)}
                  className={`flex items-center space-x-2 py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-primary text-primary'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon size={16} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium">Total Contracts</CardTitle>
                  <FileText className="text-blue-500" size={20} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{contracts.length}</div>
                <p className="text-xs text-gray-600">Available for analysis</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium">Analysis Engine</CardTitle>
                  <Bot className="text-blue-500" size={20} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">LightRAG</div>
                <p className="text-xs text-gray-600">
                  AI-powered detection
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium">Risk Assessment</CardTitle>
                  <Shield className="text-yellow-500" size={20} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">Ready</div>
                <p className="text-xs text-gray-600">System operational</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium">Last Analysis</CardTitle>
                  <Calendar className="text-green-500" size={20} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">-</div>
                <p className="text-xs text-gray-600">No recent analysis</p>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>
                Start analyzing your contracts for corruption risks
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button 
                  onClick={() => setActiveTab('batch')} 
                  className="h-20 text-left p-4"
                  variant="outline"
                >
                  <div className="flex items-center space-x-3">
                    <Zap className="text-primary" size={24} />
                    <div>
                      <div className="font-medium">Batch Analysis</div>
                      <div className="text-sm text-gray-600">Analyze all contracts at once</div>
                    </div>
                  </div>
                </Button>

                <Button 
                  onClick={() => setActiveTab('word-analysis')} 
                  className="h-20 text-left p-4"
                  variant="outline"
                >
                  <div className="flex items-center space-x-3">
                    <MessageSquare className="text-primary" size={24} />
                    <div>
                      <div className="font-medium">Sensitive Word Detection</div>
                      <div className="text-sm text-gray-600">Detect inappropriate and problematic language</div>
                    </div>
                  </div>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Recent Results */}
          {batchResult && (
            <Card>
              <CardHeader>
                <CardTitle>Recent Analysis Results</CardTitle>
                <CardDescription>
                  Latest corruption risk assessment results
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="p-4 border rounded-md">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">Batch Analysis</h4>
                    <Badge variant={batchResult.success ? 'success' : 'destructive'}>
                      {batchResult.summary.total_contracts_analyzed} contracts analyzed
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600">
                    {batchResult.summary.high_risk_contracts} high-risk contracts found
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}


      {activeTab === 'batch' && (
        <div className="space-y-6">
          {/* Batch Analysis */}
          <Card>
            <CardHeader>
              <CardTitle>Batch Corruption Analysis</CardTitle>
              <CardDescription>
                Analyze all contracts simultaneously for comprehensive risk assessment
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-blue-50 rounded-md">
                  <div>
                    <h4 className="font-medium">Ready to analyze {contracts.length} contracts</h4>
                    <p className="text-sm text-gray-600">
                      This will perform corruption risk analysis on all available contracts
                    </p>
                  </div>
                  <Button 
                    onClick={handleBatchAnalysis}
                    disabled={isBatchAnalyzing || contracts.length === 0}
                  >
                    {isBatchAnalyzing ? (
                      <>
                        <LoadingSpinner size="sm" className="mr-2" />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <Zap size={16} className="mr-2" />
                        Start Batch Analysis
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Batch Results */}
          {batchResult && (
            <Card>
              <CardHeader>
                <CardTitle>Batch Analysis Results</CardTitle>
                <CardDescription>
                  Comprehensive corruption risk assessment across all contracts
                </CardDescription>
              </CardHeader>
              <CardContent>
                {batchResult.success ? (
                  <div className="space-y-6">
                    {/* Summary Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="text-center p-4 bg-blue-50 rounded-md">
                        <div className="text-2xl font-bold text-blue-600">
                          {batchResult.summary.total_contracts_analyzed}
                        </div>
                        <div className="text-sm text-blue-600">Contracts Analyzed</div>
                      </div>
                      <div className="text-center p-4 bg-red-50 rounded-md">
                        <div className="text-2xl font-bold text-red-600">
                          {batchResult.summary.high_risk_contracts}
                        </div>
                        <div className="text-sm text-red-600">High Risk</div>
                      </div>
                      <div className="text-center p-4 bg-green-50 rounded-md">
                        <div className="text-2xl font-bold text-green-600">
                          {formatCurrency(batchResult.summary.total_contract_value)}
                        </div>
                        <div className="text-sm text-green-600">Total Value</div>
                      </div>
                      <div className="text-center p-4 bg-yellow-50 rounded-md">
                        <div className="text-2xl font-bold text-yellow-600">
                          {batchResult.summary.average_corruption_score.toFixed(1)}
                        </div>
                        <div className="text-sm text-yellow-600">Avg Risk Score</div>
                      </div>
                    </div>

                    {/* High Risk Contracts */}
                    {batchResult.high_risk_contracts.length > 0 && (
                      <div>
                        <h4 className="font-medium mb-4 flex items-center">
                          <AlertTriangle className="text-red-500 mr-2" size={20} />
                          High Risk Contracts ({batchResult.high_risk_contracts.length})
                        </h4>
                        <div className="space-y-3">
                          {batchResult.high_risk_contracts.map((contract) => (
                            <div key={contract.contract_id} className="p-4 border border-red-200 bg-red-50 rounded-md">
                              <div className="flex items-center justify-between mb-2">
                                <h5 className="font-medium">{contract.contract_title}</h5>
                                <div className="flex items-center space-x-2">
                                  <Badge variant="destructive">
                                    {contract.corruption_risk_level}
                                  </Badge>
                                  <span className="text-sm font-medium">
                                    Score: {contract.corruption_score}/100
                                  </span>
                                </div>
                              </div>
                              <p className="text-sm text-gray-600 mb-2">
                                Value: {formatCurrency(contract.contract_amount)}
                              </p>
                              <div className="text-sm">
                                <strong>Risk Factors:</strong>
                                <ul className="list-disc list-inside mt-1 space-y-1">
                                  {contract.risk_factors.map((factor, index) => (
                                    <li key={index}>{factor}</li>
                                  ))}
                                </ul>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* All Results */}
                    <div>
                      <h4 className="font-medium mb-4">All Analysis Results</h4>
                      <div className="space-y-2 max-h-96 overflow-y-auto">
                        {batchResult.detailed_results.map((result) => (
                          <div key={result.contract_id} className={`p-3 border rounded-md ${getRiskLevelColor(result.corruption_risk_level)}`}>
                            <div className="flex items-center justify-between">
                              <div>
                                <h6 className="font-medium">{result.contract_title}</h6>
                                <p className="text-sm opacity-75">
                                  {formatCurrency(result.contract_amount)} • Score: {result.corruption_score}/100
                                </p>
                              </div>
                              <Badge variant={
                                result.corruption_risk_level.toLowerCase() === 'high' ? 'destructive' :
                                result.corruption_risk_level.toLowerCase() === 'medium' ? 'secondary' : 'success'
                              }>
                                {result.corruption_risk_level}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <AlertTriangle className="mx-auto text-red-500 mb-4" size={48} />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Batch Analysis Failed</h3>
                    <p className="text-gray-600">{batchResult.message}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {activeTab === 'word-analysis' && (
        <div className="space-y-6">
          {/* Word Analysis Input */}
          <Card>
            <CardHeader>
              <CardTitle>Sensitive Word Detection</CardTitle>
              <CardDescription>
                Analyze contract content for sensitive words and potentially problematic language using AI
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Contract Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Contract to Analyze
                  </label>
                  <select
                    value={selectedContractId}
                    onChange={(e) => setSelectedContractId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
                  >
                    <option value="">Choose a contract...</option>
                    {contracts.map((contract) => (
                      <option key={contract.contract_id} value={contract.contract_id}>
                        {contract.contract_title} - {formatCurrency(contract.contract_amount)}
                      </option>
                    ))}
                  </select>
                  {selectedContractId && (
                    <div className="mt-2 text-sm text-gray-600">
                      Selected: {contracts.find(c => c.contract_id === selectedContractId)?.contract_title}
                    </div>
                  )}
                </div>

                {/* Analysis Button */}
                <Button 
                  onClick={handleWordAnalysis}
                  disabled={!selectedContractId || isWordAnalyzing}
                  className="w-full"
                >
                  {isWordAnalyzing ? (
                    <>
                      <LoadingSpinner size="sm" className="mr-2" />
                      Analyzing Contract...
                    </>
                  ) : (
                    <>
                      <Send size={16} className="mr-2" />
                      Analyze Contract for Sensitive Words
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Word Analysis Results */}
          {wordAnalysisResult && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Sensitive Word Detection Results</CardTitle>
                    <CardDescription>
                      AI-powered sensitive word analysis results
                    </CardDescription>
                  </div>
                  <Badge variant={wordAnalysisResult.success ? 'success' : 'destructive'}>
                    {wordAnalysisResult.analysis_type === 'lightrag_advanced' ? 'AI Detection' : 'Rule Detection'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                {wordAnalysisResult.success && wordAnalysisResult.word_analysis ? (
                  <div className="space-y-6">
                    {/* Analysis Source Indicator */}
                    <div className="flex items-center justify-between p-3 rounded-md bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200">
                      <div className="flex items-center space-x-3">
                        <Bot className="text-blue-500" size={24} />
                        <div>
                          <h4 className="font-medium">
                            LightRAG AI Sensitive Word Detection
                          </h4>
                          <p className="text-sm text-gray-600">
                            Advanced AI-powered language analysis for sensitive content detection
                          </p>
                        </div>
                      </div>
                      <Badge variant="default">
                        SENSITIVE DETECTION
                      </Badge>
                    </div>

                    {/* Risk Level */}
                    <div className="flex items-center space-x-4">
                      <div className={`p-2 rounded-md ${getRiskLevelColor(wordAnalysisResult.word_analysis.corruption_risk_level)}`}>
                        <Shield size={20} />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold">
                          Risk Level: {wordAnalysisResult.word_analysis.corruption_risk_level}
                        </h3>
                        <p className="text-sm text-gray-600">
                          Risk Score: {wordAnalysisResult.word_analysis.risk_score}/100
                        </p>
                      </div>
                    </div>

                    {/* Key Findings */}
                    {wordAnalysisResult.word_analysis.key_findings.length > 0 && (
                      <div>
                        <h4 className="font-medium mb-2">Key Findings</h4>
                        <div className="space-y-2">
                          {wordAnalysisResult.word_analysis.key_findings.map((finding, index) => (
                            <div key={index} className="flex items-center space-x-2 p-2 bg-blue-50 rounded-md">
                              <FileText className="text-blue-500" size={16} />
                              <span className="text-sm">{finding}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Risk Indicators */}
                    {wordAnalysisResult.word_analysis.risk_indicators.length > 0 && (
                      <div>
                        <h4 className="font-medium mb-2">Risk Indicators</h4>
                        <div className="space-y-2">
                          {wordAnalysisResult.word_analysis.risk_indicators.map((indicator, index) => (
                            <div key={index} className="flex items-center space-x-2 p-2 bg-yellow-50 rounded-md">
                              <AlertTriangle className="text-yellow-500" size={16} />
                              <span className="text-sm">{indicator}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Red Flags */}
                    {wordAnalysisResult.word_analysis.red_flags.length > 0 && (
                      <div>
                        <h4 className="font-medium mb-2">Red Flags</h4>
                        <div className="space-y-2">
                          {wordAnalysisResult.word_analysis.red_flags.map((flag, index) => (
                            <div key={index} className="flex items-center space-x-2 p-2 bg-red-50 rounded-md">
                              <AlertTriangle className="text-red-500" size={16} />
                              <span className="text-sm">{flag}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Recommendations */}
                    {wordAnalysisResult.word_analysis.recommendations.length > 0 && (
                      <div>
                        <h4 className="font-medium mb-2">Recommendations</h4>
                        <div className="space-y-2">
                          {wordAnalysisResult.word_analysis.recommendations.map((rec, index) => (
                            <div key={index} className="flex items-center space-x-2 p-2 bg-green-50 rounded-md">
                              <Shield className="text-green-500" size={16} />
                              <span className="text-sm">{rec}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Detailed Analysis */}
                    {wordAnalysisResult.word_analysis.analysis_details && (
                      <div>
                        <h4 className="font-medium mb-2">Detailed Analysis</h4>
                        <div className="p-4 bg-gray-50 rounded-md">
                          <p className="text-sm whitespace-pre-wrap">
                            {wordAnalysisResult.word_analysis.analysis_details}
                          </p>
                        </div>
                      </div>
                    )}

                  </div>
                ) : (
                  <div className="text-center py-8">
                    <AlertTriangle className="mx-auto text-red-500 mb-4" size={48} />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Analysis Failed</h3>
                    <p className="text-gray-600">{wordAnalysisResult.message}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
