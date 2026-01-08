import { useRegisterSW } from 'virtual:pwa-register/react';
import styles from './UpdatePrompt.module.css';

export function UpdatePrompt() {
  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW();

  if (!needRefresh) return null;

  return (
    <div className={styles.banner}>
      <span>New version available</span>
      <button onClick={() => updateServiceWorker(true)}>
        Update
      </button>
    </div>
  );
}
