import { Pepette, Rocco, Givrine } from '../components/Characters'
import { Scene } from '../components/Scenes'
import { fit, useScreen } from '../lib/useScreen'

/** First screen: one big tap unlocks sound on iPhone (Safari blocks it until a touch). */
export function Splash({ onStart }: { onStart: () => void }) {
  const scr = useScreen()
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
        <button className="play-btn">
          ▶ On joue !
        </button>
        <div className="splash-hint">🔊 Monte le son !</div>
      </div>
    </div>
  )
}
