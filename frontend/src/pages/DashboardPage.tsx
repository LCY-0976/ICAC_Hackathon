import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  BarChart3, 
  FileText, 
  Shield, 
  Plus, 
  DollarSign,
  Database,
  Hash
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useAuth } from '@/contexts/AuthContext';
import { blockchainAPI, riskAPI, type BlockchainInfo, type BasicRiskSummary } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/utils';
import { useContracts } from '@/hooks/useContracts';

export function DashboardPage() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const { contracts } = useContracts();
  const [blockchainInfo, setBlockchainInfo] = useState<BlockchainInfo | null>(null);
  const [riskSummary, setRiskSummary] = useState<BasicRiskSummary | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);
        
        // Fetch dashboard data (contracts handled by useContracts hook)
        const [blockchainResponse, riskResponse] = await Promise.allSettled([
          blockchainAPI.getInfo(),
          riskAPI.getRiskSummary()
        ]);

        // Handle blockchain data
        if (blockchainResponse.status === 'fulfilled') {
          setBlockchainInfo(blockchainResponse.value);
        }

        // Handle risk summary data
        if (riskResponse.status === 'fulfilled' && riskResponse.value.success) {
          setRiskSummary(riskResponse.value.summary);
        }

      } catch (error) {
        console.error('Dashboard data fetch error:', error);
        setError('Failed to load dashboard data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <LoadingSpinner size="lg" className="mx-auto mb-4" />
            <p className="text-gray-600">Loading dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  const pendingContracts = contracts.filter(c => c.status === 'pending');

  const totalContractValue = contracts.reduce((sum, contract) => sum + contract.contract_amount, 0);

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600 mt-1">
              Welcome back, {user?.user_name}! Here's an overview of your contracts and system status.
            </p>
          </div>
          
          <div className="mt-4 md:mt-0 flex flex-col sm:flex-row gap-2">
            <Link to="/blockchain-explorer">
              <Button variant="outline" className="w-full sm:w-auto">
                <Database size={16} className="mr-2" />
                Blockchain Explorer
              </Button>
            </Link>
            <Link to="/corruption-analysis">
              <Button variant="outline" className="w-full sm:w-auto">
                <Shield size={16} className="mr-2" />
                Corruption Analysis
              </Button>
            </Link>
            <Link to="/upload-contract">
              <Button className="w-full sm:w-auto">
                <Plus size={16} className="mr-2" />
                Upload Contract
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Total Contracts */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Total Contracts</CardTitle>
              <FileText className="text-primary" size={20} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{contracts.length}</div>
            <p className="text-xs text-gray-600">
              {pendingContracts.length} pending
            </p>
          </CardContent>
        </Card>

        {/* Contract Value */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Total Value</CardTitle>
              <DollarSign className="text-green-500" size={20} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalContractValue)}</div>
            <p className="text-xs text-gray-600">
              Across all contracts
            </p>
          </CardContent>
        </Card>

        {/* Risk Assessment */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Risk Assessment</CardTitle>
              <Shield className="text-yellow-500" size={20} />
            </div>
          </CardHeader>
          <CardContent>
            {riskSummary ? (
              <>
                <div className="text-2xl font-bold">
                  {riskSummary.high_risk_count + riskSummary.medium_risk_count}
                </div>
                <p className="text-xs text-gray-600">
                  Contracts need attention
                </p>
              </>
            ) : (
              <>
                <div className="text-2xl font-bold">-</div>
                <p className="text-xs text-gray-600">Analysis pending</p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Blockchain Status */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Blockchain</CardTitle>
              <BarChart3 className="text-blue-500" size={20} />
            </div>
          </CardHeader>
          <CardContent>
            {blockchainInfo ? (
              <>
                <div className="text-2xl font-bold">{blockchainInfo.chain_size}</div>
                <p className="text-xs text-gray-600">
                  {blockchainInfo.is_valid ? '✓ Valid' : '✗ Invalid'} chain
                </p>
              </>
            ) : (
              <>
                <div className="text-2xl font-bold">-</div>
                <p className="text-xs text-gray-600">Status unknown</p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Contracts */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Recent Contracts</CardTitle>
                <CardDescription>
                  Latest contract activity requiring your attention
                </CardDescription>
              </div>
              <Link to="/contracts">
                <Button variant="outline" size="sm">
                  View All
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {contracts.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="mx-auto text-gray-400 mb-4" size={48} />
                <p className="text-gray-600 mb-4">No contracts found</p>
                <Link to="/upload-contract">
                  <Button size="sm">
                    <Plus size={16} className="mr-2" />
                    Upload First Contract
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {contracts.slice(0, 5).map((contract) => (
                  <div key={contract.contract_id} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                    <div className="flex-1">
                      <h4 className="font-medium text-sm">{contract.contract_title}</h4>
                      <p className="text-xs text-gray-600">
                        {formatCurrency(contract.contract_amount)} • {formatDate(contract.created_at)}
                      </p>
                      <p className="text-xs text-gray-500">
                        {contract.uploader_company}
                        {contract.other_company && ` ↔ ${contract.other_company}`}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge 
                        variant={
                          contract.status === 'completed' ? 'success' :
                          contract.status === 'pending' ? 'secondary' : 'destructive'
                        }
                      >
                        {contract.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions & Risk Overview */}
        <Card>
          <CardHeader>
            <CardTitle>Risk Overview & Actions</CardTitle>
            <CardDescription>
              Security analysis and quick actions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Risk Summary */}
              {riskSummary && (
                <div className="space-y-3">
                  <h4 className="font-medium text-sm">Risk Analysis</h4>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="text-center p-3 bg-red-50 rounded-md">
                      <div className="text-lg font-bold text-red-600">{riskSummary.high_risk_count}</div>
                      <div className="text-xs text-red-600">High Risk</div>
                    </div>
                    <div className="text-center p-3 bg-yellow-50 rounded-md">
                      <div className="text-lg font-bold text-yellow-600">{riskSummary.medium_risk_count}</div>
                      <div className="text-xs text-yellow-600">Medium Risk</div>
                    </div>
                    <div className="text-center p-3 bg-green-50 rounded-md">
                      <div className="text-lg font-bold text-green-600">{riskSummary.low_risk_count}</div>
                      <div className="text-xs text-green-600">Low Risk</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Quick Actions */}
              <div className="space-y-3">
                <h4 className="font-medium text-sm">Quick Actions</h4>
                <div className="space-y-2">
                  <Link to="/blockchain-explorer" className="block">
                    <Button variant="outline" className="w-full justify-start">
                      <Database size={16} className="mr-2" />
                      Explore Blockchain
                    </Button>
                  </Link>
                  <Link to="/create-block" className="block">
                    <Button variant="outline" className="w-full justify-start">
                      <Hash size={16} className="mr-2" />
                      Create Test Block
                    </Button>
                  </Link>
                  <Link to="/corruption-analysis" className="block">
                    <Button variant="outline" className="w-full justify-start">
                      <Shield size={16} className="mr-2" />
                      Run Corruption Analysis
                    </Button>
                  </Link>
                  <Link to="/contracts" className="block">
                    <Button variant="outline" className="w-full justify-start">
                      <FileText size={16} className="mr-2" />
                      Manage Contracts
                    </Button>
                  </Link>
                  <Link to="/upload-contract" className="block">
                    <Button variant="outline" className="w-full justify-start">
                      <Plus size={16} className="mr-2" />
                      Upload New Contract
                    </Button>
                  </Link>
                </div>
              </div>

              {/* System Status */}
              <div className="space-y-3">
                <h4 className="font-medium text-sm">System Status</h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <span className="text-sm">Blockchain</span>
                    <Badge variant={blockchainInfo?.is_valid ? 'success' : 'destructive'}>
                      {blockchainInfo?.is_valid ? 'Valid' : 'Error'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <span className="text-sm">API Status</span>
                    <Badge variant="success">Online</Badge>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
