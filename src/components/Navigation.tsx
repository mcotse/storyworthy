import { useStore } from '../store';
import {
  HomeIcon,
  CalendarDaysIcon,
  ChartBarIcon,
  ClockIcon,
  Cog6ToothIcon,
} from '@heroicons/react/24/outline';
import styles from './Navigation.module.css';

type Tab = 'home' | 'calendar' | 'analytics' | 'history' | 'settings';

const tabs: { id: Tab; label: string; Icon: React.ComponentType<React.SVGProps<SVGSVGElement>> }[] = [
  { id: 'home', label: 'Home', Icon: HomeIcon },
  { id: 'calendar', label: 'Calendar', Icon: CalendarDaysIcon },
  { id: 'analytics', label: 'Analytics', Icon: ChartBarIcon },
  { id: 'history', label: 'History', Icon: ClockIcon },
  { id: 'settings', label: 'Settings', Icon: Cog6ToothIcon },
];

export function Navigation() {
  const activeTab = useStore((state) => state.activeTab);
  const setActiveTab = useStore((state) => state.setActiveTab);

  return (
    <nav className={`${styles.nav} safe-area-bottom`}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          className={`${styles.tab} ${activeTab === tab.id ? styles.active : ''}`}
          onClick={() => setActiveTab(tab.id)}
          aria-label={tab.label}
          aria-current={activeTab === tab.id ? 'page' : undefined}
        >
          <tab.Icon className={styles.icon} />
          <span className={styles.label}>{tab.label}</span>
        </button>
      ))}
    </nav>
  );
}
