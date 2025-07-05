import {exec} from 'child_process';
import {AllowedGetCommand} from '@/app/api/command/getCommand';

/**
 * Executes a shell command and returns a Promise with stdout.
 * Logs every step for debugging and auditing.
 * Rejects with stderr or error message on failure.
 * @param command The command to execute
 */
export async function execAsync(command: AllowedGetCommand): Promise<string> {
    console.log(`[execAsync] Invoked with command: "${command}"`);

    return new Promise((resolve, reject) => {
        console.log(`[execAsync] Executing command...`);
        const startTime = Date.now();

        exec(command, (error, stdout, stderr) => {
            const duration = Date.now() - startTime;
            console.log(`[execAsync] Command completed in ${duration}ms`);

            if (stdout) {
                console.log(`[execAsync] STDOUT:\n${stdout}`);
            }
            if (stderr) {
                console.warn(`[execAsync] STDERR:\n${stderr}`);
            }

            if (error) {
                console.error(`[execAsync] Execution error: ${error.message}`);
                reject(stderr || error.message);
            } else {
                console.log(`[execAsync] Command executed successfully.`);
                resolve(stdout);
            }
        });
    });
}