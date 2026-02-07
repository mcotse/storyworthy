import { useState, useEffect } from 'react';
import { useStore } from '../store';
import { exportData, exportDataWithPhotos, importDataAuto } from '../utils/export';
import { getStorageUsage, clearAllData, createEntry } from '../services/db';
import { getSampleEntries } from '../utils/sampleData';
import {
  requestNotificationPermission,
  getNotificationPermission,
  scheduleNotifications,
} from '../services/notifications';
import {
  isPushSupported,
  subscribeToPush,
  unsubscribeFromPush,
  sendTestPush,
  getPushSubscription,
} from '../services/push';
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
  const [isExportingWithPhotos, setIsExportingWithPhotos] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isLoadingSample, setIsLoadingSample] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [notificationStatus, setNotificationStatus] = useState<NotificationPermission | 'unsupported'>('default');
  const [canInstall, setCanInstall] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [pushStatus, setPushStatus] = useState<'loading' | 'active' | 'inactive'>('loading');
  const [isSendingTest, setIsSendingTest] = useState(false);

  const notificationSettings = useStore((state) => state.notificationSettings);
  const setNotificationSettings = useStore((state) => state.setNotificationSettings);
  const addReminder = useStore((state) => state.addReminder);
  const updateReminder = useStore((state) => state.updateReminder);
  const removeReminder = useStore((state) => state.removeReminder);
  const missedDaysLimit = useStore((state) => state.missedDaysLimit);
  const setMissedDaysLimit = useStore((state) => state.setMissedDaysLimit);
  const savePhotosToDevice = useStore((state) => state.savePhotosToDevice);
  const setSavePhotosToDevice = useStore((state) => state.setSavePhotosToDevice);
  const setSavePhotosPromptShown = useStore((state) => state.setSavePhotosPromptShown);
  const addToast = useStore((state) => state.addToast);
  const loadEntries = useStore((state) => state.loadEntries);

  // Auth & Sync
  const user = useStore((state) => state.user);
  const authLoading = useStore((state) => state.authLoading);
  const isSyncing = useStore((state) => state.isSyncing);
  const syncProgress = useStore((state) => state.syncProgress);
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

    // Check push subscription status
    if (isPushSupported()) {
      getPushSubscription().then((sub) => {
        setPushStatus(sub ? 'active' : 'inactive');
      });
    } else {
      setPushStatus('inactive');
    }

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

  const handleExportWithPhotos = async () => {
    setIsExportingWithPhotos(true);
    try {
      await exportDataWithPhotos();
      addToast('Data exported with photos successfully', 'success');
    } catch (error) {
      addToast('Failed to export data with photos', 'error');
    } finally {
      setIsExportingWithPhotos(false);
    }
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    try {
      const count = await importDataAuto(file);
      const isZip = file.name.endsWith('.zip');
      addToast(`Imported ${count} new entries${isZip ? ' with photos' : ''}`, 'success');
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

  const handleLoadSampleData = async () => {
    setIsLoadingSample(true);
    try {
      const sampleEntries = getSampleEntries();
      let loadedCount = 0;
      for (const entry of sampleEntries) {
        await createEntry(entry);
        loadedCount++;
      }
      await loadEntries();
      addToast(`Loaded ${loadedCount} sample entries`, 'success');
    } catch (error) {
      addToast('Failed to load sample data', 'error');
    } finally {
      setIsLoadingSample(false);
    }
  };

  const handleReminderToggle = async (id: string) => {
    const reminder = notificationSettings.reminders.find((r) => r.id === id);
    if (!reminder) return;

    const newEnabled = !reminder.enabled;

    // Request permission if enabling
    if (newEnabled && notificationStatus !== 'granted') {
      const granted = await requestNotificationPermission();
      if (!granted) {
        addToast('Please enable notifications in your browser settings', 'info');
        return;
      }
      setNotificationStatus('granted');
    }

    updateReminder(id, { enabled: newEnabled });

    // Reschedule notifications
    const updatedReminders = notificationSettings.reminders.map((r) =>
      r.id === id ? { ...r, enabled: newEnabled } : r
    );
    scheduleNotifications(updatedReminders);
  };

  const handleTimeChange = (id: string, time: string) => {
    updateReminder(id, { time });

    // Reschedule notifications
    const updatedReminders = notificationSettings.reminders.map((r) =>
      r.id === id ? { ...r, time } : r
    );
    scheduleNotifications(updatedReminders);
  };

  const handleLabelChange = (id: string, label: string) => {
    updateReminder(id, { label });
  };

  const handleAddReminder = async () => {
    if (notificationSettings.reminders.length >= 5) {
      addToast('Maximum of 5 reminders allowed', 'error');
      return;
    }

    // Request permission if not granted
    if (notificationStatus !== 'granted') {
      const granted = await requestNotificationPermission();
      if (!granted) {
        addToast('Please enable notifications in your browser settings', 'info');
        return;
      }
      setNotificationStatus('granted');
    }

    const newReminder = {
      id: `reminder-${Date.now()}`,
      time: '12:00',
      enabled: true,
      label: '',
    };
    addReminder(newReminder);

    // Reschedule notifications
    scheduleNotifications([...notificationSettings.reminders, newReminder]);
  };

  const handleRemoveReminder = (id: string) => {
    removeReminder(id);

    // Reschedule notifications
    const updatedReminders = notificationSettings.reminders.filter((r) => r.id !== id);
    scheduleNotifications(updatedReminders);
  };

  const handlePushToggle = async () => {
    if (notificationSettings.pushEnabled) {
      // Disable push
      await unsubscribeFromPush();
      setNotificationSettings({ ...notificationSettings, pushEnabled: false });
      setPushStatus('inactive');
      addToast('Push notifications disabled', 'info');
    } else {
      // Enable push — request permission first
      if (Notification.permission !== 'granted') {
        const granted = await requestNotificationPermission();
        if (!granted) {
          addToast('Please enable notifications in your browser settings', 'info');
          return;
        }
        setNotificationStatus('granted');
      }

      const subscription = await subscribeToPush();
      if (subscription) {
        setNotificationSettings({ ...notificationSettings, pushEnabled: true });
        setPushStatus('active');
        addToast('Push notifications enabled', 'success');
      } else {
        addToast('Failed to enable push notifications', 'error');
      }
    }
  };

  const handleSendTestPush = async () => {
    setIsSendingTest(true);
    try {
      const ok = await sendTestPush();
      if (ok) {
        addToast('Test notification sent', 'success');
      } else {
        addToast('Failed to send test notification', 'error');
      }
    } finally {
      setIsSendingTest(false);
    }
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
          ) : notificationStatus === 'default' ? (
            <>
              <p className={styles.settingDesc} style={{ marginBottom: 'var(--spacing-md)' }}>
                Enable notifications to get daily reminders to write your journal entries.
              </p>
              <button
                className="btn-primary"
                onClick={async () => {
                  const granted = await requestNotificationPermission();
                  setNotificationStatus(granted ? 'granted' : 'denied');
                }}
                style={{ width: '100%' }}
              >
                Enable Notifications
              </button>
            </>
          ) : (
            <>
              <div className={styles.remindersList}>
                {notificationSettings.reminders.map((reminder) => (
                  <div key={reminder.id} className={styles.reminderItem}>
                    <div className={styles.reminderTop}>
                      <input
                        type="text"
                        value={reminder.label || ''}
                        onChange={(e) => handleLabelChange(reminder.id, e.target.value)}
                        placeholder="Label (optional)"
                        className={styles.labelInput}
                      />
                      <button
                        className={styles.removeBtn}
                        onClick={() => handleRemoveReminder(reminder.id)}
                        aria-label="Remove reminder"
                      >
                        ×
                      </button>
                    </div>
                    <div className={styles.reminderControls}>
                      <input
                        type="time"
                        value={reminder.time}
                        onChange={(e) => handleTimeChange(reminder.id, e.target.value)}
                        className={styles.timeInput}
                        disabled={!reminder.enabled}
                      />
                      <label className={styles.toggle}>
                        <input
                          type="checkbox"
                          checked={reminder.enabled}
                          onChange={() => handleReminderToggle(reminder.id)}
                        />
                        <span className={styles.slider} />
                      </label>
                    </div>
                  </div>
                ))}
              </div>

              {notificationSettings.reminders.length < 5 && (
                <button
                  className="btn-secondary"
                  onClick={handleAddReminder}
                  style={{ width: '100%', marginTop: 'var(--spacing-md)' }}
                >
                  Add Reminder ({notificationSettings.reminders.length}/5)
                </button>
              )}

              <p className={styles.note}>
                Note: Reminders only work while the app is open. Enable Push Notifications below for reminders that work even when the app is closed.
              </p>
            </>
          )}
        </section>

        {/* Push Notifications Section */}
        {isPushSupported() && (
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Push Notifications</h2>
            <p className={styles.settingDesc} style={{ marginBottom: 'var(--spacing-md)' }}>
              Receive reminders even when the app is closed.
            </p>

            <div className={styles.settingRow}>
              <div className={styles.settingInfo}>
                <span className={styles.settingLabel}>Enable Push</span>
                <span className={styles.settingDesc}>
                  {pushStatus === 'active' ? 'Active' : 'Not subscribed'}
                </span>
              </div>
              <label className={styles.toggle}>
                <input
                  type="checkbox"
                  checked={!!notificationSettings.pushEnabled}
                  onChange={handlePushToggle}
                  disabled={pushStatus === 'loading'}
                />
                <span className={styles.slider} />
              </label>
            </div>

            {notificationSettings.pushEnabled && pushStatus === 'active' && (
              <button
                className="btn-secondary"
                onClick={handleSendTestPush}
                disabled={isSendingTest}
                style={{ width: '100%', marginTop: 'var(--spacing-md)' }}
              >
                {isSendingTest ? 'Sending...' : 'Send Test Notification'}
              </button>
            )}
          </section>
        )}

        {/* Home Settings Section */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Home</h2>
          <div className={styles.settingRow}>
            <div className={styles.settingInfo}>
              <span className={styles.settingLabel}>Missed Days to Show</span>
              <span className={styles.settingDesc}>How many days back to show incomplete entries</span>
            </div>
            <select
              className={styles.selectInput}
              value={missedDaysLimit}
              onChange={(e) => setMissedDaysLimit(Number(e.target.value))}
            >
              <option value={3}>3 days</option>
              <option value={7}>7 days</option>
              <option value={14}>14 days</option>
              <option value={30}>30 days</option>
            </select>
          </div>
        </section>

        {/* Photos Section */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Photos</h2>
          <div className={styles.settingRow}>
            <div className={styles.settingInfo}>
              <span className={styles.settingLabel}>Save to Device</span>
              <span className={styles.settingDesc}>Also save photos to your device's gallery when adding to entries</span>
            </div>
            <div className={styles.settingControls}>
              <label className={styles.toggle}>
                <input
                  type="checkbox"
                  checked={savePhotosToDevice}
                  onChange={(e) => {
                    setSavePhotosToDevice(e.target.checked);
                    // Mark prompt as shown so it doesn't appear on next photo upload
                    setSavePhotosPromptShown(true);
                  }}
                />
                <span className={styles.slider} />
              </label>
            </div>
          </div>
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
                      <img src={user.user_metadata.avatar_url} alt="User avatar" />
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
                      <span className={styles.syncing}>
                        {syncProgress
                          ? `${syncProgress.phase === 'pulling' ? 'Downloading' : 'Uploading'} ${syncProgress.current}/${syncProgress.total}...`
                          : 'Syncing...'}
                      </span>
                    ) : lastSyncTime ? (
                      <span>Last synced {formatDistanceToNow(lastSyncTime, { addSuffix: true })}</span>
                    ) : (
                      <span>Not synced yet</span>
                    )}
                  </div>

                  {isSyncing && syncProgress && (
                    <div className={styles.syncProgressBar}>
                      <div
                        className={styles.syncProgressFill}
                        style={{ width: `${(syncProgress.current / syncProgress.total) * 100}%` }}
                      />
                    </div>
                  )}

                  <button
                    className="btn-secondary"
                    onClick={() => triggerSync()}
                    disabled={isSyncing || !isOnline}
                    style={{ width: '100%', marginTop: 'var(--spacing-md)' }}
                  >
                    {isSyncing
                      ? syncProgress
                        ? `${syncProgress.phase === 'pulling' ? 'Downloading' : 'Uploading'}...`
                        : 'Syncing...'
                      : 'Sync Now'}
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
              disabled={isExporting || isExportingWithPhotos}
            >
              {isExporting ? 'Exporting...' : 'Export Entries (JSON)'}
            </button>
            <button
              className="btn-secondary"
              onClick={handleExportWithPhotos}
              disabled={isExporting || isExportingWithPhotos}
              style={{ marginTop: 'var(--spacing-sm)' }}
            >
              {isExportingWithPhotos ? 'Exporting...' : 'Export with Photos (ZIP)'}
            </button>
          </div>

          <div className={styles.buttonGroup}>
            <label className="btn-secondary" style={{ cursor: 'pointer' }}>
              {isImporting ? 'Importing...' : 'Import from File'}
              <input
                type="file"
                accept=".json,.zip"
                onChange={handleImport}
                style={{ display: 'none' }}
                disabled={isImporting}
              />
            </label>
            <p className={styles.note}>Accepts .json or .zip files</p>
          </div>

          <div className={styles.buttonGroup}>
            <button
              className="btn-secondary"
              onClick={handleLoadSampleData}
              disabled={isLoadingSample}
            >
              {isLoadingSample ? 'Loading...' : 'Load Sample Data (30 entries)'}
            </button>
            <p className={styles.note}>Load rich sample entries for testing</p>
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
