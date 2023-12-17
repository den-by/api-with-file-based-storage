import retry from "async-retry";

export const retryfy = (fn: any) => async (...args: any[]) => {
  return retry(async () => {
    return await fn(...args);
  });
}
