import { useState } from 'react';
import { useStore } from '../store';
import styles from './Onboarding.module.css';

const steps = [
  {
    title: 'Welcome to Daily Moments',
    body: 'Capture your storyworthy moments and gratitude daily',
    icon: (
      <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M12 20h9" />
        <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
      </svg>
    ),
  },
  {
    title: 'Never Miss a Moment',
    body: 'Gentle reminders at 9 AM and 9 PM help you build the habit',
    icon: (
      <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
      </svg>
    ),
  },
  {
    title: 'Start Your Journey',
    body: 'Your entries are private and stored locally on your device',
    icon: (
      <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
        <path d="M9 16l2 2 4-4" />
      </svg>
    ),
  },
];

interface OnboardingProps {
  onComplete: () => void;
}

export function Onboarding({ onComplete }: OnboardingProps) {
  const [currentStep, setCurrentStep] = useState(0);
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

  const step = steps[currentStep];
  const isLastStep = currentStep === steps.length - 1;

  return (
    <div className={styles.container}>
      <button className={styles.skipBtn} onClick={handleSkip}>
        Skip
      </button>

      <div className={styles.content}>
        <div className={styles.icon}>{step.icon}</div>
        <h1 className={styles.title}>{step.title}</h1>
        <p className={styles.body}>{step.body}</p>
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
          {isLastStep ? 'Create First Entry' : 'Next'}
        </button>
      </div>
    </div>
  );
}
