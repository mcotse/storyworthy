import { useStore } from '../store';
import styles from './Toast.module.css';

export function Toast() {
  const toasts = useStore((state) => state.toasts);
  const removeToast = useStore((state) => state.removeToast);

  if (toasts.length === 0) return null;

  return (
    <div className={styles.container}>
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`${styles.toast} ${styles[toast.type]}`}
          onClick={() => removeToast(toast.id)}
        >
          <span>{toast.message}</span>
          <button className={styles.closeBtn} aria-label="Dismiss">
            &times;
          </button>
        </div>
      ))}
    </div>
  );
}
