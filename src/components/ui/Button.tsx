import { Component, JSX, splitProps } from 'solid-js';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends JSX.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: ButtonVariant;
    size?: ButtonSize;
    loading?: boolean;
    icon?: JSX.Element;
    fullWidth?: boolean;
}

export const Button: Component<ButtonProps> = (props) => {
    const [local, rest] = splitProps(props, [
        'variant',
        'size',
        'loading',
        'icon',
        'fullWidth',
        'children',
        'class',
        'disabled'
    ]);

    const classes = () => {
        const base = 'ui-btn';
        const variant = `ui-btn--${local.variant || 'primary'}`;
        const size = `ui-btn--${local.size || 'md'}`;
        const fullWidth = local.fullWidth ? 'ui-btn--full' : '';
        const loading = local.loading ? 'ui-btn--loading' : '';
        const custom = local.class || '';

        return [base, variant, size, fullWidth, loading, custom].filter(Boolean).join(' ');
    };

    return (
        <button
            class={classes()}
            disabled={local.disabled || local.loading}
            {...rest}
        >
            {local.loading && <i class="ci-Loading ui-btn-spinner"></i>}
            {!local.loading && local.icon && <span class="ui-btn-icon">{local.icon}</span>}
            {local.children && <span class="ui-btn-text">{local.children}</span>}
        </button>
    );
};

export default Button;
