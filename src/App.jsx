import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import AppRoutes from './routes/AppRoutes';
import BottomNav from './components/BottomNav';
import { authService } from './services/firebase';

const App = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  // Listen to Auth State Changes
  useEffect(() => {
    const unsubscribe = authService.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleAuthChange = (updatedUser) => {
    setUser(updatedUser);
  };

  // Determine if navigation bars should be hidden (full-screen views)
  const isFullScreenView = ['/splash', '/login', '/register'].includes(location.pathname);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#090a10] text-[#eaeaf0]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-transparent border-t-[#8b5cf6] rounded-full animate-spin" />
          <p className="text-sm font-semibold tracking-wider text-[#8d93ad] animate-pulse">
            Booting AniStream...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#090a10] text-[#eaeaf0] flex flex-col">
      {/* Sidebar for Desktop / Bottombar for Mobile (Hidden on Splash/Login) */}
      {!isFullScreenView && <BottomNav user={user} />}

      {/* Main Content Area */}
      <main 
        className={`flex-1 flex flex-col min-w-0 ${
          isFullScreenView 
            ? 'p-0 h-screen' 
            : 'px-4 py-6 md:p-8 pb-24 md:pb-8 max-w-7xl mx-auto w-full'
        }`}
      >
        <AppRoutes 
          user={user} 
          loading={loading} 
          onAuthChange={handleAuthChange} 
        />
      </main>
    </div>
  );
};

export default App;
