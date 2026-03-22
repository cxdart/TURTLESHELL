import type { ReactNode } from 'react'
import Button from './Button'
import StatusBadge from './StatusBadge'
import styles from './SystemCard.module.css'

type SystemCardProps = {
  icon: ReactNode
  systemLabel: string
  title: string
  description: string
  statusState: 'active' | 'locked' | 'comingSoon'
  statusLabel?: string
  actionLabel: string
  actionVariant?: 'primary' | 'secondary' | 'system'
  href?: string
  disabled?: boolean
  showArrow?: boolean
  className?: string
}

export default function SystemCard({
  icon,
  systemLabel,
  title,
  description,
  statusState,
  statusLabel,
  actionLabel,
  actionVariant = 'system',
  href,
  disabled = false,
  showArrow = false,
  className,
}: SystemCardProps) {
  const cardClasses = [styles.card, className].filter(Boolean).join(' ')
  const actionClasses = [styles.actionButton, disabled ? styles.actionDisabled : ''].filter(Boolean).join(' ')

  return (
    <article className={cardClasses}>
      <div className={styles.topRow}>
        <div className={styles.iconWrap} aria-hidden="true">
          {icon}
        </div>
        <StatusBadge state={statusState} label={statusLabel} />
      </div>

      <div className={styles.content}>
        <p className={styles.systemLabel}>{systemLabel}</p>
        <h3 className={styles.title}>{title}</h3>
        <p className={styles.description}>{description}</p>
      </div>

      <div className={styles.actionWrap}>
        {href && !disabled ? (
          <Button href={href} variant={actionVariant} className={actionClasses}>
            <span>{actionLabel}</span>
            {showArrow ? <span aria-hidden="true">?</span> : null}
          </Button>
        ) : (
          <Button variant={actionVariant} className={actionClasses} disabled>
            <span>{actionLabel}</span>
            {showArrow ? <span aria-hidden="true">?</span> : null}
          </Button>
        )}
      </div>
    </article>
  )
}
