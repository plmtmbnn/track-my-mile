/**
 * Calculates pace in minutes per kilometer.
 * pace = 60 / speed_kmh
 */
export const calculatePace = (speedKmh: number): string => {
  if (speedKmh <= 0) {
    return '--:--';
  }

  const paceDecimal = 60 / speedKmh;
  const minutes = Math.floor(paceDecimal);
  const seconds = Math.round((paceDecimal - minutes) * 60);

  const formattedMinutes = minutes.toString().padStart(2, '0');
  const formattedSeconds = seconds.toString().padStart(2, '0');

  return `${formattedMinutes}:${formattedSeconds}`;
};

/**
 * Formats a date to YYYYMMDD_HHMMSS for filenames.
 */
export const formatFilenameTimestamp = (date: Date): string => {
  return date.toISOString()
    .replace(/[-T:]/g, '')
    .split('.')[0];
};
