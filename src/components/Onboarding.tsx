import { useState } from 'react';
import { useStore } from '../store';
import { PencilIcon, BellIcon, CalendarDaysIcon } from '@heroicons/react/24/outline';
import styles from './Onboarding.module.css';

const steps = [
  {
    title: 'Welcome to Storyworthy',
    body: 'Capture your storyworthy moments and gratitude daily',
    Icon: PencilIcon,
  },
  {
    title: 'Never Miss a Moment',
    body: 'Gentle reminders at 9 AM and 9 PM help you build the habit',
    Icon: BellIcon,
  },
  {
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
        <div className={styles.icon}>
          <step.Icon className={styles.stepIcon} />
        </div>
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
