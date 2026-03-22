import type { ReactNode } from 'react'

type PageHeaderVariant = 'hero' | 'compact'

type PageHeaderProps = {
  variant: PageHeaderVariant
  title: ReactNode
  description?: ReactNode
  badge?: ReactNode
  backHref?: string
  backLabel?: ReactNode
  className?: string
}

export default function PageHeader({
  variant,
  title,
  description,
  badge,
  backHref,
  backLabel,
  className,
}: PageHeaderProps) {
  const classes = ['systems-header', 'page-header', `page-header--${variant}`]
  if (className) classes.push(className)

  return (
    <div className={classes.join(' ')}>
      {backHref && backLabel ? (
        <a href={backHref} className="systems-back page-header-back">
          {backLabel}
        </a>
      ) : null}

      {badge ? <div className="section-label page-header-badge">{badge}</div> : null}

      <h1 className="systems-title page-header-title">{title}</h1>

      {description ? <p className="systems-subtitle page-header-description">{description}</p> : null}
    </div>
  )
}
