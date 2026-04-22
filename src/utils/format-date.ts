import dayjs from 'dayjs';

export const formatDateToBr = (date: string | undefined): string => {
  if (!date) return '';

  const parsedDate = dayjs(date).format('DD/MM/YYYY');

  return parsedDate;
};
