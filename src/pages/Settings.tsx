import { useState, useEffect } from 'react';
import { useStore } from '../store';
import { exportData, importData } from '../utils/export';
import { getStorageUsage, clearAllData } from '../services/db';
import {
  requestNotificationPermission,
  getNotificationPermission,
  scheduleNotifications,
} from '../services/notifications';
import { isSupabaseConfigured } from '../services/supabase';
import { formatDistanceToNow } from 'date-fns';
import styles from './Settings.module.css';

// Store the install prompt globally so it persists across renders
let deferredPrompt: BeforeInstallPromptEvent | null = null;

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

// Listen for the beforeinstallprompt event
if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e as BeforeInstallPromptEvent;
  });
}

export function Settings() {
  const [storageUsed, setStorageUsed] = useState(0);
  const [storageQuota, setStorageQuota] = useState(50 * 1024 * 1024);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [notificationStatus, setNotificationStatus] = useState<NotificationPermission | 'unsupported'>('default');
  const [canInstall, setCanInstall] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  const notificationSettings = useStore((state) => state.notificationSettings);
  const setNotificationSettings = useStore((state) => state.setNotificationSettings);
  const addToast = useStore((state) => state.addToast);
  const loadEntries = useStore((state) => state.loadEntries);

  // Auth & Sync
  const user = useStore((state) => state.user);
  const authLoading = useStore((state) => state.authLoading);
  const isSyncing = useStore((state) => state.isSyncing);
  const lastSyncTime = useStore((state) => state.lastSyncTime);
  const isOnline = useStore((state) => state.isOnline);
  const signInWithGoogle = useStore((state) => state.signInWithGoogle);
  const signOut = useStore((state) => state.signOut);
  const triggerSync = useStore((state) => state.triggerSync);

  useEffect(() => {
    const loadStorage = async () => {
      const { used, quota } = await getStorageUsage();
      setStorageUsed(used);
      setStorageQuota(quota);
    };
    loadStorage();

    setNotificationStatus(getNotificationPermission());

    // Check if already installed
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches
      || (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
    setIsInstalled(isStandalone);

    // Check if install prompt is available
    setCanInstall(!!deferredPrompt);

    // Listen for future install prompts
    const handleBeforeInstall = () => setCanInstall(true);
    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
  }, []);

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      await exportData();
      addToast('Data exported successfully', 'success');
    } catch (error) {
      addToast('Failed to export data', 'error');
    } finally {
      setIsExporting(false);
    }
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    try {
      const count = await importData(file);
      addToast(`Imported ${count} new entries`, 'success');
      loadEntries();
    } catch (error) {
      addToast('Failed to import data. Check file format.', 'error');
    } finally {
      setIsImporting(false);
      event.target.value = '';
    }
  };

  const handleClearAll = async () => {
    if (deleteConfirm !== 'DELETE') return;

    try {
      await clearAllData();
      addToast('All data deleted', 'success');
      loadEntries();
      setShowDeleteModal(false);
      setDeleteConfirm('');
    } catch (error) {
      addToast('Failed to delete data', 'error');
    }
  };

  const handleNotificationToggle = async (type: 'morning' | 'evening') => {
    const newSettings = {
      ...notificationSettings,
      [type === 'morning' ? 'morningEnabled' : 'eveningEnabled']:
        !notificationSettings[type === 'morning' ? 'morningEnabled' : 'eveningEnabled'],
    };

    // Request permission if enabling
    if (newSettings.morningEnabled || newSettings.eveningEnabled) {
      if (notificationStatus !== 'granted') {
        const granted = await requestNotificationPermission();
        if (!granted) {
          addToast('Please enable notifications in your browser settings', 'info');
          return;
        }
        setNotificationStatus('granted');
      }
    }

    setNotificationSettings(newSettings);
    scheduleNotifications(
      newSettings.morningTime,
      newSettings.eveningTime,
      newSettings.morningEnabled,
      newSettings.eveningEnabled
    );
  };

  const handleTimeChange = (type: 'morning' | 'evening', time: string) => {
    const newSettings = {
      ...notificationSettings,
      [type === 'morning' ? 'morningTime' : 'eveningTime']: time,
    };
    setNotificationSettings(newSettings);
    scheduleNotifications(
      newSettings.morningTime,
      newSettings.eveningTime,
      newSettings.morningEnabled,
      newSettings.eveningEnabled
    );
  };

  const storagePercentage = (storageUsed / storageQuota) * 100;

  const handleInstall = async () => {
    if (!deferredPrompt) {
      addToast('Install not available. Try using Safari share menu.', 'info');
      return;
    }

    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        addToast('App installed!', 'success');
        setIsInstalled(true);
      }
      deferredPrompt = null;
      setCanInstall(false);
    } catch (error) {
      addToast('Installation failed', 'error');
    }
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>Settings</h1>
      </header>

      <main className={styles.main}>
        {/* Notifications Section */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Notifications</h2>

          {notificationStatus === 'unsupported' ? (
            <p className={styles.warning}>Notifications are not supported in this browser</p>
          ) : notificationStatus === 'denied' ? (
            <p className={styles.warning}>
              Notifications are blocked. Enable them in your browser settings.
            </p>
          ) : (
            <>
              <div className={styles.settingRow}>
                <div className={styles.settingInfo}>
                  <span className={styles.settingLabel}>Morning Reminder</span>
                  <span className={styles.settingDesc}>Get reminded to journal in the morning</span>
                </div>
                <div className={styles.settingControls}>
                  <input
                    type="time"
                    value={notificationSettings.morningTime}
                    onChange={(e) => handleTimeChange('morning', e.target.value)}
                    className={styles.timeInput}
                    disabled={!notificationSettings.morningEnabled}
                  />
                  <label className={styles.toggle}>
                    <input
                      type="checkbox"
                      checked={notificationSettings.morningEnabled}
                      onChange={() => handleNotificationToggle('morning')}
                    />
                    <span className={styles.slider} />
                  </label>
                </div>
              </div>

              <div className={styles.settingRow}>
                <div className={styles.settingInfo}>
                  <span className={styles.settingLabel}>Evening Reminder</span>
                  <span className={styles.settingDesc}>Reflect on your day in the evening</span>
                </div>
                <div className={styles.settingControls}>
                  <input
                    type="time"
                    value={notificationSettings.eveningTime}
                    onChange={(e) => handleTimeChange('evening', e.target.value)}
                    className={styles.timeInput}
                    disabled={!notificationSettings.eveningEnabled}
                  />
                  <label className={styles.toggle}>
                    <input
                      type="checkbox"
                      checked={notificationSettings.eveningEnabled}
                      onChange={() => handleNotificationToggle('evening')}
                    />
                    <span className={styles.slider} />
                  </label>
                </div>
              </div>
            </>
          )}
        </section>

        {/* Cloud Sync Section */}
        {isSupabaseConfigured() && (
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Cloud Sync</h2>

            {authLoading ? (
              <p className={styles.syncStatus}>Loading...</p>
            ) : user ? (
              <>
                <div className={styles.userInfo}>
                  <div className={styles.userAvatar}>
                    {user.user_metadata?.avatar_url ? (
                      <img src={user.user_metadata.avatar_url} alt="" />
                    ) : (
                      <span>{user.email?.[0].toUpperCase()}</span>
                    )}
                  </div>
                  <div className={styles.userDetails}>
                    <span className={styles.userName}>
                      {user.user_metadata?.full_name || user.email}
                    </span>
                    <span className={styles.userEmail}>{user.email}</span>
                  </div>
                </div>

                <div className={styles.syncInfo}>
                  <div className={styles.syncStatus}>
                    {!isOnline ? (
                      <span className={styles.offline}>Offline</span>
                    ) : isSyncing ? (
                      <span className={styles.syncing}>Syncing...</span>
                    ) : lastSyncTime ? (
                      <span>Last synced {formatDistanceToNow(lastSyncTime, { addSuffix: true })}</span>
                    ) : (
                      <span>Not synced yet</span>
                    )}
                  </div>

                  <button
                    className="btn-secondary"
                    onClick={() => triggerSync()}
                    disabled={isSyncing || !isOnline}
                    style={{ width: '100%', marginTop: 'var(--spacing-md)' }}
                  >
                    {isSyncing ? 'Syncing...' : 'Sync Now'}
                  </button>
                </div>

                <button
                  className="btn-secondary"
                  onClick={() => signOut()}
                  style={{ width: '100%', marginTop: 'var(--spacing-md)' }}
                >
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <p className={styles.syncDesc}>
                  Sign in to sync your entries across devices.
                </p>
                <button
                  className="btn-primary"
                  onClick={() => signInWithGoogle()}
                  style={{ width: '100%' }}
                >
                  Sign in with Google
                </button>
              </>
            )}
          </section>
        )}

        {/* Data Management Section */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Data Management</h2>

          <div className={styles.storageInfo}>
            <div className={styles.storageHeader}>
              <span>Storage Used</span>
              <span>{formatBytes(storageUsed)} / {formatBytes(storageQuota)}</span>
            </div>
            <div className={styles.storageBar}>
              <div
                className={styles.storageProgress}
                style={{ width: `${Math.min(storagePercentage, 100)}%` }}
              />
            </div>
          </div>

          <div className={styles.buttonGroup}>
            <button
              className="btn-secondary"
              onClick={handleExport}
              disabled={isExporting}
            >
              {isExporting ? 'Exporting...' : 'Export All Entries'}
            </button>
            <p className={styles.note}>Photos are not included in export</p>
          </div>

          <div className={styles.buttonGroup}>
            <label className="btn-secondary" style={{ cursor: 'pointer' }}>
              {isImporting ? 'Importing...' : 'Import from File'}
              <input
                type="file"
                accept=".json"
                onChange={handleImport}
                style={{ display: 'none' }}
                disabled={isImporting}
              />
            </label>
          </div>
        </section>

        {/* Danger Zone Section */}
        <section className={`${styles.section} ${styles.dangerSection}`}>
          <h2 className={styles.sectionTitle}>Danger Zone</h2>
          <p className={styles.dangerDesc}>
            This action is permanent and cannot be undone.
          </p>
          <button
            className="btn-danger"
            onClick={() => setShowDeleteModal(true)}
          >
            Delete All Entries
          </button>
        </section>

        {/* Install App Section */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Install App</h2>
          {isInstalled ? (
            <p className={styles.installedText}>App is installed on your device</p>
          ) : (
            <>
              <p className={styles.installDesc}>
                Install Storyworthy on your home screen for quick access and offline use.
              </p>
              {canInstall ? (
                <button className="btn-primary" onClick={handleInstall} style={{ width: '100%' }}>
                  Add to Home Screen
                </button>
              ) : (
                <div className={styles.installInstructions}>
                  <p><strong>On iPhone/iPad:</strong></p>
                  <p>Tap the Share button, then "Add to Home Screen"</p>
                  <p style={{ marginTop: '12px' }}><strong>On Android:</strong></p>
                  <p>Tap the menu (3 dots), then "Add to Home Screen"</p>
                </div>
              )}
            </>
          )}
        </section>

        {/* About Section */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>About</h2>
          <div className={styles.aboutInfo}>
            <p><strong>Storyworthy</strong></p>
            <p className={styles.version}>Version {__APP_VERSION__}</p>
            <p className={styles.description}>
              A minimal, distraction-free journaling app for capturing storyworthy moments and gratitude.
            </p>
          </div>
        </section>
      </main>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className={styles.modalOverlay} onClick={() => setShowDeleteModal(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h3>Delete All Data?</h3>
            <p>This action cannot be undone. All your entries will be permanently deleted.</p>
            <p>Type <strong>DELETE</strong> to confirm:</p>
            <input
              type="text"
              value={deleteConfirm}
              onChange={(e) => setDeleteConfirm(e.target.value)}
              placeholder="Type DELETE"
              className={styles.confirmInput}
            />
            <div className={styles.modalButtons}>
              <button className="btn-secondary" onClick={() => setShowDeleteModal(false)}>
                Cancel
              </button>
              <button
                className="btn-danger"
                onClick={handleClearAll}
                disabled={deleteConfirm !== 'DELETE'}
              >
                Delete All
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
