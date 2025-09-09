import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UserPlus, Building } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useAuth } from '@/contexts/AuthContext';
import { authAPI } from '@/lib/api';

export function RegisterPage() {
  const [formData, setFormData] = useState({
    user_name: '',
    user_id: '',
    user_password: '',
    company: '',
  });
  const [companies, setCompanies] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const { register } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Fetch available companies
    const fetchCompanies = async () => {
      try {
        const response = await authAPI.getAllCompanies();
        if (response.success) {
          setCompanies(response.companies);
        }
      } catch (error) {
        console.error('Failed to fetch companies:', error);
      }
    };

    fetchCompanies();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      await register(formData);
      navigate('/dashboard');
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center space-x-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-white font-bold text-xl">
              R
            </div>
            <span className="text-2xl font-bold text-gray-900">Replica</span>
          </Link>
        </div>

        <Card>
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                <UserPlus size={24} />
              </div>
            </div>
            <CardTitle>Create Account</CardTitle>
            <CardDescription>
              Join the secure contract management platform
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              <div>
                <label htmlFor="user_name" className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name
                </label>
                <Input
                  id="user_name"
                  name="user_name"
                  type="text"
                  required
                  value={formData.user_name}
                  onChange={handleChange}
                  placeholder="Enter your full name"
                />
              </div>

              <div>
                <label htmlFor="user_id" className="block text-sm font-medium text-gray-700 mb-1">
                  User ID
                </label>
                <Input
                  id="user_id"
                  name="user_id"
                  type="text"
                  required
                  value={formData.user_id}
                  onChange={handleChange}
                  placeholder="Choose a unique user ID"
                />
              </div>

              <div>
                <label htmlFor="user_password" className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <Input
                  id="user_password"
                  name="user_password"
                  type="password"
                  required
                  value={formData.user_password}
                  onChange={handleChange}
                  placeholder="Create a secure password"
                />
              </div>

              <div>
                <label htmlFor="company" className="block text-sm font-medium text-gray-700 mb-1">
                  Company
                </label>
                {companies.length > 0 ? (
                  <select
                    id="company"
                    name="company"
                    required
                    value={formData.company}
                    onChange={handleChange}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                  >
                    <option value="">Select your company</option>
                    {companies.map((company) => (
                      <option key={company} value={company}>
                        {company}
                      </option>
                    ))}
                    <option value="other">Other (enter manually)</option>
                  </select>
                ) : (
                  <Input
                    id="company"
                    name="company"
                    type="text"
                    required
                    value={formData.company}
                    onChange={handleChange}
                    placeholder="Enter your company name"
                  />
                )}
              </div>

              {formData.company === 'other' && (
                <div>
                  <label htmlFor="custom_company" className="block text-sm font-medium text-gray-700 mb-1">
                    Company Name
                  </label>
                  <Input
                    id="custom_company"
                    name="company"
                    type="text"
                    required
                    value={formData.company === 'other' ? '' : formData.company}
                    onChange={(e) => setFormData(prev => ({ ...prev, company: e.target.value }))}
                    placeholder="Enter your company name"
                  />
                </div>
              )}

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <LoadingSpinner size="sm" className="mr-2" />
                    Creating Account...
                  </>
                ) : (
                  <>
                    <UserPlus size={16} className="mr-2" />
                    Create Account
                  </>
                )}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Already have an account?{' '}
                <Link to="/login" className="font-medium text-primary hover:underline">
                  Sign in here
                </Link>
              </p>
            </div>

            {/* Sample Companies */}
            <div className="mt-6 p-3 bg-gray-50 rounded-md">
              <div className="flex items-center space-x-2 mb-2">
                <Building size={16} className="text-gray-600" />
                <span className="text-sm font-medium text-gray-700">Sample Companies</span>
              </div>
              <div className="text-xs text-gray-600 space-y-1">
                <p>• ABC Company</p>
                <p>• XYZ Corporation</p>
                <p>• Tech Solutions Inc</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="mt-6 text-center">
          <Link to="/" className="text-sm text-gray-600 hover:text-primary">
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
