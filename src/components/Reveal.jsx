import { useReveal } from '../hooks/useReveal.js'

/**
 * 스크롤(또는 즉시) 등장 래퍼.
 * delay(ms)로 stagger 연출. (디자인 스펙 §5)
 */
export default function Reveal({
  as: Tag = 'div',
  immediate = false,
  delay = 0,
  className = '',
  style,
  children,
  ...rest
}) {
  const { ref, shown } = useReveal({ immediate })
  return (
    <Tag
      ref={ref}
      className={`reveal ${shown ? 'is-shown' : ''} ${className}`}
      style={{ '--reveal-delay': `${delay}ms`, ...style }}
      {...rest}
    >
      {children}
    </Tag>
  )
}
