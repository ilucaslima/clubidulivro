export const formatDate = (date: Date) => {
  return date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

export const formatTooltipDate = (date: Date) => {
  return date
    .toLocaleDateString("pt-BR", {
      day: "numeric",
      month: "short",
    })
    .replace(".", "");
};

export const createDateFromDays = (startDate: Date, dayNumber: number) => {
  const currentDate = new Date(startDate);
  currentDate.setDate(startDate.getDate() + dayNumber);
  return currentDate;
};

export const calculateDaysBetween = (startDate: Date, endDate: Date) => {
  return (
    Math.ceil(
      (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
    ) + 1
  );
};

export const createLocalDateString = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};
