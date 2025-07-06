import {FontAwesomeIconProps,} from '@fortawesome/react-fontawesome';
import {Icon} from '@/components/Icon';
import {
    faApple,
    faCentos,
    faDebian,
    faFedora,
    faLinux,
    faSuse,
    faUbuntu,
    faWindows
} from '@fortawesome/free-brands-svg-icons';
import {faQuestion} from '@fortawesome/free-solid-svg-icons';

export interface LinkProps extends Omit<FontAwesomeIconProps, 'icon'> {
    os?: string;
    children?: React.ReactNode;
    childrenClassName?: string;
    childrenGroupClassName?: string;
}

export function OsIcon({
                           os,
                           ...rest
                       }: LinkProps) {
    switch (os?.toLowerCase() || '') {
        case 'linux':
            return <Icon icon={faLinux} {...rest} />; // Placeholder for Linux icon
        case 'windows':
            return <Icon icon={faWindows} {...rest} />; // Placeholder for Windows icon
        case 'macos':
            return <Icon icon={faApple} {...rest} />; // Placeholder for macOS icon
        case 'ubuntu':
            return <Icon icon={faUbuntu} {...rest} />; // Placeholder for Ubuntu icon
        case 'debian':
            return <Icon icon={faDebian} {...rest} />; // Placeholder for Debian icon
        case 'centos':
            return <Icon icon={faCentos} {...rest} />; // Placeholder for CentOS icon
        case 'fedora':
            return <Icon icon={faFedora} {...rest} />; // Placeholder for Fedora icon
        case 'suse':
            return <Icon icon={faSuse} {...rest} />; // Placeholder for SUSE icon
        default:
            return <Icon icon={faQuestion}/>;
    }
}
