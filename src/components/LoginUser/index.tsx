import {getServerSession} from 'next-auth';
import {authOptions} from '@/app/api/auth/[...nextauth]/options';
import {Avatar, AvatarFallback, AvatarImage, Inline, Surface, Text} from '@lyttle-development/ui';

function getInitials(name?: string | null, email?: string | null) {
    const source = name?.trim() || email?.trim() || 'User';
    const parts = source.split(/\s+/).filter(Boolean);

    return parts.slice(0, 2).map((part) => part[0]?.toUpperCase() ?? '').join('');
}

export async function LoginUser() {
    // Get the session on the server
    const session = await getServerSession(authOptions);

    // If the session is not available, return null
    if (!session) {
        return null;
    }

    // Get the user information from the session
    const {user} = session;
    if (!user) {
        return null;
    }

    return (
        <Surface as="section" padding="sm" radius="xl" shadow="none" tone="secondary">
            <Inline gap="sm" wrap={false}>
                <div style={{display: 'grid', justifyItems: 'end'}}>
                    <Text as="p" size="sm" weight="semibold">{user.name ?? 'Signed in'}</Text>
                    {user.email && <Text as="p" size="xs" tone="muted">{user.email}</Text>}
                </div>
                <Avatar size="default">
                    {user.image && <AvatarImage src={user.image} alt={`${user.name ?? 'User'} profile`}/>}
                    <AvatarFallback>{getInitials(user.name, user.email)}</AvatarFallback>
                </Avatar>
            </Inline>
        </Surface>
    );
}