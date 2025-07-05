import {NextResponse} from 'next/server';
import {execAsync} from '@/app/api/command/execAsync';
import {AllowedCommand, allowedCommands} from '@/app/api/command/config';
import {getCommand} from '@/app/api/command/getCommand';

export async function GET(
    request: Request,
): Promise<NextResponse> {
    const url = request.url;
    const urlObj = new URL(url);
    const command: AllowedCommand = urlObj.searchParams.get('command') as AllowedCommand;

    if (!command) {
        return NextResponse.json({error: 'No command provided.'}, {status: 400});
    }

    if (!allowedCommands.includes(command)) {
        return NextResponse.json({error: 'Command not allowed.'}, {status: 403});
    }

    try {
        const output = await execAsync(getCommand(command));
        return NextResponse.json({output: output || 'Host is rebooting.'});
    } catch (err) {
        return NextResponse.json({error: String(err)});
    }
}
