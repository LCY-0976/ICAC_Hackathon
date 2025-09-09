import { Link, useLocation } from 'react-router-dom';
import { User, Home, BarChart3, Plus, FileText, Shield, Database, Hash } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { LogoutButton } from '@/components/ui/LogoutButton';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

export function Header() {
  const { user, isAuthenticated } = useAuth();
  const location = useLocation();

  const navItems = [
    { path: '/', label: 'Home', icon: Home },
    { path: '/dashboard', label: 'Dashboard', icon: BarChart3, authRequired: true },
    { path: '/contracts', label: 'Contracts', icon: FileText, authRequired: true },
    { path: '/blockchain-explorer', label: 'Blockchain', icon: Database, authRequired: true },
    { path: '/corruption-analysis', label: 'Corruption Analysis', icon: Shield, authRequired: true },
    { path: '/upload-contract', label: 'Upload Contract', icon: Plus, authRequired: true },
    { path: '/create-block', label: 'Create Block', icon: Hash, authRequired: true },
  ];

  const visibleNavItems = navItems.filter(item => 
    !item.authRequired || (item.authRequired && isAuthenticated)
  );

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo and Brand */}
          <Link to="/" className="flex items-center space-x-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-white font-bold">
              R
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-lg">Replica</span>
              <span className="text-xs text-gray-500 -mt-1">Contract Management Platform</span>
            </div>
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            {visibleNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    "flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary text-white"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                  )}
                >
                  <Icon size={16} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* User Actions */}
          <div className="flex items-center space-x-4">
            {isAuthenticated ? (
              <>
                {/* User Info */}
                <div className="hidden sm:flex items-center space-x-3">
                  <div className="text-right">
                    <p className="text-sm font-medium">{user?.user_name}</p>
                    <p className="text-xs text-gray-500">@{user?.user_id}</p>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    <User size={12} className="mr-1" />
                    Verified
                  </Badge>
                </div>

                {/* Profile and Logout */}
                <div className="flex items-center space-x-2">
                  <Link to="/profile">
                    <Button variant="ghost" size="sm">
                      <User size={16} className="mr-2" />
                      Profile
                    </Button>
                  </Link>
                  <LogoutButton />
                </div>
              </>
            ) : (
              <div className="flex items-center space-x-2">
                <Link to="/login">
                  <Button variant="ghost" size="sm">
                    Sign In
                  </Button>
                </Link>
                <Link to="/register">
                  <Button size="sm">
                    Sign Up
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Navigation */}
        {isAuthenticated && (
          <div className="md:hidden py-2 border-t">
            <nav className="flex space-x-4 overflow-x-auto">
              {visibleNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={cn(
                      "flex items-center space-x-2 px-3 py-1 rounded-md text-xs font-medium whitespace-nowrap transition-colors",
                      isActive
                        ? "bg-primary text-white"
                        : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                    )}
                  >
                    <Icon size={14} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
