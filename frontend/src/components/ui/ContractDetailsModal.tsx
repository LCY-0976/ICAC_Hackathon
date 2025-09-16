import { useEffect } from 'react';
import { 
  X, 
  FileText, 
  Building, 
  User, 
  DollarSign, 
  Calendar, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  Hash,
  Shield,
  Users,
  Eye
} from 'lucide-react';
import type { PendingContract } from '@/lib/api';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { formatCurrency, formatDate } from '@/lib/utils';

interface ContractDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  contract: PendingContract | null;
  onSign?: (contractId: string) => void;
  canSign?: boolean;
  currentUserId?: string;
}

export function ContractDetailsModal({ 
  isOpen, 
  onClose, 
  contract, 
  onSign, 
  canSign = false,
  currentUserId 
}: ContractDetailsModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  if (!contract || !isOpen) return null;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle size={20} className="text-green-500" />;
      case 'pending':
        return <Clock size={20} className="text-yellow-500" />;
      default:
        return <AlertCircle size={20} className="text-red-500" />;
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

  const totalSignatures = Object.values(contract.company_signatures).reduce(
    (sum, signatures) => sum + signatures.length, 0
  );

  const requiredSignatures = Object.keys(contract.company_signatures).length;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-25 transition-opacity"
        onClick={handleBackdropClick}
      />
      
      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative w-full max-w-4xl transform overflow-hidden rounded-2xl bg-white p-6 text-left shadow-xl transition-all">
                {/* Header */}
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-start space-x-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <FileText className="text-blue-600" size={24} />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900">
                        {contract.contract_title}
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">
                        Contract ID: {contract.contract_id}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(contract.status)}
                      {getStatusBadge(contract.status)}
                    </div>
                    <button
                      type="button"
                      className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      onClick={onClose}
                    >
                      <X size={24} />
                    </button>
                  </div>
                </div>

                {/* Contract Overview */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <DollarSign size={16} className="text-green-600" />
                      <span className="text-sm font-medium text-gray-700">Contract Value</span>
                    </div>
                    <p className="text-lg font-semibold text-gray-900">
                      {formatCurrency(contract.contract_amount)}
                    </p>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <Shield size={16} className="text-blue-600" />
                      <span className="text-sm font-medium text-gray-700">Contract Type</span>
                    </div>
                    <p className="text-lg font-semibold text-gray-900 capitalize">
                      {contract.contract_type.replace('-', ' ')}
                    </p>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <Calendar size={16} className="text-purple-600" />
                      <span className="text-sm font-medium text-gray-700">Created</span>
                    </div>
                    <p className="text-lg font-semibold text-gray-900">
                      {formatDate(contract.created_at)}
                    </p>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <Users size={16} className="text-orange-600" />
                      <span className="text-sm font-medium text-gray-700">Signatures</span>
                    </div>
                    <p className="text-lg font-semibold text-gray-900">
                      {totalSignatures} / {requiredSignatures}
                    </p>
                  </div>
                </div>

                {/* Companies and Users */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div className="border rounded-lg p-4">
                    <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                      <Building size={16} className="mr-2" />
                      Uploader Company
                    </h4>
                    <div className="space-y-2">
                      <p className="text-sm text-gray-600">Company</p>
                      <p className="font-medium">{contract.uploader_company}</p>
                      <p className="text-sm text-gray-600 mt-2">Uploaded by</p>
                      <div className="flex items-center space-x-2">
                        <User size={14} className="text-gray-400" />
                        <span className="font-medium">{contract.uploader}</span>
                        {contract.uploader === currentUserId && (
                          <Badge variant="outline" className="text-xs">You</Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  {contract.other_company && (
                    <div className="border rounded-lg p-4">
                      <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                        <Building size={16} className="mr-2" />
                        Partner Company
                      </h4>
                      <div className="space-y-2">
                        <p className="text-sm text-gray-600">Company</p>
                        <p className="font-medium">{contract.other_company}</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Signature Status */}
                <div className="mb-6">
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                    <CheckCircle size={16} className="mr-2" />
                    Signature Status
                  </h4>
                  <div className="space-y-3">
                    {Object.entries(contract.company_signatures).map(([company, signatures]) => (
                      <div key={company} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h5 className="font-medium text-gray-900">{company}</h5>
                          <Badge 
                            variant={signatures.length > 0 ? 'success' : 'secondary'}
                          >
                            {signatures.length > 0 ? 'Signed' : 'Pending'}
                          </Badge>
                        </div>
                        {signatures.length > 0 ? (
                          <div className="space-y-1">
                            <p className="text-sm text-gray-600">Signed by:</p>
                            <div className="flex flex-wrap gap-2">
                              {signatures.map((userId) => (
                                <div key={userId} className="flex items-center space-x-1 bg-green-50 px-2 py-1 rounded">
                                  <User size={12} className="text-green-600" />
                                  <span className="text-sm font-medium text-green-800">
                                    {userId}
                                    {userId === currentUserId && ' (You)'}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <p className="text-sm text-gray-500">No signatures yet</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Contract Content */}
                <div className="mb-6">
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                    <Eye size={16} className="mr-2" />
                    Contract Content
                  </h4>
                  <div className="border rounded-lg p-4 bg-gray-50 max-h-60 overflow-y-auto">
                    <pre className="text-sm text-gray-700 whitespace-pre-wrap font-mono">
                      {contract.contract_content}
                    </pre>
                  </div>
                </div>

                {/* Blockchain Information */}
                {contract.blockchain_index !== undefined && (
                  <div className="mb-6">
                    <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                      <Hash size={16} className="mr-2" />
                      Blockchain Information
                    </h4>
                    <div className="border rounded-lg p-4 bg-blue-50">
                      <p className="text-sm text-gray-600 mb-1">Block Index</p>
                      <p className="font-mono text-lg font-semibold text-blue-800">
                        #{contract.blockchain_index}
                      </p>
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex justify-end space-x-3 pt-4 border-t">
                  <Button variant="outline" onClick={onClose}>
                    Close
                  </Button>
                  
                  {canSign && onSign && (
                    <Button onClick={() => onSign(contract.contract_id)}>
                      <CheckCircle size={16} className="mr-2" />
                      Sign Contract
                    </Button>
                  )}
                </div>
        </div>
      </div>
    </div>
  );
}
