import {getServerSession} from 'next-auth';
import {authOptions} from '@/app/api/auth/[...nextauth]/options';
import Image from 'next/image';
import styles from './index.module.scss';

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
        <section className={styles.loginUser}>
            <article className={styles.details}>
                <p className={styles.name}>{user?.name}</p>
                <p className={styles.email}>{user?.email}</p>
            </article>
            <article className={styles.avatar}>
                {user?.image && (
                    <Image
                        src={user.image}
                        alt="User profile"
                        height={50}
                        width={50}
                    />
                )}
            </article>
        </section>
    );
}