const exitHandlers: any[] = [];

export function addExitHandler(callback: any) {
  exitHandlers.push(callback);
}

function handleExit(options: any, exitCode: any) {
  if (options.cleanup) {
    console.log('Cleaning up...');
    exitHandlers.forEach((handler) => {
      try {
        handler();
      } catch (error) {
        console.error(error);
      }
    });
  }
  if (exitCode || exitCode === 0) console.log(exitCode);
  if (options.exit) process.exit();
}
// Attach handlers for the different ways a Node process could terminate
process.on('exit', handleExit.bind(null, {cleanup: true}));
process.on('SIGINT', handleExit.bind(null, {exit: true}));  // Ctrl+C
process.on('SIGUSR1', handleExit.bind(null, {exit: true})); // "kill pid" (POSIX)
process.on('SIGUSR2', handleExit.bind(null, {exit: true})); // "kill pid" (POSIX)
process.on('uncaughtException', handleExit.bind(null, {exit: true}));
