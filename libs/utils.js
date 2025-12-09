export function random(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function EpochTime(daysToAdd = 0) {
  const now = new Date().getTime();

  // Calculate future time in milliseconds and convert to seconds by dividing by 1000
  const futureEpochTime = Math.floor(
    (now + daysToAdd * 24 * 60 * 60 * 1000) / 1000
  );

  console.log(futureEpochTime);

  return futureEpochTime;
}

export function EpochTimeMidnight(epochInSeconds = 0) {
  const date = epochInSeconds
    ? new Date(epochInSeconds * 1000) // convert to ms
    : new Date();

  date.setUTCHours(0, 0, 0, 0); // normalize to midnight UTC
  return Math.floor(date.getTime() / 1000); // return in seconds
}
