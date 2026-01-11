import { useState, useMemo } from 'react';
import { useStore } from '../store';
import { EntryForm } from '../components/EntryForm';
import { PhotoModal } from '../components/PhotoModal';
import {
  getCalendarDays,
  formatMonthYear,
  getNextMonth,
  getPrevMonth,
  dateToString,
  isFutureDate,
  isTodayDate,
} from '../utils/date';
import { format } from 'date-fns';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import styles from './Calendar.module.css';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function Calendar() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  const entries = useStore((state) => state.entries);

  const entryDates = useMemo(() => {
    return new Set(entries.map((e) => e.date));
  }, [entries]);

  const calendarDays = useMemo(() => {
    return getCalendarDays(year, month);
  }, [year, month]);

  const handlePrevMonth = () => {
    const prev = getPrevMonth(year, month);
    setYear(prev.year);
    setMonth(prev.month);
  };

  const handleNextMonth = () => {
    const next = getNextMonth(year, month);
    setYear(next.year);
    setMonth(next.month);
  };

  const handleDateClick = (date: Date, isCurrentMonth: boolean) => {
    if (!isCurrentMonth) return;
    const dateStr = dateToString(date);
    if (isFutureDate(dateStr)) return;

    setSelectedDate(dateStr);
    setShowForm(true);
  };

  const selectedEntry = selectedDate ? entries.find((e) => e.date === selectedDate) : null;

  if (showForm && selectedDate) {
    return (
      <EntryForm
        date={selectedDate}
        isEdit={!!selectedEntry}
        onClose={() => {
          setShowForm(false);
          setSelectedDate(null);
        }}
      />
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.navigation}>
        <button className={styles.navBtn} onClick={handlePrevMonth} aria-label="Previous month">
          <ChevronLeftIcon className={styles.navIcon} />
        </button>
        <h2 className={styles.monthYear}>{formatMonthYear(year, month)}</h2>
        <button className={styles.navBtn} onClick={handleNextMonth} aria-label="Next month">
          <ChevronRightIcon className={styles.navIcon} />
        </button>
      </div>

      <div className={styles.weekdays}>
        {WEEKDAYS.map((day) => (
          <div key={day} className={styles.weekday}>
            {day}
          </div>
        ))}
      </div>

      <div className={styles.grid}>
        {calendarDays.map(({ date, isCurrentMonth }, index) => {
          const dateStr = dateToString(date);
          const hasEntry = entryDates.has(dateStr);
          const isToday = isTodayDate(dateStr);
          const isFuture = isFutureDate(dateStr);

          return (
            <button
              key={index}
              className={`${styles.day} ${!isCurrentMonth ? styles.otherMonth : ''} ${isToday ? styles.today : ''} ${isFuture ? styles.future : ''}`}
              onClick={() => handleDateClick(date, isCurrentMonth)}
              disabled={!isCurrentMonth || isFuture}
            >
              <span className={styles.dayNumber}>{format(date, 'd')}</span>
              {hasEntry && isCurrentMonth && <span className={styles.dot} />}
            </button>
          );
        })}
      </div>

      {entries.length === 0 && (
        <div className={styles.empty}>
          <p>No entries yet. Tap a date to create one!</p>
        </div>
      )}

      {selectedPhoto && (
        <PhotoModal photo={selectedPhoto} onClose={() => setSelectedPhoto(null)} />
      )}
    </div>
  );
}
