'use client'

import type {
  AnchorHTMLAttributes,
  ButtonHTMLAttributes,
  PointerEvent,
  ReactNode,
} from 'react'
import { useEffect, useRef } from 'react'
import styles from './LightButton.module.css'

type LightButtonBaseProps = {
  children: ReactNode
  className?: string
  variant?: 'primary' | 'secondary' | 'hollow'
}

type LightButtonProps =
  | (LightButtonBaseProps &
      { href?: undefined } &
      ButtonHTMLAttributes<HTMLButtonElement>)
  | (LightButtonBaseProps &
      { href: string } &
      AnchorHTMLAttributes<HTMLAnchorElement>)

type Point = { x: number; y: number }
type SharedPropKeys =
  | 'variant'
  | 'className'
  | 'children'
  | 'onPointerEnter'
  | 'onPointerMove'
  | 'onPointerLeave'
  | 'onPointerDown'
  | 'onPointerUp'
  | 'onPointerCancel'

const REST_GLOW = '0.3'
const ACTIVE_GLOW = '0.95'
const PRESS_GLOW = '1.2'

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

function stripSharedProps<T extends Record<string, unknown>>(input: T): Omit<T, SharedPropKeys> {
  const clone = { ...input } as T & Partial<Record<SharedPropKeys, unknown>>
  delete clone.variant
  delete clone.className
  delete clone.children
  delete clone.onPointerEnter
  delete clone.onPointerMove
  delete clone.onPointerLeave
  delete clone.onPointerDown
  delete clone.onPointerUp
  delete clone.onPointerCancel
  return clone as Omit<T, SharedPropKeys>
}

export default function LightButton(props: LightButtonProps) {
  const variant = props.variant ?? 'hollow'
  const className = props.className
  const children = props.children

  const onPointerMove = (props as { onPointerMove?: (event: PointerEvent<HTMLElement>) => void }).onPointerMove
  const onPointerEnter = (props as { onPointerEnter?: (event: PointerEvent<HTMLElement>) => void }).onPointerEnter
  const onPointerLeave = (props as { onPointerLeave?: (event: PointerEvent<HTMLElement>) => void }).onPointerLeave
  const onPointerDown = (props as { onPointerDown?: (event: PointerEvent<HTMLElement>) => void }).onPointerDown
  const onPointerUp = (props as { onPointerUp?: (event: PointerEvent<HTMLElement>) => void }).onPointerUp
  const onPointerCancel = (props as { onPointerCancel?: (event: PointerEvent<HTMLElement>) => void }).onPointerCancel

  const disabled =
    'disabled' in props &&
    typeof (props as { disabled?: boolean }).disabled !== 'undefined' &&
    Boolean((props as { disabled?: boolean }).disabled)

  const ref = useRef<HTMLElement>(null)
  const pendingPointRef = useRef<Point | null>(null)
  const frameRef = useRef<number | null>(null)
  const reducedMotionRef = useRef(false)
  const useSweepFallbackRef = useRef(false)

  const commitPoint = () => {
    frameRef.current = null
    const el = ref.current
    const point = pendingPointRef.current
    if (!el || !point) return

    el.style.setProperty('--mx', `${point.x}%`)
    el.style.setProperty('--my', `${point.y}%`)
  }

  const queuePoint = (x: number, y: number) => {
    pendingPointRef.current = {
      x: clamp(x, 0, 100),
      y: clamp(y, 0, 100),
    }

    if (reducedMotionRef.current) {
      commitPoint()
      return
    }

    if (frameRef.current !== null) return
    frameRef.current = window.requestAnimationFrame(commitPoint)
  }

  const pointFromEvent = (event: PointerEvent<HTMLElement>): Point | null => {
    const el = ref.current
    if (!el) return null

    const rect = el.getBoundingClientRect()
    if (!rect.width || !rect.height) return null

    const x = ((event.clientX - rect.left) / rect.width) * 100
    const y = ((event.clientY - rect.top) / rect.height) * 100
    return { x, y }
  }

  const setGlow = (value: string) => {
    const el = ref.current
    if (!el) return
    el.style.setProperty('--glow', value)
  }

  const setActive = (active: boolean) => {
    const el = ref.current
    if (!el) return
    el.setAttribute('data-active', active ? 'true' : 'false')
  }

  const setPressed = (pressed: boolean) => {
    const el = ref.current
    if (!el) return
    el.setAttribute('data-pressed', pressed ? 'true' : 'false')
  }

  useEffect(() => {
    const el = ref.current
    if (!el) return

    el.style.setProperty('--mx', '50%')
    el.style.setProperty('--my', '50%')
    el.style.setProperty('--glow', REST_GLOW)
    el.setAttribute('data-active', 'false')
    el.setAttribute('data-pressed', 'false')
  }, [])

  useEffect(() => {
    const pointerMoveSupported = 'onpointermove' in window
    useSweepFallbackRef.current = !pointerMoveSupported

    const el = ref.current
    if (el) {
      el.setAttribute('data-sweep', useSweepFallbackRef.current ? 'true' : 'false')
    }

    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    const updateReducedMotion = () => {
      reducedMotionRef.current = media.matches
    }

    updateReducedMotion()

    if (media.addEventListener) {
      media.addEventListener('change', updateReducedMotion)
      return () => media.removeEventListener('change', updateReducedMotion)
    }

    media.addListener(updateReducedMotion)
    return () => media.removeListener(updateReducedMotion)
  }, [])

  useEffect(
    () => () => {
      if (frameRef.current !== null) {
        window.cancelAnimationFrame(frameRef.current)
      }
    },
    []
  )

  const handlePointerEnter = (event: PointerEvent<HTMLElement>) => {
    if (!disabled) {
      setActive(true)
      setGlow(ACTIVE_GLOW)
      const point = pointFromEvent(event)
      if (point) queuePoint(point.x, point.y)
    }
    onPointerEnter?.(event)
  }

  const handlePointerMove = (event: PointerEvent<HTMLElement>) => {
    if (!disabled && !useSweepFallbackRef.current) {
      const point = pointFromEvent(event)
      if (point) queuePoint(point.x, point.y)
      setGlow(ACTIVE_GLOW)
    }
    onPointerMove?.(event)
  }

  const handlePointerLeave = (event: PointerEvent<HTMLElement>) => {
    if (!disabled) {
      setActive(false)
      setPressed(false)
      queuePoint(50, 50)
      setGlow(REST_GLOW)
    }
    onPointerLeave?.(event)
  }

  const handlePointerDown = (event: PointerEvent<HTMLElement>) => {
    if (!disabled) {
      setPressed(true)
      setActive(true)
      const point = pointFromEvent(event)
      if (point) queuePoint(point.x, point.y)
      setGlow(PRESS_GLOW)
    }
    onPointerDown?.(event)
  }

  const handlePointerUp = (event: PointerEvent<HTMLElement>) => {
    if (!disabled) {
      setPressed(false)
      setGlow(ACTIVE_GLOW)
    }
    onPointerUp?.(event)
  }

  const handlePointerCancel = (event: PointerEvent<HTMLElement>) => {
    if (!disabled) {
      setPressed(false)
      setActive(false)
      queuePoint(50, 50)
      setGlow(REST_GLOW)
    }
    onPointerCancel?.(event)
  }

  const classes = [styles.lightButton, styles[variant], className].filter(Boolean).join(' ')
  const setElementRef = (node: HTMLElement | null) => {
    ref.current = node
  }
  const setAnchorRef = (node: HTMLAnchorElement | null) => {
    setElementRef(node)
  }
  const setButtonRef = (node: HTMLButtonElement | null) => {
    setElementRef(node)
  }

  if ('href' in props && props.href) {
    const anchorRawProps = stripSharedProps(
      props as unknown as Record<string, unknown> & {
        href: string
        variant?: 'primary' | 'secondary' | 'hollow'
        className?: string
        children?: ReactNode
      }
    )
    const { href, ...anchorProps } = anchorRawProps as unknown as {
      href: string
    } & AnchorHTMLAttributes<HTMLAnchorElement>

    return (
      <a
        ref={setAnchorRef}
        href={href}
        className={classes}
        data-sweep="false"
        aria-disabled={disabled || undefined}
        onPointerEnter={handlePointerEnter as unknown as AnchorHTMLAttributes<HTMLAnchorElement>['onPointerEnter']}
        onPointerMove={handlePointerMove as unknown as AnchorHTMLAttributes<HTMLAnchorElement>['onPointerMove']}
        onPointerLeave={handlePointerLeave as unknown as AnchorHTMLAttributes<HTMLAnchorElement>['onPointerLeave']}
        onPointerDown={handlePointerDown as unknown as AnchorHTMLAttributes<HTMLAnchorElement>['onPointerDown']}
        onPointerUp={handlePointerUp as unknown as AnchorHTMLAttributes<HTMLAnchorElement>['onPointerUp']}
        onPointerCancel={handlePointerCancel as unknown as AnchorHTMLAttributes<HTMLAnchorElement>['onPointerCancel']}
        {...anchorProps}
      >
        <span className={styles.content}>{children}</span>
      </a>
    )
  }

  const buttonRawProps = stripSharedProps(
    props as unknown as Record<string, unknown> & {
      variant?: 'primary' | 'secondary' | 'hollow'
      className?: string
      children?: ReactNode
    }
  )
  const { type: buttonType = 'button', ...buttonProps } = buttonRawProps as unknown as ButtonHTMLAttributes<HTMLButtonElement>

  return (
    <button
      ref={setButtonRef}
      type={buttonType}
      className={classes}
      data-sweep="false"
      disabled={disabled}
      onPointerEnter={handlePointerEnter as unknown as ButtonHTMLAttributes<HTMLButtonElement>['onPointerEnter']}
      onPointerMove={handlePointerMove as unknown as ButtonHTMLAttributes<HTMLButtonElement>['onPointerMove']}
      onPointerLeave={handlePointerLeave as unknown as ButtonHTMLAttributes<HTMLButtonElement>['onPointerLeave']}
      onPointerDown={handlePointerDown as unknown as ButtonHTMLAttributes<HTMLButtonElement>['onPointerDown']}
      onPointerUp={handlePointerUp as unknown as ButtonHTMLAttributes<HTMLButtonElement>['onPointerUp']}
      onPointerCancel={handlePointerCancel as unknown as ButtonHTMLAttributes<HTMLButtonElement>['onPointerCancel']}
      {...buttonProps}
    >
      <span className={styles.content}>{children}</span>
    </button>
  )
}
