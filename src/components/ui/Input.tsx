import { Component, JSX, splitProps } from 'solid-js';

export type InputSize = 'sm' | 'md' | 'lg';

interface InputProps extends JSX.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    hint?: string;
    size?: InputSize;
    iconLeft?: JSX.Element;
    iconRight?: JSX.Element;
    fullWidth?: boolean;
}

export const Input: Component<InputProps> = (props) => {
    const [local, rest] = splitProps(props, [
        'label',
        'error',
        'hint',
        'size',
        'iconLeft',
        'iconRight',
        'fullWidth',
        'class'
    ]);

    const wrapperClasses = () => {
        const base = 'ui-input-wrapper';
        const size = `ui-input--${local.size || 'md'}`;
        const hasError = local.error ? 'ui-input--error' : '';
        const fullWidth = local.fullWidth ? 'ui-input--full' : '';
        const hasIconLeft = local.iconLeft ? 'ui-input--icon-left' : '';
        const hasIconRight = local.iconRight ? 'ui-input--icon-right' : '';
        const custom = local.class || '';

        return [base, size, hasError, fullWidth, hasIconLeft, hasIconRight, custom].filter(Boolean).join(' ');
    };

    return (
        <div class={wrapperClasses()}>
            {local.label && <label class="ui-input-label">{local.label}</label>}
            <div class="ui-input-container">
                {local.iconLeft && <span class="ui-input-icon ui-input-icon--left">{local.iconLeft}</span>}
                <input class="ui-input" {...rest} />
                {local.iconRight && <span class="ui-input-icon ui-input-icon--right">{local.iconRight}</span>}
            </div>
            {local.error && <span class="ui-input-error">{local.error}</span>}
            {local.hint && !local.error && <span class="ui-input-hint">{local.hint}</span>}
        </div>
    );
};

export default Input;
