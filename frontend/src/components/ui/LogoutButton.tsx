import { LogOut } from 'lucide-react';
import { Button } from './Button';
import { useAuth } from '@/contexts/AuthContext';

export function LogoutButton() {
  const { logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <Button variant="ghost" size="sm" onClick={handleLogout}>
      <LogOut size={16} className="mr-2" />
      Logout
    </Button>
  );
}
