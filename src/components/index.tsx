import {
  type ButtonHTMLAttributes,
  type FC,
  type MouseEvent,
  type PropsWithChildren,
} from 'react';
import clsx from 'clsx';

type ButtonProps = {
  /**
   * 类型
   * @property
   */
  type: ButtonHTMLAttributes<HTMLButtonElement>['type'];
  /**
   * 尺寸
   * @property
   */
  size?: 'sm' | 'md' | 'lg';
  /**
   * 是否禁用
   * @property
   */
  disabled?: boolean;
  /**
   * 点击事件
   * @method
   */
  onClick?(event?: MouseEvent): void;
};

/**
 * 按钮组件
 */
const Button: FC<PropsWithChildren<ButtonProps>> = (props) => {
  const className = clsx([
    `button--${props.size}`,
    {
      'button--disabled': props.disabled,
    },
  ]);

  return (
    <button className={className} type="button" onClick={props.onClick}>
      {props.children}
    </button>
  );
};

Button.defaultProps = {
  size: 'md',
  disabled: false,
};

export default Button;
