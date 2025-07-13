export const isEditable = (timestamp: string, limitMinutes = 15): boolean => {
  const createdAt = new Date(timestamp);
  const now = new Date();
  const diff = (now.getTime() - createdAt.getTime()) / 1000 / 60; // minutes
  return diff < limitMinutes;
};
