import { Component, JSX, splitProps } from 'solid-js';

export type BadgeVariant = 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info';
export type BadgeSize = 'sm' | 'md';

interface BadgeProps extends JSX.HTMLAttributes<HTMLSpanElement> {
    variant?: BadgeVariant;
    size?: BadgeSize;
    dot?: boolean;
    icon?: JSX.Element;
}

export const Badge: Component<BadgeProps> = (props) => {
    const [local, rest] = splitProps(props, [
        'variant',
        'size',
        'dot',
        'icon',
        'children',
        'class'
    ]);

    const classes = () => {
        const base = 'ui-badge';
        const variant = `ui-badge--${local.variant || 'default'}`;
        const size = `ui-badge--${local.size || 'md'}`;
        const hasDot = local.dot ? 'ui-badge--dot' : '';
        const custom = local.class || '';

        return [base, variant, size, hasDot, custom].filter(Boolean).join(' ');
    };

    return (
        <span class={classes()} {...rest}>
            {local.dot && <span class="ui-badge-dot"></span>}
            {local.icon && <span class="ui-badge-icon">{local.icon}</span>}
            {local.children}
        </span>
    );
};

export default Badge;
