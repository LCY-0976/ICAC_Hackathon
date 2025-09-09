import { Link } from 'react-router-dom';
import { Shield, FileText, Users, Zap, ArrowRight, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { useAuth } from '@/contexts/AuthContext';

export function HomePage() {
  const { isAuthenticated } = useAuth();

  const features = [
    {
      icon: Shield,
      title: 'Blockchain Security',
      description: 'Immutable contract storage with cryptographic verification and tamper-proof records.',
    },
    {
      icon: FileText,
      title: 'Contract Management',
      description: 'Upload, sign, and manage contracts with multi-party digital signatures.',
    },
    {
      icon: Zap,
      title: 'AI Corruption Analysis',
      description: 'Advanced AI-powered analysis to detect corruption risks and suspicious patterns.',
    },
    {
      icon: Users,
      title: 'Multi-Company Support',
      description: 'Secure collaboration between multiple organizations with role-based access.',
    },
  ];

  const benefits = [
    'Transparent and immutable contract records',
    'Advanced corruption risk detection',
    'Secure multi-party digital signatures',
    'Real-time contract status tracking',
    'Comprehensive audit trails',
    'AI-powered risk analysis',
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 lg:py-24">
        <div className="text-center max-w-4xl mx-auto">
          <div className="flex justify-center mb-6">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-white text-2xl font-bold">
              R
            </div>
          </div>
          
          <h1 className="text-4xl lg:text-6xl font-bold text-gray-900 mb-6">
            <span className="text-primary">Replica</span>{' '}
            - Secure Contract Management with Blockchain Technology
          </h1>
          
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Revolutionize contract management with blockchain security, AI-powered corruption analysis, 
            and transparent multi-party collaboration.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {isAuthenticated ? (
              <>
                <Link to="/dashboard">
                  <Button size="lg" className="w-full sm:w-auto">
                    Go to Dashboard
                    <ArrowRight size={20} className="ml-2" />
                  </Button>
                </Link>
                <Link to="/upload-contract">
                  <Button variant="outline" size="lg" className="w-full sm:w-auto">
                    Upload Contract
                  </Button>
                </Link>
              </>
            ) : (
              <>
                <Link to="/register">
                  <Button size="lg" className="w-full sm:w-auto">
                    Get Started
                    <ArrowRight size={20} className="ml-2" />
                  </Button>
                </Link>
                <Link to="/login">
                  <Button variant="outline" size="lg" className="w-full sm:w-auto">
                    Sign In
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Powerful Features for Modern Contract Management
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Our platform combines cutting-edge blockchain technology with AI-powered analysis 
            to provide the most secure and intelligent contract management solution.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card key={index} className="text-center hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex justify-center mb-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Icon size={24} />
                    </div>
                  </div>
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-center">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Benefits Section */}
      <section className="bg-white py-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">
                Why Choose Our Platform?
              </h2>
              <p className="text-lg text-gray-600 mb-8">
                Built specifically for organizations that need secure, transparent, 
                and corruption-resistant contract management solutions.
              </p>
              
              <div className="space-y-4">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <CheckCircle size={20} className="text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">{benefit}</span>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="relative">
              <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-2xl p-8">
                <div className="space-y-4">
                  <div className="flex items-center space-x-3 p-4 bg-white rounded-lg shadow-sm">
                    <Shield className="text-primary" size={24} />
                    <div>
                      <div className="font-semibold">Blockchain Verified</div>
                      <div className="text-sm text-gray-600">Contract #ABC123</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3 p-4 bg-white rounded-lg shadow-sm">
                    <Zap className="text-yellow-500" size={24} />
                    <div>
                      <div className="font-semibold">AI Analysis Complete</div>
                      <div className="text-sm text-gray-600">Low Risk Score: 15/100</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3 p-4 bg-white rounded-lg shadow-sm">
                    <Users className="text-green-500" size={24} />
                    <div>
                      <div className="font-semibold">Multi-Party Signed</div>
                      <div className="text-sm text-gray-600">2/2 Companies Verified</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="bg-primary rounded-2xl p-8 lg:p-12 text-center text-white">
          <h2 className="text-3xl font-bold mb-4">
            Ready to Secure Your Contracts?
          </h2>
          <p className="text-xl opacity-90 mb-8 max-w-2xl mx-auto">
            Join organizations worldwide who trust our platform for secure, 
            transparent, and corruption-resistant contract management.
          </p>
          
          {!isAuthenticated && (
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/register">
                <Button variant="secondary" size="lg" className="w-full sm:w-auto">
                  Create Account
                  <ArrowRight size={20} className="ml-2" />
                </Button>
              </Link>
              <Link to="/login">
                <Button variant="outline" size="lg" className="w-full sm:w-auto text-white border-white hover:bg-white hover:text-primary">
                  Sign In
                </Button>
              </Link>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
