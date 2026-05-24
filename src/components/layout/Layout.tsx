import { useState, type ReactNode } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { Footer } from './Footer';

interface LayoutProps {
  children: ReactNode;
  showSidebar?: boolean;
  showFooter?: boolean;
}

export const Layout = ({ children, showSidebar = true, showFooter = true }: LayoutProps) => {
  const { isAuthenticated, user, token } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Show sidebar if we have a token (even if user data is still loading)
  // This prevents the sidebar from disappearing during the user data fetch
  const shouldShowSidebar = showSidebar && (!!token || (isAuthenticated && user));

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const closeSidebar = () => setIsSidebarOpen(false);

  return (
    <div className="min-h-screen flex flex-col bg-cream-50">
      <Header onMenuClick={toggleSidebar} />
      
      <div className="flex flex-1 overflow-hidden relative">
        {/* Overlay with blur and fade animation for mobile when sidebar is open */}
        {shouldShowSidebar && isSidebarOpen && (
          <div
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 lg:hidden animate-fade-in"
            onClick={closeSidebar}
            aria-hidden="true"
            style={{
              animation: 'fadeIn 0.3s ease-out'
            }}
          />
        )}

        {/* Sidebar - Hidden on mobile by default, slide in with bounce when toggled */}
        {shouldShowSidebar && (
          <div
            className={`
              fixed lg:static top-0 bottom-0 left-0 z-50 lg:z-auto
              transform transition-all duration-500 ease-out
              ${isSidebarOpen ? 'translate-x-0 scale-100' : '-translate-x-full scale-95 lg:translate-x-0 lg:scale-100'}
            `}
            style={{
              transitionTimingFunction: isSidebarOpen ? 'cubic-bezier(0.34, 1.56, 0.64, 1)' : 'cubic-bezier(0.4, 0, 0.2, 1)'
            }}
          >
            <Sidebar onClose={closeSidebar} />
          </div>
        )}
        
        {/* Main Content */}
        <main 
          id="main-content" 
          className="flex-1 overflow-y-auto p-0 sm:p-6 lg:p-8 w-full" 
          role="main"
        >
          {children}
        </main>
      </div>
      
      {showFooter && <Footer />}
    </div>
  );
};
