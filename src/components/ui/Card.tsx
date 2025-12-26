import { Component, JSX, splitProps, Show } from 'solid-js';

interface CardProps extends JSX.HTMLAttributes<HTMLDivElement> {
    variant?: 'default' | 'outlined' | 'elevated';
    padding?: 'none' | 'sm' | 'md' | 'lg';
    header?: JSX.Element;
    footer?: JSX.Element;
}

export const Card: Component<CardProps> = (props) => {
    const [local, rest] = splitProps(props, [
        'variant',
        'padding',
        'header',
        'footer',
        'children',
        'class'
    ]);

    const classes = () => {
        const base = 'ui-card';
        const variant = `ui-card--${local.variant || 'default'}`;
        const padding = `ui-card--p-${local.padding || 'md'}`;
        const custom = local.class || '';

        return [base, variant, padding, custom].filter(Boolean).join(' ');
    };

    return (
        <div class={classes()} {...rest}>
            <Show when={local.header}>
                <div class="ui-card-header">{local.header}</div>
            </Show>
            <div class="ui-card-body">{local.children}</div>
            <Show when={local.footer}>
                <div class="ui-card-footer">{local.footer}</div>
            </Show>
        </div>
    );
};

export default Card;
