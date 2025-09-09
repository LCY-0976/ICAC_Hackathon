import { Shield, Github, ExternalLink } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-gray-50 border-t">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-white font-bold">
                R
              </div>
              <span className="font-bold text-lg">Replica</span>
            </div>
            <p className="text-sm text-gray-600">
              Replica - A secure blockchain-based contract management system with advanced corruption risk analysis.
            </p>
          </div>

          {/* Features */}
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900">Features</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-center space-x-2">
                <Shield size={14} />
                <span>Blockchain Security</span>
              </li>
              <li className="flex items-center space-x-2">
                <Shield size={14} />
                <span>Contract Management</span>
              </li>
              <li className="flex items-center space-x-2">
                <Shield size={14} />
                <span>Corruption Analysis</span>
              </li>
              <li className="flex items-center space-x-2">
                <Shield size={14} />
                <span>Digital Signatures</span>
              </li>
            </ul>
          </div>

          {/* Links */}
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900">Resources</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>
                <a 
                  href="#" 
                  className="flex items-center space-x-2 hover:text-primary transition-colors"
                >
                  <Github size={14} />
                  <span>Source Code</span>
                  <ExternalLink size={12} />
                </a>
              </li>
              <li>
                <a 
                  href="#" 
                  className="flex items-center space-x-2 hover:text-primary transition-colors"
                >
                  <span>Documentation</span>
                  <ExternalLink size={12} />
                </a>
              </li>
              <li>
                <a 
                  href="#" 
                  className="flex items-center space-x-2 hover:text-primary transition-colors"
                >
                  <span>API Reference</span>
                  <ExternalLink size={12} />
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-gray-200">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <p className="text-sm text-gray-600">
              © 2025 Replica Platform. Built for transparency and security.
            </p>
            <div className="flex items-center space-x-4 text-sm text-gray-600">
              <span>Made with ❤️ for secure contract management</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
