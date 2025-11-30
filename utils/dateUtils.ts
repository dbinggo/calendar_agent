export const formatDateKey = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

export const getDaysInMonth = (year: number, month: number): (Date | null)[] => {
  const date = new Date(year, month, 1);
  const days: (Date | null)[] = [];
  
  // Fill empty days for offset
  for (let i = 0; i < date.getDay(); i++) {
    days.push(null);
  }
  
  while (date.getMonth() === month) {
    days.push(new Date(date));
    date.setDate(date.getDate() + 1);
  }
  
  return days;
};

export const isSameDay = (d1: Date, d2: Date): boolean => {
    return d1.getFullYear() === d2.getFullYear() &&
           d1.getMonth() === d2.getMonth() &&
           d1.getDate() === d2.getDate();
};

export const getMonthName = (monthIndex: number): string => {
    return new Date(2000, monthIndex, 1).toLocaleString('default', { month: 'long' });
};
