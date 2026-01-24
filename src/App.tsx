import { useEffect, useState, useRef } from 'react';
import { useStore } from './store';
import { Navigation } from './components/Navigation';
import { Toast } from './components/Toast';
import { Onboarding } from './components/Onboarding';
import { UpdatePrompt } from './components/UpdatePrompt';
import { Home } from './pages/Home';
import { Calendar } from './pages/Calendar';
import { Trends } from './pages/Trends';
import { History } from './pages/History';
import { Settings } from './pages/Settings';
import { initDB } from './services/db';
import { scheduleNotifications, updateBadge, getIncompleteDaysCount } from './services/notifications';
import type { Tab } from './store';
import './styles/transitions.css';

const TRANSITION_DURATION = 250; // ms

function App() {
  const [isReady, setIsReady] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [displayedTab, setDisplayedTab] = useState<Tab>('home');
  const [isAnimating, setIsAnimating] = useState(false);
  const prevTabRef = useRef<Tab>('home');

  const activeTab = useStore((state) => state.activeTab);

  // Handle tab transitions with cross-fade
  useEffect(() => {
    if (prevTabRef.current !== activeTab) {
      // Start exit animation
      setIsAnimating(true);

      // After half the duration, switch the content
      const switchTimer = setTimeout(() => {
        setDisplayedTab(activeTab);
      }, TRANSITION_DURATION / 2);

      // After full duration, end animation
      const endTimer = setTimeout(() => {
        setIsAnimating(false);
        prevTabRef.current = activeTab;
      }, TRANSITION_DURATION);

      return () => {
        clearTimeout(switchTimer);
        clearTimeout(endTimer);
      };
    }
  }, [activeTab]);
  const entries = useStore((state) => state.entries);
  const onboardingComplete = useStore((state) => state.onboardingComplete);
  const notificationSettings = useStore((state) => state.notificationSettings);
  const loadEntries = useStore((state) => state.loadEntries);
  const initAuth = useStore((state) => state.initAuth);
  const setOnline = useStore((state) => state.setOnline);

  // Update badge when entries change or notification settings change
  useEffect(() => {
    const updateAppBadge = async () => {
      const count = await getIncompleteDaysCount(notificationSettings);
      await updateBadge(count);
    };
    updateAppBadge();
  }, [entries, notificationSettings]);

  useEffect(() => {
    const init = async () => {
      try {
        await initDB();
        await loadEntries();
        await initAuth();
      } catch (error) {
        console.error('App initialization failed:', error);
        // Continue loading the app even if initialization fails
        // The user will see an empty state and can retry
      }

      setIsReady(true);

      if (!onboardingComplete) {
        setShowOnboarding(true);
      }

      // Schedule notifications
      scheduleNotifications(notificationSettings.reminders);
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

  const renderPage = (tab: Tab) => {
    switch (tab) {
      case 'home':
        return <Home />;
      case 'calendar':
        return <Calendar />;
      case 'trends':
        return <Trends />;
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
      <main
        className={`page-container ${isAnimating ? 'page-animating' : 'page-visible'}`}
      >
        {renderPage(displayedTab)}
      </main>
      <Navigation />
      <Toast />
      <UpdatePrompt />
    </>
  );
}

export default App;
