import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useState, useEffect } from 'react';

interface HeaderProps {
  onMenuClick?: () => void;
}

// Smooth scroll function with offset for sticky header
const scrollToSection = (sectionId: string) => {
  const element = document.getElementById(sectionId);
  if (element) {
    const headerHeight = 80; // Approximate header height
    const elementPosition = element.getBoundingClientRect().top;
    const offsetPosition = elementPosition + window.pageYOffset - headerHeight;

    window.scrollTo({
      top: offsetPosition,
      behavior: 'smooth'
    });
  }
};

export const Header = ({ onMenuClick }: HeaderProps) => {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('home');
  
  // Check if we're on the home page
  const isHomePage = location.pathname === '/';

  // Track active section on scroll
  useEffect(() => {
    if (!isHomePage) return;

    const handleScroll = () => {
      const sections = ['home', 'features', 'doctors', 'how-it-works', 'testimonials'];
      const scrollPosition = window.scrollY + 100; // Offset for header

      for (const sectionId of sections) {
        const element = document.getElementById(sectionId);
        if (element) {
          const { offsetTop, offsetHeight } = element;
          if (scrollPosition >= offsetTop && scrollPosition < offsetTop + offsetHeight) {
            setActiveSection(sectionId);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Check initial position

    return () => window.removeEventListener('scroll', handleScroll);
  }, [isHomePage]);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const getDashboardLink = () => {
    if (!user) return '/';
    switch (user.role) {
      case 'admin':
        return '/admin/dashboard';
      case 'staff':
        return '/staff/dashboard';
      case 'patient':
        return '/patient/dashboard';
      default:
        return '/';
    }
  };

  // Handle navigation menu clicks
  const handleNavClick = (sectionId: string) => {
    setIsMobileMenuOpen(false); // Close mobile menu
    if (isHomePage) {
      scrollToSection(sectionId);
    } else {
      navigate('/', { replace: true });
      // Wait for navigation to complete, then scroll
      setTimeout(() => scrollToSection(sectionId), 100);
    }
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <>
      {/* Overlay - Covers viewport except sidebar area */}
      {!isAuthenticated && isMobileMenuOpen && (
        <div
          className="fixed inset-y-0 left-64 right-0 bg-black/50 backdrop-blur-lg z-[9998] lg:hidden animate-fade-in"
          onClick={() => setIsMobileMenuOpen(false)}
          aria-hidden="true"
          style={{
            animation: 'fadeIn 0.3s ease-out'
          }}
        />
      )}

      <header className="glass sticky top-0 z-50 border-b border-white/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 sm:h-20">
          {/* Logo and Brand */}
          <div className="flex items-center">
            {/* Mobile Logo - Small icon with text */}
            {isAuthenticated && (
              <Link 
                to="/" 
                className="flex lg:hidden items-center gap-2 focus:outline-none rounded-lg p-2 transition-all hover:bg-white/50"
                aria-label="ClinicPortal Home"
              >
                <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center shadow-sm flex-shrink-0">
                  <svg className="w-5 h-5 text-cream-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div className="flex flex-col">
                  <h2 className="text-base font-bold text-primary-500 leading-tight">Clinora</h2>
                  <p className="text-xs text-sage-600 leading-tight">Patient Portal</p>
                </div>
              </Link>
            )}
            
            {/* Desktop Logo - Full branding */}
            <Link 
              to="/" 
              className={`items-center space-x-2 sm:space-x-3 focus:outline-none rounded-xl px-2 sm:px-3 py-2 transition-all hover:bg-white/50 group ${isAuthenticated ? 'hidden lg:flex' : 'flex'}`}
              aria-label="ClinicPortal Home"
            >
              <div className="relative flex-shrink-0">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary-500 rounded-xl flex items-center justify-center shadow-card group-hover:shadow-lg transition-all duration-300">
                  <svg className="w-5 h-5 sm:w-7 sm:h-7 text-cream-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div className="absolute -top-1 -right-1 w-3 h-3 sm:w-4 sm:h-4 bg-gold-500 rounded-full animate-pulse"></div>
              </div>
              <div className="hidden sm:flex sm:flex-col">
                <h1 className="text-xl sm:text-2xl font-display font-bold text-primary-500 leading-tight">
                  ClinicPortal
                </h1>
                <p className="text-xs text-sage-600 font-medium leading-tight">Healthcare Excellence</p>
              </div>
            </Link>
          </div>

          {/* Navigation Menu - Only show when not authenticated */}
          {!isAuthenticated && (
            <nav className="hidden lg:flex items-center space-x-8">
              <button
                onClick={() => handleNavClick('home')}
                className={`font-medium text-sm transition-all duration-200 outline-none px-2 py-1 relative group ${
                  activeSection === 'home' 
                    ? 'text-primary-500' 
                    : 'text-charcoal-600 hover:text-primary-500'
                }`}
              >
                Home
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary-500 transition-all duration-200 group-hover:w-full"></span>
              </button>
              <button
                onClick={() => handleNavClick('features')}
                className={`font-medium text-sm transition-all duration-200 outline-none px-2 py-1 relative group ${
                  activeSection === 'features' 
                    ? 'text-primary-500' 
                    : 'text-charcoal-600 hover:text-primary-500'
                }`}
              >
                Features
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary-500 transition-all duration-200 group-hover:w-full"></span>
              </button>
              <button
                onClick={() => handleNavClick('doctors')}
                className={`font-medium text-sm transition-all duration-200 outline-none px-2 py-1 relative group ${
                  activeSection === 'doctors' 
                    ? 'text-primary-500' 
                    : 'text-charcoal-600 hover:text-primary-500'
                }`}
              >
                Doctors
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary-500 transition-all duration-200 group-hover:w-full"></span>
              </button>
              <button
                onClick={() => handleNavClick('how-it-works')}
                className={`font-medium text-sm transition-all duration-200 outline-none px-2 py-1 relative group ${
                  activeSection === 'how-it-works' 
                    ? 'text-primary-500' 
                    : 'text-charcoal-600 hover:text-primary-500'
                }`}
              >
                How It Works
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary-500 transition-all duration-200 group-hover:w-full"></span>
              </button>
              <button
                onClick={() => handleNavClick('testimonials')}
                className={`font-medium text-sm transition-all duration-200 outline-none px-2 py-1 relative group ${
                  activeSection === 'testimonials' 
                    ? 'text-primary-500' 
                    : 'text-charcoal-600 hover:text-primary-500'
                }`}
              >
                Reviews
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary-500 transition-all duration-200 group-hover:w-full"></span>
              </button>
            </nav>
          )}

          {/* User Menu and Mobile Toggle */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {isAuthenticated && user ? (
              <>
                {/* Mobile menu button - Shows sidebar */}
                <button
                  onClick={onMenuClick}
                  className="lg:hidden p-2 sm:p-3 rounded-xl text-charcoal-600 hover:text-primary-500 hover:bg-white/60 focus:outline-none focus:ring-2 focus:ring-gold-500 transition-all"
                  aria-label="Open menu"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>

                {/* Desktop User Info */}
                <Link 
                  to={getDashboardLink()}
                  className="hidden md:flex items-center space-x-3 glass rounded-xl px-4 py-2.5 border border-white/30 hover:bg-white/60 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-gold-500"
                >
                  {user.profile_picture ? (
                    <img
                      key={user.profile_picture}
                      src={`http://localhost:8000/storage/${user.profile_picture}`}
                      alt={user.name}
                      className="w-10 h-10 rounded-full object-cover shadow-card"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gold-500 flex items-center justify-center text-white font-bold text-sm shadow-card">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold text-primary-500 truncate max-w-[150px]">{user.name}</span>
                    <span className="text-xs text-sage-600 capitalize font-medium">{user.role}</span>
                  </div>
                </Link>

                {/* Desktop Logout Button */}
                <button
                  onClick={handleLogout}
                  className="hidden sm:flex items-center space-x-2 text-charcoal-600 hover:text-primary-500 hover:bg-white/60 px-3 sm:px-4 py-2 sm:py-2.5 text-sm font-semibold transition-all rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
                  aria-label="Logout"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </>
            ) : (
              <>
                {/* Mobile menu button for non-authenticated users */}
                <button
                  onClick={toggleMobileMenu}
                  className="lg:hidden p-2 sm:p-3 rounded-xl text-charcoal-600 hover:text-primary-500 hover:bg-white/60 focus:outline-none focus:ring-2 focus:ring-gold-500 transition-all"
                  aria-label="Open menu"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>

                <Link
                  to="/login"
                  className="hidden lg:inline-flex text-charcoal-600 hover:text-primary-500 hover:bg-white/60 px-3 sm:px-4 py-2 sm:py-2.5 text-sm font-semibold transition-all rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
                  aria-label="Login to your account"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="hidden lg:inline-flex bg-gold-500 text-white hover:bg-gold-600 hover:shadow-lg px-3 sm:px-5 py-2 sm:py-2.5 rounded-xl text-sm font-bold transition-all focus:outline-none focus:ring-2 focus:ring-gold-500 focus:ring-offset-2 shadow-card"
                  aria-label="Register new account"
                >
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Navigation Sidebar - Only for non-authenticated users */}
      {!isAuthenticated && (
        <>
          {/* Mobile Navigation Sidebar - Hidden by default, slide in with bounce when toggled */}
          <div
            className={`
              fixed lg:hidden inset-y-0 left-0 z-[9999] w-64 isolate
              transform transition-all duration-500 ease-out
              ${isMobileMenuOpen ? 'translate-x-0 scale-100' : '-translate-x-full scale-95'}
            `}
            style={{
              transitionTimingFunction: isMobileMenuOpen ? 'cubic-bezier(0.34, 1.56, 0.64, 1)' : 'cubic-bezier(0.4, 0, 0.2, 1)',
              isolation: 'isolate'
            }}
          >
            <aside
              className="w-full bg-white shadow-2xl h-screen overflow-hidden"
              aria-label="Mobile navigation"
              role="navigation"
            >
              <div className="h-full flex flex-col">
                {/* Mobile Navigation Header */}
                <div className="flex items-center justify-between h-20 px-6 bg-[#031a1e]">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center shadow-sm flex-shrink-0">
                      <svg className="w-5 h-5 text-cream-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-base font-bold text-white leading-tight">ClinicPortal</span>
                      <span className="text-xs text-white/60 leading-tight">Healthcare Excellence</span>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="p-2 rounded-lg text-white hover:bg-white/10 transition-colors"
                    aria-label="Close navigation"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* Navigation Links */}
                <nav className="flex-1 overflow-y-auto px-6 pt-8 pb-6 bg-white" aria-label="Mobile navigation menu">
                  <div className="text-xs font-semibold text-gray-400 mb-6 uppercase tracking-wider">Menu</div>
                  
                  <div className="space-y-0">
                    <button
                      onClick={() => handleNavClick('home')}
                      className={`flex items-center w-full px-4 py-4 text-base font-normal transition-all duration-200 outline-none border-b border-gray-200 ${
                        activeSection === 'home'
                          ? 'bg-[#E8F4F3] text-gray-900'
                          : 'text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      <svg className="w-6 h-6 mr-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                      </svg>
                      Home
                    </button>
                    
                    <button
                      onClick={() => handleNavClick('features')}
                      className={`flex items-center w-full px-4 py-4 text-base font-normal transition-all duration-200 outline-none border-b border-gray-200 ${
                        activeSection === 'features'
                          ? 'bg-[#E8F4F3] text-gray-900'
                          : 'text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      <svg className="w-6 h-6 mr-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Features
                    </button>
                    
                    <button
                      onClick={() => handleNavClick('doctors')}
                      className={`flex items-center w-full px-4 py-4 text-base font-normal transition-all duration-200 outline-none border-b border-gray-200 ${
                        activeSection === 'doctors'
                          ? 'bg-[#E8F4F3] text-gray-900'
                          : 'text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      <svg className="w-6 h-6 mr-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      Doctors
                    </button>
                    
                    <button
                      onClick={() => handleNavClick('how-it-works')}
                      className={`flex items-center w-full px-4 py-4 text-base font-normal transition-all duration-200 outline-none border-b border-gray-200 ${
                        activeSection === 'how-it-works'
                          ? 'bg-[#E8F4F3] text-gray-900'
                          : 'text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      <svg className="w-6 h-6 mr-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      How It Works
                    </button>
                    
                    <button
                      onClick={() => handleNavClick('testimonials')}
                      className={`flex items-center w-full px-4 py-4 text-base font-normal transition-all duration-200 outline-none ${
                        activeSection === 'testimonials'
                          ? 'bg-[#E8F4F3] text-gray-900'
                          : 'text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      <svg className="w-6 h-6 mr-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                      Reviews
                    </button>
                  </div>
                </nav>

                {/* Mobile Navigation Footer */}
                <div className="p-5 bg-[#031a1e]">
                  <div className="flex gap-3">
                    <Link
                      to="/login"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex-1 flex items-center justify-center px-6 py-2 text-base font-medium text-white border-2 border-white/40 rounded-full hover:bg-white/10 transition-colors"
                    >
                      Login
                    </Link>
                    <Link
                      to="/register"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex-1 flex items-center justify-center px-6 py-2 text-base font-semibold bg-[#C9A961] text-white rounded-full hover:bg-[#B89851] transition-colors shadow-sm"
                    >
                      Register
                    </Link>
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </>
      )}
    </header>
    </>
  );
};
