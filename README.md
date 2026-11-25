# Les Aventures de Pépette 🏔️🇫🇷

A French-speaking adventure app for young children (ages 2–8). Kids travel across France with their buddy and meet a local friend in each place. To win stickers, trophies and bonus games, they have to **say the answers out loud in French**.

## The world

| Place | Local friend | What kids learn |
|---|---|---|
| 🏔️ L'Alpe d'Huez | Pépette la marmotte | marmots whistle, snow, the 21 hairpin bends of the Tour de France, glaciers, skiing |
| 🏰 Saint-Vincent-les-Forts | Gaspard le chamois | the lac de Serre-Ponçon, sailboats, the old fort, trout, "le village de Papa" |
| 💜 La Provence | Cigalou la cigale | lavender, sunshine, cicadas, olives & olive oil, bees |
| ⚓ Marseille | Gaby la mouette | the Mediterranean, Vieux-Port fishermen, « la Bonne Mère », savon de Marseille |
| 🧚 Rennes & la Bretagne | Korri le korrigan | crêpes, lighthouses, Rennes' half-timbered houses, the Gwenn ha Du flag, rain! |

**Buddies** (the child picks one):
- **Rocco**, a rescue Saint-Bernard pup with a monster truck.
- **Givrine**, a snow princess who loves pretty outfits.

## Game types
- 🗣️ **Dire**: name the picture (« Comment s'appelle cet animal ? »)
- 🦜 **Répéter**: repeat a phrase (« Bonjour la montagne ! »)
- 🔢 **Compter**: count the items out loud. Kids can tap each item to hear the number.
- 🤔 **Choisir**: answer a question by saying one of the options

## Rewards
- ⭐ Stars: 3 for a first-try answer, 2 otherwise.
- 📒 A sticker album with one sticker per game.
- 🏆 A badge for finishing each place, plus trophies like *Premier mot !*, *Champion du calcul* and *Grand voyageur*.
- 🗺️ Places unlock one after another: 3 games done opens the next one.
- 🎮 Bonus games unlocked with stars:
  - 🫧 **Bulles de savon**: pop bubbles to hear the words you've learned.
  - 🎨 **L'atelier**: dress up your buddy with the treasures from each place.
  - 🛻 **Les 21 virages**: shout « Allez ! » to drive the truck up the Alpe d'Huez.

## Speech
- Uses the browser's own French voice (text-to-speech) and speech recognition (`fr-FR`). Best in **Chrome** (Android, desktop) or **Safari** on iPad/iPhone with Siri enabled.
- Matching is forgiving and depends on age: it compares sounds as well as letters, so « mamotte » counts as *marmotte* and « far » counts as *phare*.
- The **👍 Papa/Maman** button (press and hold) lets a parent approve an answer at any time. On browsers without a microphone, the child speaks out loud and the parent validates.

## Privacy
Children's names are typed in on the device and stored only in its `localStorage`; none are in the code. The optional cloud backup only turns on after a parent signs in.

## Development
```bash
npm install
npm run dev      # http://localhost:5173
npm run build
```

### Optional: cloud backup (Supabase)
1. Apply `supabase/migrations/20261125000000_marmotte_families.sql`. It creates one row per parent account, with row-level security.
2. Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` (see `.env.example`).
3. In the **Coin des parents** (hold the ⚙️ button), sign in with an email code. Progress then syncs across devices.

### Deploy (Vercel)
Import the repo into Vercel. The framework is detected automatically (Vite), and `vercel.json` handles SPA routing. Add the two env vars above to enable cloud backup.
