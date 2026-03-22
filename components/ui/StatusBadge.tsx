import styles from './StatusBadge.module.css'

type StatusState = 'active' | 'locked' | 'comingSoon'

type StatusBadgeProps = {
  state: StatusState
  label?: string
}

const DEFAULT_LABELS: Record<StatusState, string> = {
  active: 'ACTIVE',
  locked: 'LOCKED',
  comingSoon: 'COMING SOON',
}

export default function StatusBadge({ state, label }: StatusBadgeProps) {
  return (
    <span className={`${styles.badge} ${styles[state]}`}>
      <span className={styles.dot} aria-hidden="true" />
      {label || DEFAULT_LABELS[state]}
    </span>
  )
}
