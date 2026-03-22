'use client'

import type {
  AnchorHTMLAttributes,
  ButtonHTMLAttributes,
  ReactNode,
} from 'react'
import styles from './Button.module.css'

type Variant = 'primary' | 'secondary' | 'system'

type BaseProps = {
  variant?: Variant
  className?: string
  children: ReactNode
}

type AnchorProps = BaseProps & {
  href: string
} & AnchorHTMLAttributes<HTMLAnchorElement>

type NativeButtonProps = BaseProps & {
  href?: undefined
} & ButtonHTMLAttributes<HTMLButtonElement>

type ButtonProps = AnchorProps | NativeButtonProps

function getClassName(variant: Variant, className?: string) {
  return [styles.button, styles[variant], className].filter(Boolean).join(' ')
}

export default function Button(props: ButtonProps) {
  const variant = props.variant ?? 'secondary'
  const classes = getClassName(variant, props.className)

  if ('href' in props && props.href) {
    const { href, className, variant: _variant, children, ...rest } = props
    return (
      <a href={href} className={classes} {...rest}>
        {children}
      </a>
    )
  }

  const { className, variant: _variant, children, type = 'button', ...rest } = props as NativeButtonProps
  return (
    <button type={type} className={classes} {...rest}>
      {children}
    </button>
  )
}
