export const getLevelClass = (level: number) => {
  switch (level) {
    case 1:
      return "bg-green-900";
    case 2:
      return "bg-green-700";
    case 3:
      return "bg-green-500";
    case 4:
      return "bg-green-400";
    default:
      return "bg-gray-800";
  }
};

export const calculateIntensity = (
  pagesRead: number,
  dailyGoal: number
): number => {
  if (pagesRead === 0) return 0;
  const ratio = pagesRead / dailyGoal;

  if (ratio >= 1.5) return 4;
  if (ratio >= 1.0) return 3;
  if (ratio >= 0.5) return 2;
  return 1;
};

export const getMonthPositions = (startDate: Date, weeksToShow: number) => {
  const positions: { month: string; position: number }[] = [];
  let lastMonth = -1;

  for (let week = 0; week < weeksToShow; week++) {
    const weekDate = new Date(startDate);
    weekDate.setDate(startDate.getDate() + week * 7);

    const currentMonth = weekDate.getMonth();

    if (currentMonth !== lastMonth) {
      const monthName = weekDate
        .toLocaleDateString("pt-BR", { month: "short" })
        .replace(".", "");

      positions.push({ month: monthName, position: week });
      lastMonth = currentMonth;
    }
  }

  return positions;
};
