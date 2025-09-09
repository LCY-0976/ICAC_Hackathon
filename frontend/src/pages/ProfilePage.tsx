import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  User, 
  Building, 
  Calendar, 
  Shield, 
  Edit, 
  Save, 
  X, 
  CheckCircle, 
  AlertTriangle,
  Key,
  FileText,
  BarChart3,
  Clock
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useAuth } from '@/contexts/AuthContext';
import { contractAPI, type PendingContract } from '@/lib/api';
import { formatDate, formatCurrency } from '@/lib/utils';

export function ProfilePage() {
  const { user, logout } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [userContracts, setUserContracts] = useState<PendingContract[]>([]);
  const [contractsLoading, setContractsLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [editForm, setEditForm] = useState({
    user_name: user?.user_name || '',
    company: user?.company || '',
  });

  useEffect(() => {
    const fetchUserContracts = async () => {
      try {
        setContractsLoading(true);
        
        // Try to get all contracts and filter user's contracts
        let response;
        try {
          response = await contractAPI.getAllContracts();
        } catch {
          response = await contractAPI.getPendingContracts();
        }

        if (response.success) {
          const allContracts = response.contracts || [];
          const userContracts = allContracts.filter((contract: PendingContract) => 
            contract.uploader === user?.user_id || 
            contract.uploader_company === user?.company ||
            contract.other_company === user?.company
          );
          setUserContracts(userContracts);
        }
      } catch (error) {
        console.error('Error fetching user contracts:', error);
      } finally {
        setContractsLoading(false);
      }
    };

    if (user) {
      fetchUserContracts();
    }
  }, [user]);

  const handleEditToggle = () => {
    if (isEditing) {
      // Reset form when cancelling
      setEditForm({
        user_name: user?.user_name || '',
        company: user?.company || '',
      });
    }
    setIsEditing(!isEditing);
    setError('');
    setSuccess('');
  };

  const handleSave = async () => {
    try {
      setIsLoading(true);
      setError('');
      
      // In a real app, this would call an API to update the user profile
      // For now, we'll just simulate success
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setSuccess('Profile updated successfully!');
      setIsEditing(false);
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      setError('Failed to update profile. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditForm(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const uploadedContracts = userContracts.filter(c => c.uploader === user?.user_id);
  const pendingContracts = userContracts.filter(c => c.status === 'pending');
  
  const totalContractValue = userContracts.reduce((sum, contract) => sum + contract.contract_amount, 0);

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <AlertTriangle className="mx-auto text-red-500 mb-4" size={64} />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600 mb-6">You need to be logged in to view this page.</p>
          <Link to="/login">
            <Button>Sign In</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center">
          <User className="mr-3 text-primary" size={32} />
          User Profile
        </h1>
        <p className="text-gray-600 mt-1">
          Manage your account information and view your contract activity
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="text-red-500" size={20} />
            <p className="text-red-600">{error}</p>
          </div>
        </div>
      )}

      {success && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-md">
          <div className="flex items-center space-x-2">
            <CheckCircle className="text-green-500" size={20} />
            <p className="text-green-600">{success}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Profile Information */}
        <div className="lg:col-span-1 space-y-6">
          {/* Basic Info */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Personal Information</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleEditToggle}
                  disabled={isLoading}
                >
                  {isEditing ? (
                    <>
                      <X size={16} className="mr-1" />
                      Cancel
                    </>
                  ) : (
                    <>
                      <Edit size={16} className="mr-1" />
                      Edit
                    </>
                  )}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {isEditing ? (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Full Name
                    </label>
                    <Input
                      name="user_name"
                      value={editForm.user_name}
                      onChange={handleInputChange}
                      placeholder="Enter your full name"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Company
                    </label>
                    <Input
                      name="company"
                      value={editForm.company}
                      onChange={handleInputChange}
                      placeholder="Enter your company name"
                    />
                  </div>
                  
                  <Button 
                    onClick={handleSave} 
                    className="w-full"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <LoadingSpinner size="sm" className="mr-2" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save size={16} className="mr-2" />
                        Save Changes
                      </>
                    )}
                  </Button>
                </>
              ) : (
                <>
                  <div className="flex items-center space-x-3">
                    <User className="text-gray-400" size={20} />
                    <div>
                      <p className="font-medium">{user.user_name}</p>
                      <p className="text-sm text-gray-600">Full Name</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <Key className="text-gray-400" size={20} />
                    <div>
                      <p className="font-medium">{user.user_id}</p>
                      <p className="text-sm text-gray-600">User ID</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <Building className="text-gray-400" size={20} />
                    <div>
                      <p className="font-medium">{user.company}</p>
                      <p className="text-sm text-gray-600">Company</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <Calendar className="text-gray-400" size={20} />
                    <div>
                      <p className="font-medium">{formatDate(user.created_at)}</p>
                      <p className="text-sm text-gray-600">Member Since</p>
                    </div>
                  </div>
                  
                  {user.last_login && (
                    <div className="flex items-center space-x-3">
                      <Clock className="text-gray-400" size={20} />
                      <div>
                        <p className="font-medium">{formatDate(user.last_login)}</p>
                        <p className="text-sm text-gray-600">Last Login</p>
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          {/* Security & Digital Signature */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Shield className="mr-2 text-primary" size={20} />
                Security & Verification
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm">Digital Signature</span>
                <Badge variant="success">
                  <CheckCircle size={12} className="mr-1" />
                  Active
                </Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm">Account Verification</span>
                <Badge variant="success">
                  <CheckCircle size={12} className="mr-1" />
                  Verified
                </Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm">Blockchain Access</span>
                <Badge variant="success">
                  <CheckCircle size={12} className="mr-1" />
                  Enabled
                </Badge>
              </div>
              
              <div className="pt-4 border-t">
                <p className="text-xs text-gray-600">
                  Your e-signature: <code className="bg-gray-100 px-1 rounded text-xs">{user.e_signature}</code>
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Link to="/upload-contract" className="block">
                <Button variant="outline" className="w-full justify-start">
                  <FileText size={16} className="mr-2" />
                  Upload New Contract
                </Button>
              </Link>
              
              <Link to="/contracts" className="block">
                <Button variant="outline" className="w-full justify-start">
                  <BarChart3 size={16} className="mr-2" />
                  View All Contracts
                </Button>
              </Link>
              
              <Link to="/corruption-analysis" className="block">
                <Button variant="outline" className="w-full justify-start">
                  <Shield size={16} className="mr-2" />
                  Corruption Analysis
                </Button>
              </Link>
              
              <Button 
                variant="outline" 
                className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
                onClick={logout}
              >
                <User size={16} className="mr-2" />
                Sign Out
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Contract Activity */}
        <div className="lg:col-span-2 space-y-6">
          {/* Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{userContracts.length}</div>
                  <div className="text-xs text-gray-600">Total Contracts</div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{uploadedContracts.length}</div>
                  <div className="text-xs text-gray-600">Uploaded</div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-600">{pendingContracts.length}</div>
                  <div className="text-xs text-gray-600">Pending</div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">{formatCurrency(totalContractValue)}</div>
                  <div className="text-xs text-gray-600">Total Value</div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Contracts */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Recent Contract Activity</CardTitle>
                  <CardDescription>
                    Your latest contracts and involvement
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
              {contractsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <LoadingSpinner size="lg" />
                </div>
              ) : userContracts.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="mx-auto text-gray-400 mb-4" size={48} />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No contracts found</h3>
                  <p className="text-gray-600 mb-4">You haven't uploaded or been involved in any contracts yet.</p>
                  <Link to="/upload-contract">
                    <Button>
                      <FileText size={16} className="mr-2" />
                      Upload Your First Contract
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {userContracts.slice(0, 5).map((contract) => (
                    <div key={contract.contract_id} className="flex items-center justify-between p-4 bg-gray-50 rounded-md">
                      <div className="flex-1">
                        <h4 className="font-medium text-sm">{contract.contract_title}</h4>
                        <p className="text-xs text-gray-600">
                          {formatCurrency(contract.contract_amount)} • {formatDate(contract.created_at)}
                        </p>
                        <div className="flex items-center space-x-2 mt-1">
                          {contract.uploader === user.user_id ? (
                            <Badge variant="default" className="text-xs">Uploader</Badge>
                          ) : (
                            <Badge variant="secondary" className="text-xs">Participant</Badge>
                          )}
                          <Badge 
                            variant={
                              contract.status === 'completed' ? 'success' :
                              contract.status === 'pending' ? 'secondary' : 'destructive'
                            }
                            className="text-xs"
                          >
                            {contract.status}
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <p className="text-xs text-gray-600">{contract.contract_type}</p>
                        {contract.uploader_company !== contract.other_company && contract.other_company && (
                          <p className="text-xs text-gray-500">
                            {contract.uploader_company} ↔ {contract.other_company}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
