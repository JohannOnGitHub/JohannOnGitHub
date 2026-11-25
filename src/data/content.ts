import type { VoiceStyle } from '../lib/speech'

// All the world's content. Text in {braces} is personalised from the
// family settings (what the children call their parent and grandparents).

export type FriendId = 'pepette' | 'gaspard' | 'cigalou' | 'gaby' | 'korri'
export type BuddyId = 'rocco' | 'givrine'
export type PlaceId = 'alpe' | 'stvincent' | 'provence' | 'marseille' | 'bretagne'

export type Activity = {
  id: string
  kind: 'say' | 'repeat' | 'count' | 'choose'
  /** Fun fact told before the question. */
  fact: string
  /** The question / instruction. */
  ask: string
  /** Extra help for the little ones (said after a miss, or straight away for age ≤ 3). */
  hint?: string
  answers: string[]
  /** What the friend says on success. */
  cheer: string
  picture: string
  /** For `count`: how many pictures to show. */
  count?: number
  /** For `choose`: the options shown (emoji + label). The first is the right one. */
  options?: { emoji: string; label: string }[]
  sticker: { emoji: string; name: string }
}

export type Place = {
  id: PlaceId
  name: string
  short: string
  friend: FriendId
  welcome: string
  badge: { emoji: string; name: string }
  color: string
  activities: Activity[]
}

export const FRIENDS: Record<FriendId, { name: string; what: string; voice: VoiceStyle }> = {
  pepette: { name: 'Pépette', what: 'la marmotte', voice: { id: 'woman' } },
  gaspard: { name: 'Gaspard', what: 'le chamois', voice: { id: 'man' } },
  cigalou: { name: 'Cigalou', what: 'la cigale', voice: { id: 'woman' } },
  gaby: { name: 'Gaby', what: 'la mouette', voice: { id: 'woman' } },
  korri: { name: 'Korri', what: 'le korrigan', voice: { id: 'korri' } },
}

export const BUDDIES: Record<BuddyId, { name: string; title: string; voice: VoiceStyle; blurb: string }> = {
  rocco: {
    name: 'Rocco',
    title: 'le chiot sauveteur',
    voice: { id: 'boy' },
    blurb: 'Un chiot saint-bernard super courageux, avec son camion géant aux grosses roues et sa corde magique pour grimper partout !',
  },
  givrine: {
    name: 'Givrine',
    title: 'la princesse des neiges',
    voice: { id: 'girl' },
    blurb: 'Une princesse des glaciers qui fait danser les flocons, adore les jolies tenues et brille comme le givre !',
  },
}

export const PLACES: Place[] = [
  {
    id: 'alpe',
    name: "L'Alpe d'Huez",
    short: 'Les Alpes',
    friend: 'pepette',
    color: '#5aa9e6',
    welcome: "Bienvenue à l'Alpe d'Huez, tout en haut des montagnes ! Moi, c'est Pépette la marmotte. On joue ?",
    badge: { emoji: '🏔️', name: 'Champion des Alpes' },
    activities: [
      {
        id: 'alpe-marmotte',
        kind: 'say',
        fact: 'Dans les montagnes vivent des marmottes, comme moi ! Quand on a peur, on siffle très fort : fiiiou !',
        ask: 'Comment s’appelle cet animal ?',
        hint: 'C’est une mar… marmotte ! Dis : marmotte !',
        answers: ['marmotte', 'marmottes'],
        cheer: 'Oui ! Une marmotte ! Fiiiou !',
        picture: 'svg:marmotte',
        sticker: { emoji: 'svg:marmotte', name: 'La marmotte' },
      },
      {
        id: 'alpe-neige',
        kind: 'say',
        fact: 'L’hiver, la montagne devient toute blanche. On fait du ski et de la luge !',
        ask: 'Qu’est-ce qui est blanc et froid, et tombe du ciel ?',
        hint: 'C’est la nei… neige ! Dis : la neige !',
        answers: ['neige', 'flocon', 'flocons', 'il neige', 'la neige', 'bonhomme de neige'],
        cheer: 'Bravo ! La neige ! Brrr, ça pique le nez !',
        picture: '❄️',
        sticker: { emoji: '☃️', name: 'Le bonhomme de neige' },
      },
      {
        id: 'alpe-velos',
        kind: 'count',
        fact: 'Pour monter à l’Alpe d’Huez, la route fait vingt et un virages ! Les coureurs du Tour de France la grimpent à vélo.',
        ask: 'Combien de vélos vois-tu ?',
        hint: 'Compte avec moi : un, deux, trois… trois !',
        answers: ['trois'],
        cheer: 'Trois vélos ! Allez, allez, allez !',
        picture: '🚴',
        count: 3,
        sticker: { emoji: '🚴', name: 'Le coureur' },
      },
      {
        id: 'alpe-bonjour',
        kind: 'repeat',
        fact: 'Tout là-haut, il y a de la glace toute l’année. Ça s’appelle un glacier !',
        ask: 'Dis bonjour à la montagne : « Bonjour la montagne ! »',
        answers: ['bonjour la montagne', 'bonjour montagne'],
        cheer: 'Bonjour ! … bonjour… bonjour… Tu entends l’écho ?',
        picture: '🏔️',
        sticker: { emoji: '🏔️', name: 'Le glacier' },
      },
      {
        id: 'alpe-ski',
        kind: 'choose',
        fact: 'Pour glisser sur la neige, on met des skis, un bonnet et des gants bien chauds.',
        ask: 'Qu’est-ce qu’on met pour glisser sur la neige : des skis ou des bottes ?',
        hint: 'Des skis ! Dis : les skis !',
        answers: ['ski', 'skis', 'skier', 'les skis', 'des skis', 'faire du ski'],
        cheer: 'Oui, des skis ! Et c’est parti, ziiiioum !',
        picture: '⛷️',
        options: [
          { emoji: '🎿', label: 'des skis' },
          { emoji: '🥾', label: 'des bottes' },
        ],
        sticker: { emoji: '⛷️', name: 'Le skieur' },
      },
    ],
  },
  {
    id: 'stvincent',
    name: 'Saint-Vincent-les-Forts',
    short: 'Le village',
    friend: 'gaspard',
    color: '#2bb3a3',
    welcome: 'Bienvenue à Saint-Vincent-les-Forts, le village de {parent} ! Je suis Gaspard le chamois. Regarde ce grand lac bleu !',
    badge: { emoji: '🏰', name: 'Gardien du fort' },
    activities: [
      {
        id: 'stv-lac',
        kind: 'say',
        fact: 'Au pied du village, il y a un lac immense, tout bleu-vert : le lac de Serre-Ponçon !',
        ask: 'Comment on appelle cette grande eau bleue ?',
        hint: 'C’est un l… un lac ! Dis : un lac !',
        answers: ['lac', 'eau', 'lac de serre poncon'],
        cheer: 'Oui, un lac ! Plouf, plouf !',
        picture: '🏞️',
        sticker: { emoji: '🏞️', name: 'Le lac' },
      },
      {
        id: 'stv-bateau',
        kind: 'say',
        fact: 'Sur le lac, des bateaux à voile glissent avec le vent. Fouuu !',
        ask: 'Qu’est-ce qui flotte sur l’eau ?',
        hint: 'Un ba… un bateau ! Dis : bateau !',
        answers: ['bateau', 'bateaux', 'voilier', 'voile', 'navire'],
        cheer: 'Un bateau ! Hissez les voiles, moussaillon !',
        picture: '⛵',
        sticker: { emoji: '⛵', name: 'Le voilier' },
      },
      {
        id: 'stv-fort',
        kind: 'choose',
        fact: 'Tout en haut du village, il y a un vieux fort, construit il y a très, très longtemps pour protéger la vallée.',
        ask: 'Qu’est-ce qu’il y a tout en haut du village : un fort ou une piscine ?',
        hint: 'Un fort ! Dis : un fort !',
        answers: ['fort', 'chateau', 'forteresse', 'tour', 'muraille'],
        cheer: 'Un fort ! Tu es un vrai gardien du village !',
        picture: '🏰',
        options: [
          { emoji: '🏰', label: 'un fort' },
          { emoji: '🏊', label: 'une piscine' },
        ],
        sticker: { emoji: '🏰', name: 'Le fort' },
      },
      {
        id: 'stv-poissons',
        kind: 'count',
        fact: 'Dans le lac nagent des poissons, comme les truites. Ils font des bulles : blop, blop !',
        ask: 'Combien de poissons vois-tu ?',
        hint: 'Comptons : un, deux, trois, quatre… quatre !',
        answers: ['quatre'],
        cheer: 'Quatre poissons ! Blop, blop, blop, blop !',
        picture: '🐟',
        count: 4,
        sticker: { emoji: '🐟', name: 'La truite' },
      },
      {
        id: 'stv-village',
        kind: 'repeat',
        fact: 'C’est ici que {parent} a grandi, dans ce village perché sur la montagne.',
        ask: 'Répète avec moi : « C’est le village de {parent} ! »',
        answers: ['village de {parent}', 'le village'],
        cheer: 'Oui ! Le village de {parent} ! Quelle joie pour {parent} !',
        picture: '🏡',
        sticker: { emoji: '🏡', name: 'La maison du village' },
      },
    ],
  },
  {
    id: 'provence',
    name: 'La Provence',
    short: 'La Provence',
    friend: 'cigalou',
    color: '#9b6bd3',
    welcome: 'Bienvenue en Provence, le pays du soleil ! Moi c’est Cigalou la cigale. Cri-cri-cri !',
    badge: { emoji: '💜', name: 'Fée de la lavande' },
    activities: [
      {
        id: 'pro-lavande',
        kind: 'say',
        fact: 'En été, les champs de Provence deviennent tout violets ! C’est une fleur qui sent très bon.',
        ask: 'Comment s’appelle cette fleur violette ?',
        hint: 'C’est la la… lavande ! Dis : lavande !',
        answers: ['lavande'],
        cheer: 'La lavande ! Mmmh, ça sent bon !',
        picture: '🪻',
        sticker: { emoji: '🪻', name: 'La lavande' },
      },
      {
        id: 'pro-soleil',
        kind: 'say',
        fact: 'En Provence, il y a du soleil presque tous les jours. Il fait chaud !',
        ask: 'Qu’est-ce qui brille dans le ciel et nous réchauffe ?',
        hint: 'Le so… soleil ! Dis : soleil !',
        answers: ['soleil'],
        cheer: 'Le soleil ! Mets ton chapeau !',
        picture: '☀️',
        sticker: { emoji: '😎', name: 'Le soleil' },
      },
      {
        id: 'pro-chaud',
        kind: 'repeat',
        fact: 'Quand il fait très chaud, les cigales chantent dans les arbres. C’est moi qui fais ce bruit !',
        ask: 'Dis comme moi : « Il fait chaud ! »',
        answers: ['il fait chaud', 'fait chaud', 'chaud'],
        cheer: 'Il fait chaud ! Cri-cri-cri ! Tu chantes comme une cigale !',
        picture: '🌞',
        sticker: { emoji: '🦗', name: 'La cigale' },
      },
      {
        id: 'pro-olives',
        kind: 'count',
        fact: 'Les oliviers donnent des olives. Avec les olives, on fait de l’huile d’olive !',
        ask: 'Combien d’olives vois-tu ?',
        hint: 'Comptons : un, deux, trois, quatre, cinq… cinq !',
        answers: ['cinq'],
        cheer: 'Cinq olives ! Bravo, tu comptes très bien !',
        picture: '🫒',
        count: 5,
        sticker: { emoji: '🫒', name: 'L’olivier' },
      },
      {
        id: 'pro-couleur',
        kind: 'choose',
        fact: 'Les abeilles adorent butiner les fleurs de lavande. Bzzz !',
        ask: 'De quelle couleur est la lavande : violette ou verte ?',
        hint: 'Violette ! Dis : violet !',
        answers: ['violet', 'violette', 'mauve', 'lila'],
        cheer: 'Violette ! Comme un joli ruban !',
        picture: '🐝',
        options: [
          { emoji: '💜', label: 'violette' },
          { emoji: '💚', label: 'verte' },
        ],
        sticker: { emoji: '🐝', name: 'L’abeille' },
      },
    ],
  },
  {
    id: 'marseille',
    name: 'Marseille',
    short: 'Marseille',
    friend: 'gaby',
    color: '#2f80ed',
    welcome: 'Bienvenue à Marseille, la ville de {mamie} ! Moi c’est Gaby la mouette. Viens voir la mer !',
    badge: { emoji: '⚓', name: 'Capitaine du Vieux-Port' },
    activities: [
      {
        id: 'mar-mer',
        kind: 'say',
        fact: 'Marseille est au bord de la mer Méditerranée. L’eau est bleue… et salée !',
        ask: 'Qu’est-ce que c’est, toute cette eau bleue ?',
        hint: 'C’est la m… la mer ! Dis : la mer !',
        answers: ['mer', 'ocean', 'la mer', 'mediterranee', 'eau'],
        cheer: 'La mer ! Splash !',
        picture: '🌊',
        sticker: { emoji: '🌊', name: 'La mer' },
      },
      {
        id: 'mar-poisson',
        kind: 'say',
        fact: 'Au Vieux-Port, les pêcheurs vendent leurs poissons tous les matins.',
        ask: 'Qu’est-ce que les pêcheurs attrapent ?',
        hint: 'Des poi… poissons ! Dis : poisson !',
        answers: ['poisson', 'poissons', 'peche'],
        cheer: 'Des poissons ! Miam, ce soir c’est bouillabaisse !',
        picture: '🎣',
        sticker: { emoji: '🎣', name: 'Le pêcheur' },
      },
      {
        id: 'mar-bonnemere',
        kind: 'repeat',
        fact: 'Sur la colline, il y a une grande église avec une statue dorée qui veille sur la ville. Les Marseillais l’appellent « la Bonne Mère » !',
        ask: 'Dis avec moi : « la Bonne Mère » !',
        answers: ['bonne mere', 'la bonne mere'],
        cheer: 'La Bonne Mère ! Elle brille au soleil !',
        picture: '⛪',
        sticker: { emoji: '⛪', name: 'La Bonne Mère' },
      },
      {
        id: 'mar-savon',
        kind: 'choose',
        fact: 'Marseille est célèbre pour son savon : le savon de Marseille !',
        ask: 'Avec quoi on se lave les mains : du savon ou de la confiture ?',
        hint: 'Du savon ! Dis : savon !',
        answers: ['savon', 'du savon', 'savon de marseille'],
        cheer: 'Du savon ! Frotte, frotte, et plein de bulles !',
        picture: '🧼',
        options: [
          { emoji: '🧼', label: 'du savon' },
          { emoji: '🍓', label: 'de la confiture' },
        ],
        sticker: { emoji: '🧼', name: 'Le savon de Marseille' },
      },
      {
        id: 'mar-mouettes',
        kind: 'count',
        fact: 'Au-dessus du port, les mouettes volent et crient : kiaou, kiaou !',
        ask: 'Combien de bateaux vois-tu ?',
        hint: 'Comptons : un, deux… deux !',
        answers: ['deux'],
        cheer: 'Deux bateaux ! Tchoo-tchoo, en avant !',
        picture: '🚤',
        count: 2,
        sticker: { emoji: '🚤', name: 'Le bateau du port' },
      },
      {
        id: 'mar-mamie',
        kind: 'repeat',
        fact: '{mamie} a grandi ici, près de la mer et du soleil.',
        ask: 'Répète : « Marseille, c’est la ville de {mamie} ! »',
        answers: ['ville de {mamie}', 'marseille'],
        cheer: 'Bravo ! {mamie} va être fière de toi !',
        picture: '💙',
        sticker: { emoji: '💙', name: 'Le cœur de Marseille' },
      },
    ],
  },
  {
    id: 'bretagne',
    name: 'Rennes et la Bretagne',
    short: 'La Bretagne',
    friend: 'korri',
    color: '#1f3a5f',
    welcome: 'Degemer mat ! Ça veut dire bienvenue en breton ! Je suis Korri le korrigan. Ici, c’est la Bretagne, le pays de {papi} !',
    badge: { emoji: '🧚', name: 'Ami des korrigans' },
    activities: [
      {
        id: 'bre-crepe',
        kind: 'say',
        fact: 'En Bretagne, on mange des crêpes et des galettes. Miam miam !',
        ask: 'Qu’est-ce que c’est, ce rond tout doré ?',
        hint: 'Une crê… une crêpe ! Dis : crêpe !',
        answers: ['crepe', 'crepes', 'galette', 'galettes'],
        cheer: 'Une crêpe ! Avec du chocolat ou du sucre ?',
        picture: '🥞',
        sticker: { emoji: '🥞', name: 'La crêpe' },
      },
      {
        id: 'bre-phare',
        kind: 'say',
        fact: 'Au bord de la mer, il y a de grandes tours avec une lumière qui tourne. Elles guident les bateaux la nuit.',
        ask: 'Comment s’appelle cette tour avec une lumière ?',
        hint: 'C’est un pha… un phare ! Dis : phare !',
        answers: ['phare', 'phares', 'lumiere', 'tour'],
        cheer: 'Un phare ! Sa lumière brille toute la nuit !',
        picture: 'svg:phare',
        sticker: { emoji: 'svg:phare', name: 'Le phare' },
      },
      {
        id: 'bre-rennes',
        kind: 'repeat',
        fact: 'Rennes est la capitale de la Bretagne. C’est là que {papi} a grandi ! Il y a de vieilles maisons en bois de toutes les couleurs.',
        ask: 'Répète : « Rennes, c’est la ville de {papi} ! »',
        answers: ['ville de {papi}', 'rennes'],
        cheer: 'Bravo ! {papi} va faire un grand sourire !',
        picture: '🏘️',
        sticker: { emoji: '🏘️', name: 'Les maisons de Rennes' },
      },
      {
        id: 'bre-maisons',
        kind: 'count',
        fact: 'Dans le vieux Rennes, les maisons ont des poutres en bois et penchent un peu, comme si elles dansaient !',
        ask: 'Combien de maisons vois-tu ?',
        hint: 'Comptons : un, deux, trois… trois !',
        answers: ['trois'],
        cheer: 'Trois maisons ! Tu comptes comme un champion !',
        picture: '🏠',
        count: 3,
        sticker: { emoji: '🏠', name: 'La maison en bois' },
      },
      {
        id: 'bre-drapeau',
        kind: 'choose',
        fact: 'Le drapeau de la Bretagne est noir et blanc. Il s’appelle le Gwenn ha Du !',
        ask: 'De quelles couleurs est le drapeau breton : noir et blanc, ou rouge et jaune ?',
        hint: 'Noir et blanc ! Dis : noir et blanc !',
        answers: ['noir et blanc', 'noir', 'blanc'],
        cheer: 'Noir et blanc ! Kenavo… non, pas encore au revoir, on continue !',
        picture: 'svg:gwennhadu',
        options: [
          { emoji: '⚫⚪', label: 'noir et blanc' },
          { emoji: '🔴🟡', label: 'rouge et jaune' },
        ],
        sticker: { emoji: 'svg:gwennhadu', name: 'Le Gwenn ha Du' },
      },
      {
        id: 'bre-pluie',
        kind: 'say',
        fact: 'En Bretagne, il pleut souvent… alors on met un ciré jaune et des bottes !',
        ask: 'Qu’est-ce qu’on ouvre quand il pleut ?',
        hint: 'Un para… parapluie ! Dis : parapluie !',
        answers: ['parapluie', 'parapluies', 'pépin'],
        cheer: 'Un parapluie ! Plic, ploc, on reste au sec !',
        picture: '☂️',
        sticker: { emoji: '☂️', name: 'Le parapluie' },
      },
    ],
  },
]

export const ALL_ACTIVITIES = PLACES.flatMap((p) => p.activities)

export type Achievement = { id: string; emoji: string; name: string; desc: string }
export const ACHIEVEMENTS: Achievement[] = [
  { id: 'first', emoji: '🗣️', name: 'Premier mot !', desc: 'Dire son premier mot en français' },
  { id: 'five', emoji: '🌟', name: 'Petite étoile', desc: 'Gagner 5 étoiles' },
  { id: 'twenty', emoji: '💫', name: 'Grande étoile', desc: 'Gagner 20 étoiles' },
  { id: 'fifty', emoji: '🌠', name: 'Pluie d’étoiles', desc: 'Gagner 50 étoiles' },
  { id: 'firsttry', emoji: '🎯', name: 'Du premier coup !', desc: '5 réponses justes du premier coup' },
  { id: 'counter', emoji: '🔢', name: 'Champion du calcul', desc: 'Réussir tous les jeux pour compter' },
  { id: 'traveler', emoji: '🗺️', name: 'Grand voyageur', desc: 'Visiter les 5 endroits' },
  { id: 'all', emoji: '👑', name: 'Roi ou reine de France', desc: 'Gagner tous les autocollants' },
]

export type BonusGame = { id: 'bulles' | 'virages' | 'atelier'; emoji: string; name: string; desc: string; stars: number }
export const BONUS_GAMES: BonusGame[] = [
  { id: 'bulles', emoji: '🫧', name: 'Les bulles de savon', desc: 'Éclate les bulles et apprends les mots !', stars: 5 },
  { id: 'atelier', emoji: '🎨', name: "L'atelier", desc: 'Habille ton ami avec tes trésors !', stars: 10 },
  { id: 'virages', emoji: '🛻', name: 'Les 21 virages', desc: 'Crie « Allez ! » pour monter la montagne !', stars: 15 },
]

/** Outfit items for the atelier, unlocked by place badges. */
export type Wearable = { id: string; emoji: string; name: string; place: PlaceId; slot: 'head' | 'face' | 'neck' | 'hand' }
export const WEARABLES: Wearable[] = [
  { id: 'bonnet', emoji: '🧢', name: 'la casquette', place: 'alpe', slot: 'head' },
  { id: 'echarpe', emoji: '🧣', name: "l'écharpe", place: 'alpe', slot: 'neck' },
  { id: 'couronne', emoji: '👑', name: 'la couronne', place: 'stvincent', slot: 'head' },
  { id: 'drapeau', emoji: '🚩', name: 'le drapeau', place: 'stvincent', slot: 'hand' },
  { id: 'lunettes', emoji: '🕶️', name: 'les lunettes de soleil', place: 'provence', slot: 'face' },
  { id: 'fleur', emoji: '🌸', name: 'la fleur', place: 'provence', slot: 'hand' },
  { id: 'casquette', emoji: '⚓', name: "l'ancre", place: 'marseille', slot: 'neck' },
  { id: 'glace', emoji: '🍦', name: 'la glace', place: 'marseille', slot: 'hand' },
  { id: 'chapeau', emoji: '🎩', name: 'le chapeau', place: 'bretagne', slot: 'head' },
  { id: 'crepe', emoji: '🥞', name: 'la crêpe', place: 'bretagne', slot: 'hand' },
]
