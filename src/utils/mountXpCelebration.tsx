'use client'

import { createRoot, type Root } from 'react-dom/client'
import XpCelebration, { type XpCelebrationProps } from '@/components/gamification/XpCelebration'

const HOST_ID = 'xp-celebration-root'

let celebrationRoot: Root | null = null

export function mountXpCelebration(
  props: Pick<XpCelebrationProps, 'xpLabel' | 'levelUp' | 'levelUpLabel'>
): void {
  if (typeof document === 'undefined') return

  let host = document.getElementById(HOST_ID)
  if (!host) {
    host = document.createElement('div')
    host.id = HOST_ID
    document.body.appendChild(host)
    celebrationRoot = createRoot(host)
  } else if (!celebrationRoot) {
    celebrationRoot = createRoot(host)
  }

  const unmount = () => {
    celebrationRoot?.render(null)
  }

  celebrationRoot.render(
    <XpCelebration
      xpLabel={props.xpLabel}
      levelUp={props.levelUp}
      levelUpLabel={props.levelUpLabel}
      onDone={unmount}
    />
  )
}
