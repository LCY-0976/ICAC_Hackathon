import { useState, useEffect } from 'react';
import { 
  Link, 
  BarChart3, 
  Download, 
  RefreshCw, 
  Database, 
  Hash, 
  Clock, 
  FileText, 
  CheckCircle, 
  AlertCircle,
  Plus,
  Search,
  Filter
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Input } from '@/components/ui/Input';
import { useAuth } from '@/contexts/AuthContext';
import { blockchainAPI, type Block, type BlockchainContract } from '@/lib/api';
import { formatCurrency, formatDate, truncateHash } from '@/lib/utils';

interface BlockchainExportData {
  exported_at: string;
  blockchain_info: {
    chain_size: number;
    is_valid: boolean;
    using: string;
  };
  blocks: Block[];
  user_contracts?: BlockchainContract[];
  export_metadata: {
    user: string;
    company: string;
    total_blocks: number;
    total_contracts: number;
  };
}

export function BlockchainExplorerPage() {
  const { user } = useAuth();
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [userContracts, setUserContracts] = useState<BlockchainContract[]>([]);
  const [blockchainInfo, setBlockchainInfo] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'user_contracts' | 'genesis'>('all');
  const [selectedBlock, setSelectedBlock] = useState<Block | null>(null);

  useEffect(() => {
    fetchBlockchainData();
  }, []);

  const fetchBlockchainData = async () => {
    try {
      setIsLoading(true);
      setError('');

      const [explorerResponse, contractsResponse, infoResponse] = await Promise.allSettled([
        blockchainAPI.exploreBlockchain(),
        blockchainAPI.getBlockchainContracts(),
        blockchainAPI.getInfo()
      ]);

      if (explorerResponse.status === 'fulfilled') {
        setBlocks(explorerResponse.value.blocks || []);
      }

      if (contractsResponse.status === 'fulfilled') {
        setUserContracts(contractsResponse.value.contracts || []);
      }

      if (infoResponse.status === 'fulfilled') {
        setBlockchainInfo(infoResponse.value);
      }

    } catch (err) {
      console.error('Failed to fetch blockchain data:', err);
      setError('Failed to load blockchain data');
    } finally {
      setIsLoading(false);
    }
  };

  const exportBlockchainData = async (includeUserContracts: boolean = true) => {
    try {
      setIsExporting(true);

      const exportData: BlockchainExportData = {
        exported_at: new Date().toISOString(),
        blockchain_info: blockchainInfo || { chain_size: 0, is_valid: false, using: 'unknown' },
        blocks: blocks,
        export_metadata: {
          user: user?.user_id || 'unknown',
          company: user?.company || 'unknown',
          total_blocks: blocks.length,
          total_contracts: userContracts.length
        }
      };

      if (includeUserContracts) {
        exportData.user_contracts = userContracts;
      }

      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: 'application/json'
      });

      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `blockchain_export_${user?.company || 'data'}_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

    } catch (err) {
      console.error('Export failed:', err);
      setError('Failed to export blockchain data');
    } finally {
      setIsExporting(false);
    }
  };

  const exportSingleBlock = (block: Block) => {
    const exportData = {
      exported_at: new Date().toISOString(),
      block: block,
      export_metadata: {
        user: user?.user_id || 'unknown',
        company: user?.company || 'unknown',
        block_index: block.index
      }
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json'
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `block_${block.index}_export_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const filteredBlocks = blocks.filter(block => {
    // Apply search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = 
        block.index.toString().includes(searchLower) ||
        block.hash.toLowerCase().includes(searchLower) ||
        block.data.senderKey.toLowerCase().includes(searchLower) ||
        block.data.receiverKey.toLowerCase().includes(searchLower) ||
        (block.contract_info?.contract_id?.toLowerCase().includes(searchLower));
      
      if (!matchesSearch) return false;
    }

    // Apply type filter
    switch (filterType) {
      case 'user_contracts':
        return block.contract_info && (
          block.contract_info.uploader_company === user?.company ||
          block.contract_info.partner_company === user?.company ||
          block.contract_info.company === user?.company
        );
      case 'genesis':
        return block.index === 0;
      default:
        return true;
    }
  });

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <LoadingSpinner size="lg" className="mx-auto mb-4" />
            <p className="text-gray-600">Loading blockchain data...</p>
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
              <Database className="mr-3" size={32} />
              Blockchain Explorer
            </h1>
            <p className="text-gray-600 mt-1">
              Explore and analyze blockchain data for {user?.company}
            </p>
          </div>
          
          <div className="mt-4 md:mt-0 flex flex-col sm:flex-row gap-2">
            <Button 
              variant="outline" 
              onClick={fetchBlockchainData}
              disabled={isLoading}
            >
              <RefreshCw size={16} className="mr-2" />
              Refresh
            </Button>
            <Button 
              onClick={() => exportBlockchainData(true)}
              disabled={isExporting}
            >
              <Download size={16} className="mr-2" />
              {isExporting ? 'Exporting...' : 'Export JSON'}
            </Button>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
          <div className="flex items-center justify-between">
            <p className="text-red-600">{error}</p>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={fetchBlockchainData}
            >
              Retry
            </Button>
          </div>
        </div>
      )}

      {/* Blockchain Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Total Blocks</CardTitle>
              <Database className="text-blue-500" size={20} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{blocks.length}</div>
            <p className="text-xs text-gray-600">
              {blockchainInfo?.is_valid ? '✓ Valid chain' : '✗ Invalid chain'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Your Contracts</CardTitle>
              <FileText className="text-green-500" size={20} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userContracts.length}</div>
            <p className="text-xs text-gray-600">
              On blockchain
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Chain Status</CardTitle>
              {blockchainInfo?.is_valid ? 
                <CheckCircle className="text-green-500" size={20} /> : 
                <AlertCircle className="text-red-500" size={20} />
              }
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {blockchainInfo?.is_valid ? 'Valid' : 'Invalid'}
            </div>
            <p className="text-xs text-gray-600">
              {blockchainInfo?.using || 'C++ implementation'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Contract Value</CardTitle>
              <BarChart3 className="text-purple-500" size={20} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(userContracts.reduce((sum, contract) => sum + contract.data.amount, 0))}
            </div>
            <p className="text-xs text-gray-600">
              Total on blockchain
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <Input
                  placeholder="Search blocks by index, hash, sender, receiver, or contract ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as any)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
              >
                <option value="all">All Blocks</option>
                <option value="user_contracts">My Company Contracts</option>
                <option value="genesis">Genesis Block</option>
              </select>
            </div>
          </div>

          <div className="mt-4 text-sm text-gray-600">
            Showing {filteredBlocks.length} of {blocks.length} blocks
          </div>
        </CardContent>
      </Card>

      {/* Blocks List */}
      {filteredBlocks.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <Database className="mx-auto text-gray-400 mb-4" size={64} />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No blocks found
              </h3>
              <p className="text-gray-600">
                {blocks.length === 0 
                  ? 'The blockchain appears to be empty'
                  : 'Try adjusting your search criteria or filters'
                }
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredBlocks.map((block) => (
            <Card 
              key={block.index} 
              className={`hover:shadow-md transition-shadow cursor-pointer ${
                selectedBlock?.index === block.index ? 'ring-2 ring-blue-500' : ''
              }`}
              onClick={() => setSelectedBlock(selectedBlock?.index === block.index ? null : block)}
            >
              <CardContent className="p-6">
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between">
                  {/* Block Info */}
                  <div className="flex-1 mb-4 lg:mb-0">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-1 flex items-center">
                          <Hash size={20} className="mr-2 text-gray-400" />
                          Block #{block.index}
                          {block.index === 0 && (
                            <Badge variant="secondary" className="ml-2">Genesis</Badge>
                          )}
                        </h3>
                        <p className="text-sm text-gray-600">
                          Hash: {truncateHash(block.hash, 16)}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        {block.is_valid ? (
                          <CheckCircle size={20} className="text-green-500" />
                        ) : (
                          <AlertCircle size={20} className="text-red-500" />
                        )}
                        <Badge variant={block.is_valid ? 'success' : 'destructive'}>
                          {block.is_valid ? 'Valid' : 'Invalid'}
                        </Badge>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">Amount:</span>
                        <span className="ml-2 font-medium">{formatCurrency(block.data.amount)}</span>
                      </div>
                      
                      <div>
                        <span className="text-gray-500">Timestamp:</span>
                        <span className="ml-2 font-medium">
                          {block.data.timestamp_readable ? 
                            formatDate(block.data.timestamp_readable) : 
                            new Date(block.data.timestamp * 1000).toLocaleString()
                          }
                        </span>
                      </div>

                      {block.contract_info?.contract_id && (
                        <div>
                          <span className="text-gray-500">Contract ID:</span>
                          <span className="ml-2 font-medium">{block.contract_info.contract_id}</span>
                        </div>
                      )}
                    </div>

                    {/* Contract Info */}
                    {block.contract_info && (
                      <div className="mt-3 p-3 bg-blue-50 rounded-md">
                        <div className="text-sm font-medium text-blue-900 mb-1">Contract Information</div>
                        <div className="text-sm text-blue-800 space-y-1">
                          {block.contract_info.type && (
                            <div>Type: <span className="font-medium">{block.contract_info.type}</span></div>
                          )}
                          {block.contract_info.uploader_company && (
                            <div>Uploader: <span className="font-medium">{block.contract_info.uploader_company}</span></div>
                          )}
                          {block.contract_info.partner_company && (
                            <div>Partner: <span className="font-medium">{block.contract_info.partner_company}</span></div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Expanded Details */}
                    {selectedBlock?.index === block.index && (
                      <div className="mt-4 p-4 bg-gray-50 rounded-md">
                        <h4 className="font-medium text-gray-900 mb-2">Block Details</h4>
                        <div className="space-y-2 text-sm">
                          <div>
                            <span className="text-gray-500">Previous Hash:</span>
                            <span className="ml-2 font-mono text-xs">{block.previousHash}</span>
                          </div>
                          <div>
                            <span className="text-gray-500">Current Hash:</span>
                            <span className="ml-2 font-mono text-xs">{block.hash}</span>
                          </div>
                          <div>
                            <span className="text-gray-500">Sender Key:</span>
                            <span className="ml-2 font-mono text-xs">{block.data.senderKey}</span>
                          </div>
                          <div>
                            <span className="text-gray-500">Receiver Key:</span>
                            <span className="ml-2 font-mono text-xs">{block.data.receiverKey}</span>
                          </div>
                          <div>
                            <span className="text-gray-500">Raw Timestamp:</span>
                            <span className="ml-2 font-mono text-xs">{block.data.timestamp}</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col sm:flex-row gap-2 lg:ml-6">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        exportSingleBlock(block);
                      }}
                    >
                      <Download size={16} className="mr-2" />
                      Export
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Export Options */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Download className="mr-2" size={20} />
            Export Options
          </CardTitle>
          <CardDescription>
            Download blockchain data in JSON format for analysis or backup
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button 
              variant="outline" 
              onClick={() => exportBlockchainData(false)}
              disabled={isExporting}
              className="justify-start h-auto p-4"
            >
              <div className="text-left">
                <div className="font-medium">Export All Blocks</div>
                <div className="text-sm text-gray-600 mt-1">
                  Complete blockchain data without user-specific contracts
                </div>
              </div>
            </Button>

            <Button 
              variant="outline" 
              onClick={() => exportBlockchainData(true)}
              disabled={isExporting}
              className="justify-start h-auto p-4"
            >
              <div className="text-left">
                <div className="font-medium">Export with Contracts</div>
                <div className="text-sm text-gray-600 mt-1">
                  Blockchain data including your company's contract details
                </div>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
