export type AllowedCommand = (typeof allowedCommands)[number];
export type AllowedCommands = AllowedCommand[];

export const allowedCommands = [
    'cat /etc/os-release', // Get OS release information
    'cat /etc/hostname', // Get the hostname of the host system
    'cat /proc/cpuinfo', // Get CPU information
    'df -h', // Get disk space usage
    'docker ps', // List running Docker containers
    'docker ps --format "{{.Names}}"', // List names of running Docker containers
    'free -h', // Get memory usage
    'reboot', // Reboot the host system
    'uptime', // Get system uptime
    'ip addr', // Get network interfaces and addresses
    'ip link', // Get network interfaces
    'ufw status', // Get UFW firewall status
    'ufw status verbose', // Get detailed UFW firewall status
] as const;