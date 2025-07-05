import {AllowedCommand} from '@/app/api/command/config';

export type AllowedGetCommand = `chroot /host /bin/bash -c "${AllowedCommand}"`;

export function getCommand(command: AllowedCommand): AllowedGetCommand {
    // This will run arbitrary commands on the HOST via chroot.
    // Your container must be run with: --privileged --pid=host -v /:/host
    return [
        'chroot', '/host', '/bin/bash', '-c', `"${command}"`
    ].join(' ') as AllowedGetCommand;
}