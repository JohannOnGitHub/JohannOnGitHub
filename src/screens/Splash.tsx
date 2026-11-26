import { useEffect } from 'react'
import { Pepette, Rocco, Givrine } from '../components/Characters'
import { Scene } from '../components/Scenes'
import { fit, useScreen } from '../lib/useScreen'
import { music } from '../lib/music'
import { ac } from '../lib/sfx'
import { speak } from '../lib/speech'
import { PEPETTE_SPLASH } from '../data/lines'
import { FRIENDS } from '../data/content'

/**
 * First screen. Where the browser allows it (Android, computers) the music and
 * Pépette's voice start right away. iPhone forbids any sound before a touch, so
 * a big bouncing hand shows the children where to tap.
 */
export function Splash({ onStart }: { onStart: () => void }) {
  const scr = useScreen()

  useEffect(() => {
    const c = ac()
    const t = setTimeout(() => {
      if (c?.state === 'running') {
        music.unlock()
        void speak(PEPETTE_SPLASH, FRIENDS.pepette.voice)
      }
    }, 400)
    return () => clearTimeout(t)
  }, [])

  return (
    <div className="screen splash" onClick={onStart}>
      <Scene place="alpe" />
      <div className="splash-body">
        <h1 className="title">
          Les Aventures
          <br />
          de Pépette
        </h1>
        <div className="splash-cast">
          <Rocco size={fit(scr, 0.26, 90, 200)} />
          <Pepette size={fit(scr, 0.34, 120, 260)} talking />
          <Givrine size={fit(scr, 0.26, 90, 200)} />
        </div>
        <div className="play-wrap">
          <button className="play-btn" aria-label="On joue !">
            ▶ On joue !
          </button>
          <span className="tap-hand" aria-hidden>
            👆
          </span>
        </div>
        <div className="splash-hint">🎵 Touche l’écran pour la musique ! 🔊</div>
      </div>
    </div>
  )
}
