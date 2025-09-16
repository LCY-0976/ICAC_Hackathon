import { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  FileText, 
  Plus, 
  Search, 
  Eye, 
  Edit, 
  Download, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  Shield,
  Building,
  User,
  DollarSign
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ContractDetailsModal } from '@/components/ui/ContractDetailsModal';
import { useAuth } from '@/contexts/AuthContext';
import { contractAPI, type PendingContract } from '@/lib/api';
import { formatCurrency, formatDate, truncateHash } from '@/lib/utils';
import { useContracts, clearContractsCache } from '@/hooks/useContracts';

type FilterType = 'all' | 'pending' | 'completed' | 'my_contracts' | 'my_company';
type SortType = 'date' | 'amount' | 'title' | 'status';

export function ContractsPage() {
  const { user } = useAuth();
  const { contracts, isLoading, error, refetch, clearError } = useContracts();
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<FilterType>('all');
  const [sortBy, setSortBy] = useState<SortType>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedContract, setSelectedContract] = useState<PendingContract | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Contract loading is handled by useContracts hook

  const handleSignContract = async (contractId: string) => {
    try {
      const response = await contractAPI.signContract(contractId);
      if (response.success) {
        // Clear cache and refresh contracts after signing
        clearContractsCache();
        await refetch();
        // Update the selected contract if it's currently displayed
        if (selectedContract && selectedContract.contract_id === contractId) {
          // Find the updated contract from the refreshed list
          const updatedContract = contracts.find(c => c.contract_id === contractId);
          if (updatedContract) {
            setSelectedContract(updatedContract);
          }
        }
      } else {
        console.error('Sign contract error:', response.message);
      }
    } catch (error) {
      console.error('Error signing contract:', error);
    }
  };

  const handleViewContract = (contract: PendingContract) => {
    setSelectedContract(contract);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedContract(null);
  };

  // Filter contracts based on current filter
  const filteredContracts = contracts.filter(contract => {
    // Apply text search
    const matchesSearch = !searchTerm || 
      contract.contract_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contract.contract_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contract.uploader_company.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (contract.other_company && contract.other_company.toLowerCase().includes(searchTerm.toLowerCase()));

    if (!matchesSearch) return false;

    // Apply filter
    switch (filter) {
      case 'pending':
        return contract.status === 'pending';
      case 'completed':
        return contract.status === 'completed';
      case 'my_contracts':
        return contract.uploader === user?.user_id;
      case 'my_company':
        return contract.uploader_company === user?.company || contract.other_company === user?.company;
      default:
        return true;
    }
  });

  // Sort contracts
  const sortedContracts = [...filteredContracts].sort((a, b) => {
    let aValue: any, bValue: any;

    switch (sortBy) {
      case 'date':
        aValue = new Date(a.created_at);
        bValue = new Date(b.created_at);
        break;
      case 'amount':
        aValue = a.contract_amount;
        bValue = b.contract_amount;
        break;
      case 'title':
        aValue = a.contract_title.toLowerCase();
        bValue = b.contract_title.toLowerCase();
        break;
      case 'status':
        aValue = a.status;
        bValue = b.status;
        break;
      default:
        return 0;
    }

    if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle size={16} className="text-green-500" />;
      case 'pending':
        return <Clock size={16} className="text-yellow-500" />;
      default:
        return <AlertCircle size={16} className="text-red-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="success">Completed</Badge>;
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>;
      default:
        return <Badge variant="destructive">Unknown</Badge>;
    }
  };

  const canSign = (contract: PendingContract) => {
    if (contract.status !== 'pending') return false;
    if (!user?.company) return false;

    // Check if user's company needs to sign
    const companySignatures = contract.company_signatures[user.company] || [];
    return !companySignatures.includes(user.user_id);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <LoadingSpinner size="lg" className="mx-auto mb-4" />
            <p className="text-gray-600">Loading contracts...</p>
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
            <h1 className="text-3xl font-bold text-gray-900">Contracts</h1>
            <p className="text-gray-600 mt-1">
              Manage and track all your contracts in one place
            </p>
          </div>
          
          <div className="mt-4 md:mt-0 flex flex-col sm:flex-row gap-2">
            <Link to="/corruption-analysis">
              <Button variant="outline" className="w-full sm:w-auto">
                <Shield size={16} className="mr-2" />
                AI Corruption Analysis
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
          <div className="flex items-center justify-between">
            <p className="text-red-600">{error}</p>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => {
                clearError();
                refetch();
              }}
            >
              Retry
            </Button>
          </div>
        </div>
      )}

      {/* Filters and Search */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <Input
                  placeholder="Search contracts by title, ID, or company..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Filter */}
            <div className="flex flex-col sm:flex-row gap-2">
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value as FilterType)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
              >
                <option value="all">All Contracts</option>
                <option value="pending">Pending</option>
                <option value="completed">Completed</option>
                <option value="my_contracts">My Uploads</option>
                <option value="my_company">My Company</option>
              </select>

              <select
                value={`${sortBy}_${sortOrder}`}
                onChange={(e) => {
                  const [sort, order] = e.target.value.split('_');
                  setSortBy(sort as SortType);
                  setSortOrder(order as 'asc' | 'desc');
                }}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
              >
                <option value="date_desc">Newest First</option>
                <option value="date_asc">Oldest First</option>
                <option value="amount_desc">Highest Amount</option>
                <option value="amount_asc">Lowest Amount</option>
                <option value="title_asc">Title A-Z</option>
                <option value="title_desc">Title Z-A</option>
                <option value="status_asc">Status</option>
              </select>
            </div>
          </div>

          {/* Results count */}
          <div className="mt-4 text-sm text-gray-600">
            Showing {sortedContracts.length} of {contracts.length} contracts
          </div>
        </CardContent>
      </Card>

      {/* Contracts List */}
      {sortedContracts.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <FileText className="mx-auto text-gray-400 mb-4" size={64} />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {contracts.length === 0 ? 'No contracts found' : 'No contracts match your search'}
              </h3>
              <p className="text-gray-600 mb-6">
                {contracts.length === 0 
                  ? 'Get started by uploading your first contract'
                  : 'Try adjusting your search criteria or filters'
                }
              </p>
              {contracts.length === 0 && (
                <Link to="/upload-contract">
                  <Button>
                    <Plus size={16} className="mr-2" />
                    Upload First Contract
                  </Button>
                </Link>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {sortedContracts.map((contract) => (
            <Card key={contract.contract_id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                  {/* Contract Info */}
                  <div className="flex-1 mb-4 lg:mb-0">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">
                          {contract.contract_title}
                        </h3>
                        <p className="text-sm text-gray-600 mb-2">
                          ID: {truncateHash(contract.contract_id, 12)}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(contract.status)}
                        {getStatusBadge(contract.status)}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                      <div className="flex items-center space-x-2">
                        <DollarSign size={16} className="text-gray-400" />
                        <span className="font-medium">{formatCurrency(contract.contract_amount)}</span>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Building size={16} className="text-gray-400" />
                        <span>{contract.uploader_company}</span>
                      </div>
                      
                      {contract.other_company && (
                        <div className="flex items-center space-x-2">
                          <Building size={16} className="text-gray-400" />
                          <span>↔ {contract.other_company}</span>
                        </div>
                      )}
                      
                      <div className="flex items-center space-x-2">
                        <User size={16} className="text-gray-400" />
                        <span>{contract.uploader}</span>
                      </div>
                    </div>

                    <div className="mt-2 text-xs text-gray-500">
                      Created: {formatDate(contract.created_at)} • Type: {contract.contract_type}
                    </div>

                    {/* Signatures */}
                    <div className="mt-3">
                      <div className="text-xs font-medium text-gray-700 mb-1">Signatures:</div>
                      <div className="flex flex-wrap gap-1">
                        {Object.entries(contract.company_signatures).map(([company, signatures]) => (
                          <Badge 
                            key={company} 
                            variant={signatures.length > 0 ? 'success' : 'secondary'}
                            className="text-xs"
                          >
                            {company}: {signatures.length > 0 ? `✓ ${signatures.length}` : 'Pending'}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col sm:flex-row gap-2 lg:ml-6">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleViewContract(contract)}
                    >
                      <Eye size={16} className="mr-2" />
                      View
                    </Button>
                    
                    {canSign(contract) && (
                      <Button 
                        size="sm" 
                        onClick={() => handleSignContract(contract.contract_id)}
                      >
                        <CheckCircle size={16} className="mr-2" />
                        Sign
                      </Button>
                    )}
                    
                    {contract.uploader === user?.user_id && contract.status === 'pending' && (
                      <Button variant="outline" size="sm">
                        <Edit size={16} className="mr-2" />
                        Edit
                      </Button>
                    )}
                    
                    <Button variant="ghost" size="sm">
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

      {/* Pagination could be added here */}

      {/* Contract Details Modal */}
      <ContractDetailsModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        contract={selectedContract}
        onSign={handleSignContract}
        canSign={selectedContract ? canSign(selectedContract) : false}
        currentUserId={user?.user_id}
      />
    </div>
  );
}
