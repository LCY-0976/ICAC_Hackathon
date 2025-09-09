import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  Zap, 
  FileText, 
  BarChart3,
  Search,
  Bot,
  Calendar
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useAuth } from '@/contexts/AuthContext';
import { 
  contractAPI, 
  corruptionAPI, 
  type PendingContract, 
  type CorruptionAnalysisResponse,
  type BatchCorruptionAnalysis 
} from '@/lib/api';
import { formatCurrency } from '@/lib/utils';

type TabType = 'overview' | 'individual' | 'batch';

export function CorruptionAnalysisPage() {
  const { } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [contracts, setContracts] = useState<PendingContract[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedContract, setSelectedContract] = useState<string>('');
  const [analysisResult, setAnalysisResult] = useState<CorruptionAnalysisResponse | null>(null);
  const [batchResult, setBatchResult] = useState<BatchCorruptionAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isBatchAnalyzing, setIsBatchAnalyzing] = useState(false);
  const [error, setError] = useState('');
  const useLightRAG = true; // Always use LightRAG

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

  const handleIndividualAnalysis = async (contractId: string) => {
    if (!contractId) return;

    try {
      setIsAnalyzing(true);
      setError('');
      setAnalysisResult(null);

      const response = await corruptionAPI.analyzeContract(contractId, useLightRAG);
      console.log('Analysis response:', response);
      console.log('LightRAG Analysis:', response.lightrag_analysis);
      console.log('Fallback Analysis:', response.fallback_analysis);
      console.log('Analysis Type:', response.analysis_type);
      setAnalysisResult(response);
    } catch (error: any) {
      console.error('Analysis error:', error);
      if (error.response?.status === 503) {
        setError('LightRAG service is unavailable. Please ensure LightRAG is running and try again.');
      } else {
        setError('Failed to analyze contract. Please check that LightRAG is running and try again.');
      }
    } finally {
      setIsAnalyzing(false);
    }
  };

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

  const filteredContracts = contracts.filter(contract =>
    !searchTerm || 
    contract.contract_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contract.contract_id.toLowerCase().includes(searchTerm.toLowerCase())
  );

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

  const getRiskIcon = (level: string) => {
    switch (level.toLowerCase()) {
      case 'high':
      case 'critical':
        return <AlertTriangle className="text-red-500" size={20} />;
      case 'medium':
      case 'moderate':
        return <Shield className="text-yellow-500" size={20} />;
      case 'low':
      case 'minimal':
        return <CheckCircle className="text-green-500" size={20} />;
      default:
        return <Shield className="text-gray-500" size={20} />;
    }
  };

  // Helper function to get the analysis data
  const getActiveAnalysis = (result: CorruptionAnalysisResponse) => {
    return result.lightrag_analysis;
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'individual', label: 'Individual Analysis', icon: FileText },
    { id: 'batch', label: 'Batch Analysis', icon: Zap },
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
                  onClick={() => setActiveTab('individual')} 
                  className="h-20 text-left p-4"
                  variant="outline"
                >
                  <div className="flex items-center space-x-3">
                    <FileText className="text-primary" size={24} />
                    <div>
                      <div className="font-medium">Individual Analysis</div>
                      <div className="text-sm text-gray-600">Analyze specific contracts</div>
                    </div>
                  </div>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Recent Results */}
          {(analysisResult || batchResult) && (
            <Card>
              <CardHeader>
                <CardTitle>Recent Analysis Results</CardTitle>
                <CardDescription>
                  Latest corruption risk assessment results
                </CardDescription>
              </CardHeader>
              <CardContent>
                {analysisResult && (
                  <div className="p-4 border rounded-md mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">Individual Analysis</h4>
                      <Badge variant={analysisResult.success ? 'success' : 'destructive'}>
                        {analysisResult.analysis_type === 'lightrag_advanced' ? 'AI Analysis' : 'Rule Analysis'}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600">{analysisResult.message}</p>
                  </div>
                )}

                {batchResult && (
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
                )}
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {activeTab === 'individual' && (
        <div className="space-y-6">
          {/* Contract Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Select Contract for Analysis</CardTitle>
              <CardDescription>
                Choose a specific contract to analyze for corruption risks
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <Input
                    placeholder="Search contracts..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>

                {/* Contract Dropdown */}
                <select
                  value={selectedContract}
                  onChange={(e) => setSelectedContract(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
                >
                  <option value="">Select a contract</option>
                  {filteredContracts.map((contract) => (
                    <option key={contract.contract_id} value={contract.contract_id}>
                      {contract.contract_title} - {formatCurrency(contract.contract_amount)}
                    </option>
                  ))}
                </select>

                {/* Analysis Button */}
                <Button 
                  onClick={() => handleIndividualAnalysis(selectedContract)}
                  disabled={!selectedContract || isAnalyzing}
                  className="w-full"
                >
                  {isAnalyzing ? (
                    <>
                      <LoadingSpinner size="sm" className="mr-2" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Shield size={16} className="mr-2" />
                      Analyze Contract
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Analysis Results */}
          {analysisResult && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Analysis Results</CardTitle>
                    <CardDescription>
                      Corruption risk assessment for selected contract
                    </CardDescription>
                  </div>
                  <Badge variant={analysisResult.success ? 'success' : 'destructive'}>
                    {analysisResult.analysis_type === 'lightrag_advanced' ? 'AI Analysis' : 'Rule Analysis'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                {analysisResult.success ? (
                  <div className="space-y-6">
                    {/* Analysis Source Indicator */}
                    <div className="flex items-center justify-between p-3 rounded-md bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200">
                      <div className="flex items-center space-x-3">
                        <Bot className="text-blue-500" size={24} />
                        <div>
                          <h4 className="font-medium">
                            LightRAG AI Analysis
                          </h4>
                          <p className="text-sm text-gray-600">
                            Advanced AI-powered corruption detection with knowledge graph reasoning
                          </p>
                        </div>
                      </div>
                      <Badge variant="default">
                        LightRAG AI
                      </Badge>
                    </div>

                    {/* Risk Level */}
                    {getActiveAnalysis(analysisResult) && (
                      <div className="flex items-center space-x-4">
                        {getRiskIcon(getActiveAnalysis(analysisResult)!.corruption_risk_level)}
                        <div>
                          <h3 className="text-lg font-semibold">
                            Risk Level: {getActiveAnalysis(analysisResult)!.corruption_risk_level}
                          </h3>
                          <p className="text-sm text-gray-600">
                            Risk Score: {getActiveAnalysis(analysisResult)!.risk_score}/100
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Risk Indicators */}
                    {(getActiveAnalysis(analysisResult)?.corruption_indicators.length || 0) > 0 && (
                      <div>
                        <h4 className="font-medium mb-2">Risk Indicators</h4>
                        <div className="space-y-2">
                          {getActiveAnalysis(analysisResult)!.corruption_indicators.map((indicator, index) => (
                            <div key={index} className="flex items-center space-x-2 p-2 bg-yellow-50 rounded-md">
                              <AlertTriangle className="text-yellow-500" size={16} />
                              <span className="text-sm">{indicator}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Red Flags */}
                    {(getActiveAnalysis(analysisResult)?.red_flags.length || 0) > 0 && (
                      <div>
                        <h4 className="font-medium mb-2">Red Flags</h4>
                        <div className="space-y-2">
                          {getActiveAnalysis(analysisResult)!.red_flags.map((flag, index) => (
                            <div key={index} className="flex items-center space-x-2 p-2 bg-red-50 rounded-md">
                              <AlertTriangle className="text-red-500" size={16} />
                              <span className="text-sm">{flag}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Recommendations */}
                    {(getActiveAnalysis(analysisResult)?.recommendations.length || 0) > 0 && (
                      <div>
                        <h4 className="font-medium mb-2">Recommendations</h4>
                        <div className="space-y-2">
                          {getActiveAnalysis(analysisResult)!.recommendations.map((rec, index) => (
                            <div key={index} className="flex items-center space-x-2 p-2 bg-blue-50 rounded-md">
                              <CheckCircle className="text-blue-500" size={16} />
                              <span className="text-sm">{rec}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Detailed Analysis */}
                    {getActiveAnalysis(analysisResult)?.analysis_details && (
                      <div>
                        <h4 className="font-medium mb-2">Detailed Analysis</h4>
                        <div className="p-4 bg-gray-50 rounded-md">
                          <p className="text-sm whitespace-pre-wrap">
                            {getActiveAnalysis(analysisResult)!.analysis_details}
                          </p>
                        </div>
                      </div>
                    )}

                  </div>
                ) : (
                  <div className="text-center py-8">
                    <AlertTriangle className="mx-auto text-red-500 mb-4" size={48} />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Analysis Failed</h3>
                    <p className="text-gray-600">{analysisResult.message}</p>
                  </div>
                )}
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
    </div>
  );
}
