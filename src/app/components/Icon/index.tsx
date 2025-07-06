import {
  FontAwesomeIcon,
  FontAwesomeIconProps,
} from '@fortawesome/react-fontawesome';
import classNames from 'classnames';

import styles from './index.module.scss';

export interface LinkProps extends FontAwesomeIconProps {
    children?: React.ReactNode;
    childrenClassName?: string;
    childrenGroupClassName?: string;
}

export function Icon({
                         children,
                         childrenClassName,
                         childrenGroupClassName,
                         ...rest
                     }: LinkProps) {
    if (children) {
        return (
            <span
                className={classNames(styles.icon_group, childrenGroupClassName)}>
        <FontAwesomeIcon {...rest} />
        <span className={classNames(childrenClassName)}>{children}</span>
      </span>
        );
    }

    return <FontAwesomeIcon {...rest} />;
}
