export interface RequestQuizChoice {
  id: string;
  label: string;
}

export interface RequestQuizQuestion {
  id: string;
  prompt: string;
  choices: readonly RequestQuizChoice[];
}

export const REQUEST_QUIZ_QUESTIONS: readonly RequestQuizQuestion[] = [
  {
    id: 'viennoiserie',
    prompt: 'Pain au chocolat ou chocolatine ?',
    choices: [
      { id: 'pain', label: 'Pain au chocolat' },
      { id: 'chocolatine', label: 'Chocolatine' },
      { id: 'depends', label: 'Ca depend de la region' },
    ],
  },
  {
    id: 'fromage',
    prompt: 'Quel est le vrai fromage ?',
    choices: [
      { id: 'comte', label: 'Le Comte' },
      { id: 'camembert', label: 'Le Camembert' },
      { id: 'tous', label: "Tous, tant qu'il y a du pain avec" },
    ],
  },
  {
    id: 'apero',
    prompt: "L'apero, c'est...",
    choices: [
      { id: 'sacre', label: 'Sacre' },
      { id: 'droit', label: 'Un droit fondamental' },
      { id: 'meeting', label: "Le seul meeting qui commence a l'heure" },
    ],
  },
  {
    id: 'baguette',
    prompt: 'Comment transporter sa baguette ?',
    choices: [
      { id: 'bras', label: 'Sous le bras, comme un vrai' },
      { id: 'main', label: 'A la main, dignement' },
      { id: 'finie', label: "Il n'y a pas de bonne reponse, elle est deja finie" },
    ],
  },
  {
    id: 'politique',
    prompt: 'Quelle est la vraie solution ?',
    choices: [
      { id: 'travailler', label: 'Retourner travailler' },
      { id: 'greve', label: 'Faire greve' },
      { id: 'nostr', label: 'Deplacer la conversation sur nostr' },
    ],
  },
];

export function pickRandomQuestion(): RequestQuizQuestion {
  return REQUEST_QUIZ_QUESTIONS[Math.floor(Math.random() * REQUEST_QUIZ_QUESTIONS.length)];
}
