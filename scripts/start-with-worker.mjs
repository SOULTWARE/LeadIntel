import { spawn } from 'node:child_process';
import process from 'node:process';

const packageManagerExecPath = process.env.npm_execpath;
const runnerCommand = packageManagerExecPath
  ? process.execPath
  : process.platform === 'win32'
    ? 'pnpm.cmd'
    : 'pnpm';
const runnerArgsPrefix = packageManagerExecPath ? [packageManagerExecPath, 'run'] : ['run'];

function createChild(label, scriptName) {
  const child = spawn(runnerCommand, [...runnerArgsPrefix, scriptName], {
    env: process.env,
    stdio: 'inherit',
  });

  const exitPromise = new Promise((resolve) => {
    let settled = false;

    const finish = (result) => {
      if (settled) return;
      settled = true;
      resolve({ label, scriptName, ...result });
    };

    child.once('error', (error) => {
      finish({ code: 1, error, signal: null });
    });

    child.once('exit', (code, signal) => {
      finish({ code: code ?? 0, error: null, signal });
    });
  });

  return { child, exitPromise, label, scriptName };
}

function stopChildren(processes, signal) {
  for (const { child } of processes) {
    if (child.exitCode === null && child.signalCode === null) {
      child.kill(signal);
    }
  }
}

async function main() {
  const managedProcesses = [
    createChild('app', 'start:app'),
    createChild('worker', 'worker'),
  ];

  const signalResult = new Promise((resolve) => {
    process.once('SIGINT', () => resolve({ signal: 'SIGINT', type: 'signal' }));
    process.once('SIGTERM', () => resolve({ signal: 'SIGTERM', type: 'signal' }));
  });

  const firstResult = await Promise.race([
    signalResult,
    ...managedProcesses.map(({ exitPromise }) =>
      exitPromise.then((result) => ({ result, type: 'exit' })),
    ),
  ]);

  if (firstResult.type === 'signal') {
    stopChildren(managedProcesses, firstResult.signal);
  } else {
    const { error, label, signal } = firstResult.result;

    if (error) {
      console.error(`[start] failed to launch ${label}: ${error.message}`);
    } else if (signal) {
      console.error(`[start] ${label} exited after receiving ${signal}`);
    } else {
      console.error(`[start] ${label} exited; stopping remaining processes`);
    }

    stopChildren(managedProcesses, 'SIGTERM');
  }

  const results = await Promise.all(
    managedProcesses.map(({ exitPromise }) => exitPromise),
  );

  if (firstResult.type === 'signal') {
    return;
  }

  const failedResult = results.find(({ code, error }) => error || code !== 0);
  process.exitCode = failedResult?.code ?? firstResult.result.code;
}

main().catch((error) => {
  console.error(`[start] ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
});
