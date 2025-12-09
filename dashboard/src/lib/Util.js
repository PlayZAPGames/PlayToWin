export const getObjectEntries = (obj) => Object.entries(obj);

export function getStatusByNumber(number, status) {
  const statusEntry = Object.entries(status).find(
    ([key, value]) => value === number
  );
  return statusEntry ? statusEntry[0] : undefined; // Returns the status name or undefined if not found
}
