import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from 'react'

type GlassButtonBaseProps = {
  children: ReactNode
  className?: string
  variant?: 'default' | 'danger'
}

type GlassButtonProps =
  | (GlassButtonBaseProps &
      { href?: undefined } &
      ButtonHTMLAttributes<HTMLButtonElement>)
  | (GlassButtonBaseProps &
      { href: string } &
      AnchorHTMLAttributes<HTMLAnchorElement>)

export default function GlassButton(props: GlassButtonProps) {
  const { children, className, variant = 'default' } = props
  const classes = [
    'btn',
    'btn-primary',
    'glass-btn',
    variant === 'danger' ? 'glass-btn-danger' : 'glass-btn-primary',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  if ('href' in props && props.href) {
    const anchorProps = { ...props } as AnchorHTMLAttributes<HTMLAnchorElement> & {
      href?: string
      variant?: 'default' | 'danger'
      className?: string
      children?: ReactNode
    }
    delete anchorProps.href
    delete anchorProps.variant
    delete anchorProps.className
    delete anchorProps.children

    return (
      <a href={props.href} className={classes} {...anchorProps}>
        {children}
      </a>
    )
  }

  const buttonProps = { ...props } as ButtonHTMLAttributes<HTMLButtonElement> & {
    href?: string
    variant?: 'default' | 'danger'
    className?: string
    children?: ReactNode
  }
  delete buttonProps.href
  delete buttonProps.variant
  delete buttonProps.className
  delete buttonProps.children

  return (
    <button type="button" {...buttonProps} className={classes}>
      {children}
    </button>
  )
}
