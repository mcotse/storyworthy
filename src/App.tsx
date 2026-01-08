import { useEffect, useState } from 'react';
import { useStore } from './store';
import { Navigation } from './components/Navigation';
import { Toast } from './components/Toast';
import { Onboarding } from './components/Onboarding';
import { Home } from './pages/Home';
import { Calendar } from './pages/Calendar';
import { Analytics } from './pages/Analytics';
import { Random } from './pages/Random';
import { Settings } from './pages/Settings';
import { initDB } from './services/db';
import { scheduleNotifications } from './services/notifications';

function App() {
  const [isReady, setIsReady] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);

  const activeTab = useStore((state) => state.activeTab);
  const onboardingComplete = useStore((state) => state.onboardingComplete);
  const notificationSettings = useStore((state) => state.notificationSettings);
  const loadEntries = useStore((state) => state.loadEntries);

  useEffect(() => {
    const init = async () => {
      await initDB();
      await loadEntries();
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
      case 'random':
        return <Random />;
      case 'settings':
        return <Settings />;
      default:
        return <Home />;
    }
  };

  return (
    <>
      <main style={{ flex: 1 }}>
        {renderPage()}
      </main>
      <Navigation />
      <Toast />
    </>
  );
}

export default App;
