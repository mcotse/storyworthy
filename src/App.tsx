import { useEffect, useState, useRef } from 'react';
import { useStore } from './store';
import { Navigation } from './components/Navigation';
import { Toast } from './components/Toast';
import { Onboarding } from './components/Onboarding';
import { UpdatePrompt } from './components/UpdatePrompt';
import { Home } from './pages/Home';
import { Calendar } from './pages/Calendar';
import { Analytics } from './pages/Analytics';
import { History } from './pages/History';
import { Settings } from './pages/Settings';
import { initDB } from './services/db';
import { scheduleNotifications } from './services/notifications';
import './styles/transitions.css';

function App() {
  const [isReady, setIsReady] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const prevTabRef = useRef<string | null>(null);

  const activeTab = useStore((state) => state.activeTab);

  // Handle tab transitions
  useEffect(() => {
    if (prevTabRef.current !== null && prevTabRef.current !== activeTab) {
      setIsTransitioning(true);
      const timer = setTimeout(() => setIsTransitioning(false), 150);
      return () => clearTimeout(timer);
    }
    prevTabRef.current = activeTab;
  }, [activeTab]);
  const onboardingComplete = useStore((state) => state.onboardingComplete);
  const notificationSettings = useStore((state) => state.notificationSettings);
  const loadEntries = useStore((state) => state.loadEntries);
  const initAuth = useStore((state) => state.initAuth);
  const setOnline = useStore((state) => state.setOnline);

  useEffect(() => {
    const init = async () => {
      await initDB();
      await loadEntries();
      await initAuth();
      setIsReady(true);

      if (!onboardingComplete) {
        setShowOnboarding(true);
      }

      // Schedule notifications
      scheduleNotifications(
        notificationSettings.morningTime,
        notificationSettings.eveningTime,
        notificationSettings.morningEnabled,
        notificationSettings.eveningEnabled
      );
    };

    init();

    // Listen for online/offline events
    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!isReady) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        backgroundColor: 'var(--color-background)',
      }}>
        <div style={{
          width: 40,
          height: 40,
          border: '3px solid var(--color-border)',
          borderTopColor: 'var(--color-primary)',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
        }} />
      </div>
    );
  }

  if (showOnboarding) {
    return <Onboarding onComplete={() => setShowOnboarding(false)} />;
  }

  const renderPage = () => {
    switch (activeTab) {
      case 'home':
        return <Home />;
      case 'calendar':
        return <Calendar />;
      case 'analytics':
        return <Analytics />;
      case 'history':
        return <History />;
      case 'settings':
        return <Settings />;
      default:
        return <Home />;
    }
  };

  return (
    <>
      <main style={{ flex: 1 }} className={`page-container ${isTransitioning ? '' : 'page-visible'}`}>
        {renderPage()}
      </main>
      <Navigation />
      <Toast />
      <UpdatePrompt />
    </>
  );
}

export default App;
