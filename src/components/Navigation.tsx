import { useStore } from '../store';
import {
  HomeIcon,
  CalendarDaysIcon,
  ChartBarIcon,
  ClockIcon,
  Cog6ToothIcon,
} from '@heroicons/react/24/outline';
import styles from './Navigation.module.css';

type Tab = 'home' | 'calendar' | 'history' | 'trends' | 'settings';

const tabs: { id: Tab; label: string; Icon: React.ComponentType<React.SVGProps<SVGSVGElement>> }[] = [
  { id: 'home', label: 'Home', Icon: HomeIcon },
  { id: 'calendar', label: 'Calendar', Icon: CalendarDaysIcon },
  { id: 'history', label: 'History', Icon: ClockIcon },
  { id: 'trends', label: 'Trends', Icon: ChartBarIcon },
  { id: 'settings', label: 'Settings', Icon: Cog6ToothIcon },
];

export function Navigation() {
  const activeTab = useStore((state) => state.activeTab);
  const setActiveTab = useStore((state) => state.setActiveTab);

  const activeIndex = tabs.findIndex((tab) => tab.id === activeTab);

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
      <div
        className={styles.indicator}
        style={{
          transform: `translateX(calc(${activeIndex} * (100vw / ${tabs.length}) + (100vw / ${tabs.length} / 2) - 50%))`,
        }}
      />
    </nav>
  );
}
