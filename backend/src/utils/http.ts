export const ok = <T>(message: string, data?: T) => ({
  success: true,
  message,
  ...(data ? { data } : {})
});

export const fail = (message: string) => ({
  success: false,
  message
});
