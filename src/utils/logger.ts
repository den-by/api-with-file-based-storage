export const logger = {
  info: (message: string, ...args: any[]) => {
    console.info(message, ...args);
  },
  debug: (message: string, ...args: any[]) => {
    console.debug(message, ...args);
  },
  error: (message: string, ...args: any[]) => {
    console.error(message, ...args);
  },
  log: (message: string, ...args: any[]) => {
    console.log(message, ...args);
  },
};
