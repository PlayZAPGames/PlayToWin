// Converts UTC date string to "YYYY-MM-DDTHH:MM" (datetime-local format)
export function formatDateTimeLocal(dateStr) {
  if (!dateStr) return null;
  const date = new Date(dateStr);
  const offset = date.getTimezoneOffset();
  const localDate = new Date(date.getTime() - offset * 60 * 1000);
  return localDate.toISOString().slice(0, 16);
}

// Converts local datetime-local string to UTC ISO string
export function toUTCDateTime(localDateTime) {
  if (!localDateTime) return null;
  const localDate = new Date(localDateTime);
  return localDate.toISOString();
}


export function timeAgo(date) {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);

  const intervals = {
    year: 31536000,
    month: 2592000,
    day: 86400,
    hour: 3600,
    minute: 60,
    second: 1
  };

  for (let key in intervals) {
    const interval = Math.floor(seconds / intervals[key]);
    if (interval >= 1) {
      if (key === "second" && interval < 5) return "just now";
      return interval === 1
        ? `${interval} ${key} ago`
        : `${interval} ${key}s ago`;
    }
  }
}
