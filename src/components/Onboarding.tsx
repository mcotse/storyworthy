import { useState } from 'react';
import { useStore } from '../store';
import { PencilIcon, BellIcon, CalendarDaysIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { requestNotificationPermission, getNotificationPermission } from '../services/notifications';
import styles from './Onboarding.module.css';

type StepType = 'intro' | 'notifications' | 'final';

interface Step {
  id: StepType;
  title: string;
  body: string;
  Icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
}

const steps: Step[] = [
  {
    id: 'intro',
    title: 'Welcome to Storyworthy',
    body: 'Capture your storyworthy moments and gratitude daily',
    Icon: PencilIcon,
  },
  {
    id: 'notifications',
    title: 'Stay on Track',
    body: 'Get gentle reminders to write your daily entries',
    Icon: BellIcon,
  },
  {
    id: 'final',
    title: 'Start Your Journey',
    body: 'Your entries are private and stored locally on your device',
    Icon: CalendarDaysIcon,
  },
];

interface OnboardingProps {
  onComplete: () => void;
}

export function Onboarding({ onComplete }: OnboardingProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [notificationStatus, setNotificationStatus] = useState<'pending' | 'granted' | 'denied' | 'unsupported'>('pending');
  const setOnboardingComplete = useStore((state) => state.setOnboardingComplete);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      setOnboardingComplete(true);
      onComplete();
    }
  };

  const handleSkip = () => {
    setOnboardingComplete(true);
    onComplete();
  };

  const handleEnableNotifications = async () => {
    const permission = getNotificationPermission();
    if (permission === 'unsupported') {
      setNotificationStatus('unsupported');
      return;
    }

    const granted = await requestNotificationPermission();
    setNotificationStatus(granted ? 'granted' : 'denied');
  };

  const step = steps[currentStep];
  const isLastStep = currentStep === steps.length - 1;
  const isNotificationStep = step.id === 'notifications';

  // Check if already granted when entering notification step
  const currentPermission = getNotificationPermission();
  const showEnableButton = isNotificationStep && notificationStatus === 'pending' && currentPermission !== 'granted';
  const showGrantedMessage = isNotificationStep && (notificationStatus === 'granted' || currentPermission === 'granted');
  const showDeniedMessage = isNotificationStep && notificationStatus === 'denied';
  const showUnsupportedMessage = isNotificationStep && (notificationStatus === 'unsupported' || currentPermission === 'unsupported');

  return (
    <div className={styles.container}>
      <button className={styles.skipBtn} onClick={handleSkip}>
        Skip
      </button>

      <div className={styles.content}>
        <div className={styles.icon}>
          {showGrantedMessage ? (
            <CheckCircleIcon className={styles.stepIcon} style={{ color: 'var(--color-success, #22c55e)' }} />
          ) : (
            <step.Icon className={styles.stepIcon} />
          )}
        </div>
        <h1 className={styles.title}>
          {showGrantedMessage ? 'Notifications Enabled!' : step.title}
        </h1>
        <p className={styles.body}>
          {showGrantedMessage
            ? "You'll receive reminders at 9 AM and 9 PM"
            : showDeniedMessage
            ? 'You can enable notifications later in Settings'
            : showUnsupportedMessage
            ? 'Notifications are not supported on this device'
            : step.body}
        </p>

        {showEnableButton && (
          <button
            className={`btn-primary ${styles.enableBtn}`}
            onClick={handleEnableNotifications}
          >
            Enable Notifications
          </button>
        )}
      </div>

      <div className={styles.footer}>
        <div className={styles.dots}>
          {steps.map((_, index) => (
            <span
              key={index}
              className={`${styles.dot} ${index === currentStep ? styles.active : ''}`}
            />
          ))}
        </div>

        <button className="btn-primary" onClick={handleNext}>
          {isLastStep ? 'Create First Entry' : isNotificationStep && showEnableButton ? 'Skip' : 'Next'}
        </button>
      </div>
    </div>
  );
}
