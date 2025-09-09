import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, 
  Hash, 
  Clock, 
  DollarSign, 
  Key, 
  User, 
  Building, 
  Save,
  RotateCcw,
  ArrowRight
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useAuth } from '@/contexts/AuthContext';
import { blockchainAPI, authAPI } from '@/lib/api';

interface CreateBlockFormData {
  amount: string;
  sender: string;
  receiver: string;
  timestamp: string;
}

interface Company {
  name: string;
}

export function CreateBlockPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState<CreateBlockFormData>({
    amount: '',
    sender: '',
    receiver: '',
    timestamp: new Date().toISOString()
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [companies, setCompanies] = useState<string[]>([]);
  const [loadingCompanies, setLoadingCompanies] = useState(true);

  useEffect(() => {
    // Load companies and set default values
    const loadInitialData = async () => {
      try {
        const companiesResponse = await authAPI.getAllCompanies();
        if (companiesResponse.success) {
          setCompanies(companiesResponse.companies || []);
        }
        
        // Set default sender to current user's company
        if (user?.company) {
          setFormData(prev => ({
            ...prev,
            sender: user.company,
            timestamp: Math.floor(Date.now() / 1000).toString()
          }));
        }
      } catch (err) {
        console.error('Failed to load companies:', err);
      } finally {
        setLoadingCompanies(false);
      }
    };

    loadInitialData();
  }, [user?.company]);

  const handleInputChange = (field: keyof CreateBlockFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    setError('');
    setSuccess('');
  };

  const validateForm = (): boolean => {
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      setError('Please enter a valid amount greater than 0');
      return false;
    }

    if (!formData.sender.trim()) {
      setError('Please enter a sender');
      return false;
    }

    if (!formData.receiver.trim()) {
      setError('Please enter a receiver');
      return false;
    }

    if (formData.sender === formData.receiver) {
      setError('Sender and receiver cannot be the same');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setError('');
    setSuccess('');

    try {
      // Prepare the contract data for blockchain
      const contractData = {
        amount: parseFloat(formData.amount),
        sender: formData.sender,
        receiver: formData.receiver,
        timestamp: formData.timestamp.includes('-') ? 
          Math.floor(new Date(formData.timestamp).getTime() / 1000).toString() : 
          formData.timestamp
      };

      // Create the block via API
      const response = await fetch('http://localhost:8000/api/block', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify(contractData)
      });

      const result = await response.json();

      if (response.ok) {
        setSuccess(`Block created successfully! Block index: ${result.block_index}`);
        
        // Reset form
        setFormData({
          amount: '',
          sender: user?.company || '',
          receiver: '',
          timestamp: Math.floor(Date.now() / 1000).toString()
        });

        // Optionally redirect after a delay
        setTimeout(() => {
          navigate('/blockchain-explorer');
        }, 2000);
      } else {
        throw new Error(result.detail || 'Failed to create block');
      }

    } catch (err: any) {
      console.error('Block creation error:', err);
      setError(err.message || 'Failed to create block');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      amount: '',
      sender: user?.company || '',
      receiver: '',
      timestamp: Math.floor(Date.now() / 1000).toString()
    });
    setError('');
    setSuccess('');
  };

  const generateTimestamp = () => {
    setFormData(prev => ({
      ...prev,
      timestamp: Math.floor(Date.now() / 1000).toString()
    }));
  };

  const quickFillDemo = () => {
    const demoCompanies = companies.filter(c => c !== user?.company);
    const randomReceiver = demoCompanies[Math.floor(Math.random() * demoCompanies.length)] || 'Demo Company';
    
    setFormData({
      amount: (Math.random() * 100000 + 1000).toFixed(2),
      sender: user?.company || 'Demo Sender',
      receiver: randomReceiver,
      timestamp: Math.floor(Date.now() / 1000).toString()
    });
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center">
              <Plus className="mr-3" size={32} />
              Create Blockchain Block
            </h1>
            <p className="text-gray-600 mt-1">
              Manually create a new block on the blockchain for testing purposes
            </p>
          </div>
          
          <div className="mt-4 md:mt-0 flex flex-col sm:flex-row gap-2">
            <Button 
              variant="outline" 
              onClick={() => navigate('/blockchain-explorer')}
            >
              <Hash size={16} className="mr-2" />
              View Blockchain
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Form */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Block Transaction Data</CardTitle>
              <CardDescription>
                Enter the transaction details that will be stored in the new blockchain block
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Amount */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <DollarSign size={16} className="inline mr-1" />
                    Transaction Amount
                  </label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="Enter amount (e.g., 50000.00)"
                    value={formData.amount}
                    onChange={(e) => handleInputChange('amount', e.target.value)}
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    The monetary value associated with this transaction
                  </p>
                </div>

                {/* Sender */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <User size={16} className="inline mr-1" />
                    Sender
                  </label>
                  {loadingCompanies ? (
                    <div className="flex items-center space-x-2">
                      <LoadingSpinner size="sm" />
                      <span className="text-gray-500">Loading companies...</span>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <select
                        value={formData.sender}
                        onChange={(e) => handleInputChange('sender', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
                      >
                        <option value="">Select sender company</option>
                        {companies.map(company => (
                          <option key={company} value={company}>{company}</option>
                        ))}
                      </select>
                      <Input
                        placeholder="Or enter custom sender"
                        value={formData.sender}
                        onChange={(e) => handleInputChange('sender', e.target.value)}
                      />
                    </div>
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    The entity or company initiating the transaction
                  </p>
                </div>

                {/* Receiver */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Building size={16} className="inline mr-1" />
                    Receiver
                  </label>
                  {loadingCompanies ? (
                    <div className="flex items-center space-x-2">
                      <LoadingSpinner size="sm" />
                      <span className="text-gray-500">Loading companies...</span>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <select
                        value={formData.receiver}
                        onChange={(e) => handleInputChange('receiver', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
                      >
                        <option value="">Select receiver company</option>
                        {companies.filter(c => c !== formData.sender).map(company => (
                          <option key={company} value={company}>{company}</option>
                        ))}
                      </select>
                      <Input
                        placeholder="Or enter custom receiver"
                        value={formData.receiver}
                        onChange={(e) => handleInputChange('receiver', e.target.value)}
                      />
                    </div>
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    The entity or company receiving the transaction
                  </p>
                </div>

                {/* Timestamp */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Clock size={16} className="inline mr-1" />
                    Timestamp
                  </label>
                  <div className="flex space-x-2">
                    <Input
                      type="text"
                      placeholder="Unix timestamp or ISO date"
                      value={formData.timestamp}
                      onChange={(e) => handleInputChange('timestamp', e.target.value)}
                      className="flex-1"
                    />
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={generateTimestamp}
                    >
                      Now
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Unix timestamp or ISO date string. Current time: {new Date().toLocaleString()}
                  </p>
                </div>

                {/* Error/Success Messages */}
                {error && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-md">
                    <p className="text-red-600">{error}</p>
                  </div>
                )}

                {success && (
                  <div className="p-4 bg-green-50 border border-green-200 rounded-md">
                    <p className="text-green-600">{success}</p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="flex-1"
                  >
                    {isSubmitting ? (
                      <>
                        <LoadingSpinner size="sm" className="mr-2" />
                        Creating Block...
                      </>
                    ) : (
                      <>
                        <Save size={16} className="mr-2" />
                        Create Block
                      </>
                    )}
                  </Button>
                  
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={resetForm}
                    disabled={isSubmitting}
                  >
                    <RotateCcw size={16} className="mr-2" />
                    Reset
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Info & Quick Actions */}
        <div className="space-y-6">
          {/* Quick Fill */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button 
                variant="outline" 
                onClick={quickFillDemo}
                className="w-full justify-start"
                disabled={isSubmitting}
              >
                <ArrowRight size={16} className="mr-2" />
                Fill Demo Data
              </Button>
              
              <Button 
                variant="outline" 
                onClick={() => navigate('/blockchain-explorer')}
                className="w-full justify-start"
              >
                <Hash size={16} className="mr-2" />
                View Blockchain
              </Button>
            </CardContent>
          </Card>

          {/* Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Blockchain Info</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <div>
                  <span className="font-medium">User:</span>
                  <p className="text-gray-600">{user?.user_name} ({user?.user_id})</p>
                </div>
                
                <div>
                  <span className="font-medium">Company:</span>
                  <p className="text-gray-600">{user?.company}</p>
                </div>
                
                <div>
                  <span className="font-medium">Implementation:</span>
                  <p className="text-gray-600">C++ Blockchain Module</p>
                </div>
                
                <div className="pt-3 border-t">
                  <p className="text-xs text-gray-500">
                    This tool creates test transactions on the blockchain. 
                    In production, blocks would be created automatically when contracts are signed.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Format Examples */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Timestamp Formats</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="font-medium">Unix Timestamp:</span>
                  <p className="text-gray-600 font-mono">{Math.floor(Date.now() / 1000)}</p>
                </div>
                
                <div>
                  <span className="font-medium">ISO Date:</span>
                  <p className="text-gray-600 font-mono">{new Date().toISOString()}</p>
                </div>
                
                <div>
                  <span className="font-medium">Current Time:</span>
                  <p className="text-gray-600">{new Date().toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
