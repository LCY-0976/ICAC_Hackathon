import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Upload, 
  FileText, 
  DollarSign, 
  User, 
  Users,
  CheckCircle, 
  AlertTriangle,
  ArrowLeft,
  X,
  Clock,
  Bug
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input, Textarea, Select } from '@/components/ui/Input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useAuth } from '@/contexts/AuthContext';
import { contractAPI, authAPI, type ContractUpload } from '@/lib/api';

export function UploadContractPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [companies, setCompanies] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [showDebug, setShowDebug] = useState(false);
  
  const [formData, setFormData] = useState<ContractUpload>({
    contract_title: '',
    contract_content: '',
    contract_amount: 0,
    contract_type: 'internal',
    other_company: '',
    uploader: user?.user_id || '',
    timestamp: new Date().toISOString(),
  });

  const [validationErrors, setValidationErrors] = useState<{[key: string]: string}>({});

  useEffect(() => {
    // Fetch available companies
    const fetchCompanies = async () => {
      try {
        const response = await authAPI.getAllCompanies();
        if (response.success) {
          setCompanies(response.companies.filter((company: string) => company !== user?.company));
        }
      } catch (error) {
        console.error('Failed to fetch companies:', error);
      }
    };

    fetchCompanies();
  }, [user?.company]);

  const validateForm = (): boolean => {
    const errors: {[key: string]: string} = {};

    if (!formData.contract_title.trim()) {
      errors.contract_title = 'Contract title is required';
    }

    if (!formData.contract_content.trim()) {
      errors.contract_content = 'Contract content is required';
    } else if (formData.contract_content.length < 50) {
      errors.contract_content = 'Contract content must be at least 50 characters';
    }

    if (formData.contract_amount <= 0) {
      errors.contract_amount = 'Contract amount must be greater than 0';
    }

    if (formData.contract_type === 'cross-company' && !formData.other_company) {
      errors.other_company = 'Please select the other company for cross-company contracts';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const testConnection = async () => {
    try {
      setError('');
      console.log('Testing connection...');
      const response = await contractAPI.uploadContract({
        contract_title: 'Test Contract',
        contract_content: 'This is a test contract to verify the upload functionality',
        contract_amount: 100,
        contract_type: 'internal',
        other_company: '',
        uploader: user?.user_id || '',
        timestamp: new Date().toISOString(),
      });
      console.log('Test response:', response);
      if (response.success) {
        setError('✅ Connection test successful! Upload should work.');
      } else {
        setError(`❌ Test failed: ${response.message}`);
      }
    } catch (error: any) {
      console.error('Test error:', error);
      setError(`❌ Test failed: ${error?.response?.data?.detail || error?.message || 'Unknown error'}`);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      setIsLoading(true);
      setError('');

      const contractData: ContractUpload = {
        ...formData,
        uploader: user?.user_id || '',
        timestamp: new Date().toISOString(),
        other_company: formData.contract_type === 'cross-company' ? formData.other_company : undefined,
      };

      const response = await contractAPI.uploadContract(contractData);

      if (response.success) {
        setSuccess(true);
        setTimeout(() => {
          navigate('/contracts');
        }, 2000);
      } else {
        setError(response.message || 'Failed to upload contract');
      }
    } catch (error: any) {
      console.error('Upload error:', error);
      
      let errorMessage = 'Failed to upload contract. Please try again.';
      
      if (error?.response?.data?.detail) {
        // Backend validation error
        errorMessage = error.response.data.detail;
      } else if (error?.response?.status === 401) {
        errorMessage = 'Authentication expired. Please log in again.';
      } else if (error?.response?.status === 400) {
        errorMessage = 'Please check your contract details and try again.';
      } else if (error?.response?.status >= 500) {
        errorMessage = 'Server error. Please try again in a moment.';
      } else if (error?.message?.includes('timeout')) {
        errorMessage = 'Request timed out. Please check your connection and try again.';
      } else if (error?.message?.includes('Network Error')) {
        errorMessage = 'Network error. Please check if the server is running.';
      } else if (error?.message) {
        errorMessage = error.message;
      }
      
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: name === 'contract_amount' ? parseFloat(value) || 0 : value
    }));

    // Clear validation error for this field
    if (validationErrors[name]) {
      setValidationErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleReset = () => {
    setFormData({
      contract_title: '',
      contract_content: '',
      contract_amount: 0,
      contract_type: 'internal',
      other_company: '',
      uploader: user?.user_id || '',
      timestamp: new Date().toISOString(),
    });
    setValidationErrors({});
    setError('');
  };

  if (success) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardContent className="py-12">
              <div className="text-center">
                <CheckCircle className="mx-auto text-green-500 mb-4" size={64} />
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Contract Uploaded Successfully!</h2>
                <p className="text-gray-600 mb-6">
                  Your contract is now pending digital signatures. It will be automatically added to the blockchain once all required parties have signed with their e-signatures.
                </p>
                <div className="space-y-3">
                  <Link to="/contracts">
                    <Button className="w-full">
                      <FileText size={16} className="mr-2" />
                      View All Contracts
                    </Button>
                  </Link>
                  <Button variant="outline" onClick={() => window.location.reload()}>
                    Upload Another Contract
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center space-x-4 mb-4">
          <Link to="/contracts">
            <Button variant="ghost" size="sm">
              <ArrowLeft size={16} className="mr-2" />
              Back to Contracts
            </Button>
          </Link>
        </div>
        
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center">
              <Upload className="mr-3 text-primary" size={32} />
              Upload Contract
            </h1>
            <p className="text-gray-600 mt-1">
              Create a new contract for blockchain storage and digital signing
            </p>
          </div>
          
          <div className="mt-4 md:mt-0">
            <Badge variant="secondary" className="text-sm">
              <User size={14} className="mr-1" />
              {user?.company}
            </Badge>
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

      {/* Upload Form */}
      <div className="max-w-4xl mx-auto">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Form */}
            <div className="lg:col-span-2 space-y-6">
              {/* Basic Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <FileText className="mr-2 text-primary" size={20} />
                    Contract Information
                  </CardTitle>
                  <CardDescription>
                    Enter the basic details of your contract
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Contract Title */}
                  <div>
                    <label htmlFor="contract_title" className="block text-sm font-medium text-gray-700 mb-1">
                      Contract Title *
                    </label>
                    <Input
                      id="contract_title"
                      name="contract_title"
                      type="text"
                      required
                      value={formData.contract_title}
                      onChange={handleChange}
                      placeholder="Enter a descriptive title for your contract"
                      className={validationErrors.contract_title ? 'border-red-300' : ''}
                    />
                    {validationErrors.contract_title && (
                      <p className="text-red-600 text-sm mt-1">{validationErrors.contract_title}</p>
                    )}
                  </div>

                  {/* Contract Amount */}
                  <div>
                    <label htmlFor="contract_amount" className="block text-sm font-medium text-gray-700 mb-1">
                      Contract Amount (USD) *
                    </label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                      <Input
                        id="contract_amount"
                        name="contract_amount"
                        type="number"
                        required
                        min="0"
                        step="0.01"
                        value={formData.contract_amount || ''}
                        onChange={handleChange}
                        placeholder="0.00"
                        className={`pl-10 ${validationErrors.contract_amount ? 'border-red-300' : ''}`}
                      />
                    </div>
                    {validationErrors.contract_amount && (
                      <p className="text-red-600 text-sm mt-1">{validationErrors.contract_amount}</p>
                    )}
                  </div>

                  {/* Contract Type */}
                  <div>
                    <label htmlFor="contract_type" className="block text-sm font-medium text-gray-700 mb-1">
                      Contract Type *
                    </label>
                    <Select
                      id="contract_type"
                      name="contract_type"
                      value={formData.contract_type}
                      onChange={handleChange}
                      required
                    >
                      <option value="internal">Internal Contract</option>
                      <option value="cross-company">Cross-Company Contract</option>
                    </Select>
                    <p className="text-xs text-gray-500 mt-1">
                      {formData.contract_type === 'internal' 
                        ? 'Contract within your organization'
                        : 'Contract involving multiple companies'
                      }
                    </p>
                  </div>

                  {/* Other Company (if cross-company) */}
                  {formData.contract_type === 'cross-company' && (
                    <div>
                      <label htmlFor="other_company" className="block text-sm font-medium text-gray-700 mb-1">
                        Other Company *
                      </label>
                      <Select
                        id="other_company"
                        name="other_company"
                        value={formData.other_company}
                        onChange={handleChange}
                        required
                        className={validationErrors.other_company ? 'border-red-300' : ''}
                      >
                        <option value="">Select the other company</option>
                        {companies.map((company) => (
                          <option key={company} value={company}>
                            {company}
                          </option>
                        ))}
                      </Select>
                      {validationErrors.other_company && (
                        <p className="text-red-600 text-sm mt-1">{validationErrors.other_company}</p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Contract Content */}
              <Card>
                <CardHeader>
                  <CardTitle>Contract Content</CardTitle>
                  <CardDescription>
                    Enter the full text and terms of your contract
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div>
                    <label htmlFor="contract_content" className="block text-sm font-medium text-gray-700 mb-1">
                      Contract Terms and Conditions *
                    </label>
                    <Textarea
                      id="contract_content"
                      name="contract_content"
                      required
                      rows={12}
                      value={formData.contract_content}
                      onChange={handleChange}
                      placeholder="Enter the detailed terms, conditions, and content of your contract..."
                      className={validationErrors.contract_content ? 'border-red-300' : ''}
                    />
                    {validationErrors.contract_content && (
                      <p className="text-red-600 text-sm mt-1">{validationErrors.contract_content}</p>
                    )}
                    <p className="text-xs text-gray-500 mt-1">
                      {formData.contract_content.length} characters (minimum 50 required)
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Upload Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Upload Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Uploader:</span>
                    <span className="font-medium">{user?.user_name}</span>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Company:</span>
                    <span className="font-medium">{user?.company}</span>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Type:</span>
                    <Badge variant="secondary">
                      {formData.contract_type === 'internal' ? 'Internal' : 'Cross-Company'}
                    </Badge>
                  </div>
                  
                  {formData.contract_amount > 0 && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Amount:</span>
                      <span className="font-medium">
                        ${formData.contract_amount.toLocaleString()}
                      </span>
                    </div>
                  )}
                  
                  {formData.contract_type === 'cross-company' && formData.other_company && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Partner:</span>
                      <span className="font-medium">{formData.other_company}</span>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Next Steps */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Next Steps</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 text-sm">
                    <div className="flex items-start space-x-2">
                      <Clock className="text-blue-500 mt-0.5" size={16} />
                      <span>Contract will await digital signatures</span>
                    </div>
                    
                    <div className="flex items-start space-x-2">
                      <User className="text-orange-500 mt-0.5" size={16} />
                      <span>Your company employees must sign first</span>
                    </div>
                    
                    {formData.contract_type === 'cross-company' && (
                      <div className="flex items-start space-x-2">
                        <Users className="text-purple-500 mt-0.5" size={16} />
                        <span>Partner company must also sign</span>
                      </div>
                    )}
                    
                    <div className="flex items-start space-x-2">
                      <CheckCircle className="text-green-500 mt-0.5" size={16} />
                      <span>Added to blockchain after all signatures</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Actions */}
              <Card>
                <CardContent className="pt-6">
                  <div className="space-y-3">
                    <Button
                      type="submit"
                      className="w-full"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <LoadingSpinner size="sm" className="mr-2" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Upload size={16} className="mr-2" />
                          Upload Contract
                        </>
                      )}
                    </Button>
                    
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full"
                      onClick={handleReset}
                      disabled={isLoading}
                    >
                      <X size={16} className="mr-2" />
                      Reset Form
                    </Button>
                    
                    <Button
                      type="button"
                      variant="ghost"
                      className="w-full"
                      onClick={() => setShowDebug(!showDebug)}
                    >
                      <Bug size={16} className="mr-2" />
                      {showDebug ? 'Hide' : 'Show'} Debug Panel
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Debug Panel */}
              {showDebug && (
                <Card className="border-blue-200">
                  <CardHeader>
                    <CardTitle className="text-blue-600">Debug Panel</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={testConnection}
                        className="w-full"
                      >
                        Test Upload Connection
                      </Button>
                      
                      <div className="text-xs bg-gray-50 p-3 rounded">
                        <div><strong>User:</strong> {user?.user_id || 'Not logged in'}</div>
                        <div><strong>Company:</strong> {user?.company || 'Unknown'}</div>
                        <div><strong>Form Data:</strong></div>
                        <pre className="mt-1 text-[10px] whitespace-pre-wrap">
                          {JSON.stringify(formData, null, 2)}
                        </pre>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
