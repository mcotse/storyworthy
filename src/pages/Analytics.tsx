import { useMemo } from 'react';
import { useStore } from '../store';
import { calculateStreak, getTimeOfDay } from '../utils/date';
import { ChartBarIcon } from '@heroicons/react/24/outline';
import styles from './Analytics.module.css';

export function Analytics() {
  const entries = useStore((state) => state.entries);

  const stats = useMemo(() => {
    if (entries.length === 0) {
      return null;
    }

    const dates = entries.map((e) => e.date);
    const { current: currentStreak, longest: longestStreak } = calculateStreak(dates);

    // Time of day analysis
    const timeOfDayCounts = { morning: 0, afternoon: 0, evening: 0, night: 0 };
    entries.forEach((entry) => {
      const timeOfDay = getTimeOfDay(entry.createdAt);
      timeOfDayCounts[timeOfDay]++;
    });

    const totalEntries = entries.length;
    const maxTimeOfDay = Object.entries(timeOfDayCounts).reduce(
      (max, [key, val]) => (val > max.count ? { key, count: val } : max),
      { key: 'morning', count: 0 }
    );

    // Word frequency analysis
    const wordCounts: Record<string, number> = {};
    const stopWords = new Set([
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
      'of', 'with', 'by', 'from', 'is', 'was', 'are', 'were', 'be', 'been',
      'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
      'should', 'may', 'might', 'must', 'i', 'me', 'my', 'we', 'our', 'you',
      'your', 'he', 'she', 'it', 'they', 'them', 'their', 'this', 'that',
      'these', 'those', 'what', 'which', 'who', 'whom', 'whose', 'when',
      'where', 'why', 'how', 'all', 'each', 'every', 'both', 'few', 'more',
      'most', 'some', 'any', 'no', 'not', 'only', 'own', 'same', 'so', 'than',
      'too', 'very', 'just', 'about', 'today', 'im', "i'm", 'also', 'really',
    ]);

    entries.forEach((entry) => {
      const text = `${entry.storyworthy} ${entry.thankful}`.toLowerCase();
      const words = text.match(/\b[a-z]{3,}\b/g) || [];
      words.forEach((word) => {
        if (!stopWords.has(word)) {
          wordCounts[word] = (wordCounts[word] || 0) + 1;
        }
      });
    });

    const topWords = Object.entries(wordCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 30);

    const maxWordCount = topWords[0]?.[1] || 1;

    return {
      currentStreak,
      longestStreak,
      totalEntries,
      timeOfDayCounts,
      maxTimeOfDay: maxTimeOfDay.key as 'morning' | 'afternoon' | 'evening' | 'night',
      topWords,
      maxWordCount,
    };
  }, [entries]);

  if (!stats || entries.length < 3) {
    return (
      <div className={styles.container}>
        <div className={styles.empty}>
          <div className={styles.emptyIcon}>
            <ChartBarIcon className={styles.emptyIconSvg} />
          </div>
          <h2>Not enough data yet</h2>
          <p>Create at least 3 entries to see insights</p>
          <div className={styles.progress}>
            <div
              className={styles.progressBar}
              style={{ width: `${(entries.length / 3) * 100}%` }}
            />
          </div>
          <p className={styles.progressText}>{entries.length}/3 entries</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <main className={styles.main}>
        {/* Streak Section */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Streaks</h2>
          <div className={styles.streakCards}>
            <div className={styles.streakCard}>
              <span className={styles.streakNumber}>{stats.currentStreak}</span>
              <span className={styles.streakLabel}>Current Streak</span>
            </div>
            <div className={styles.streakCard}>
              <span className={styles.streakNumber}>{stats.longestStreak}</span>
              <span className={styles.streakLabel}>Longest Streak</span>
            </div>
            <div className={styles.streakCard}>
              <span className={styles.streakNumber}>{stats.totalEntries}</span>
              <span className={styles.streakLabel}>Total Entries</span>
            </div>
          </div>
          {stats.currentStreak > 0 && (
            <p className={styles.encouragement}>
              Keep it going! You're on a {stats.currentStreak}-day streak!
            </p>
          )}
          {stats.currentStreak === 0 && (
            <p className={styles.encouragement}>
              Start a new streak today!
            </p>
          )}
        </section>

        {/* Time of Day Section */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>When You Journal</h2>
          <div className={styles.timeChart}>
            {(['morning', 'afternoon', 'evening', 'night'] as const).map((time) => {
              const count = stats.timeOfDayCounts[time];
              const percentage = (count / stats.totalEntries) * 100;
              return (
                <div key={time} className={styles.timeBar}>
                  <span className={styles.timeLabel}>{time}</span>
                  <div className={styles.barContainer}>
                    <div
                      className={styles.bar}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <span className={styles.timeCount}>{count}</span>
                </div>
              );
            })}
          </div>
          <p className={styles.insight}>
            You journal most in the <strong>{stats.maxTimeOfDay}</strong>
          </p>
        </section>

        {/* Word Cloud Section */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Your Words</h2>
          <div className={styles.wordCloud}>
            {stats.topWords.map(([word, count]) => {
              const size = 0.75 + (count / stats.maxWordCount) * 1;
              return (
                <span
                  key={word}
                  className={styles.word}
                  style={{ fontSize: `${size}rem` }}
                >
                  {word}
                </span>
              );
            })}
          </div>
        </section>
      </main>
    </div>
  );
}
