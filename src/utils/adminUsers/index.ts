export const validateUserId = (userId: string): void => {
  if (!userId) {
    throw new Error('User ID is required');
  }
};

export const buildPaginationQuery = (limit: number = 10, offset: number = 0): string => {
  return `limit=${limit}&offset=${offset}`;
};
