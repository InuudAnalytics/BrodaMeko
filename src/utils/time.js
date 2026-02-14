export const getWATGreeting = () => {
  const utcHour = new Date().getUTCHours();
  const watHour = (utcHour + 1) % 24;

  if (watHour < 12) {
    return 'Good morning';
  }

  if (watHour < 17) {
    return 'Good afternoon';
  }

  return 'Good evening';
};

