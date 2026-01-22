import { useState, useEffect } from 'react';
import { formatDate } from '../lib/utils'; // Import your function

export default function LocalDateTime({ dateString }: { dateString: string }) {
  // 1. Start with an empty string (so we don't show the wrong time first)
  const [date, setDate] = useState<string>('');

  // 2. This runs ONLY after the component mounts in the browser
  useEffect(() => {
    setDate(formatDate(dateString));
  }, [dateString]);

  // 3. While loading, show nothing (or a skeleton). Then show the date.
  if (!date) {
    return <span>Loading...</span>; // Optional: or just return null
  }

  return <span>{date}</span>;
}
