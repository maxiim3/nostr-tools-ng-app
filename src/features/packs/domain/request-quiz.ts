export interface RequestQuizChoice {
  id: string;
  label: string;
  correct: boolean;
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
      { id: 'pain', label: 'Pain au chocolat', correct: false },
      { id: 'chocolatine', label: 'Chocolatine', correct: false },
      { id: 'depends', label: 'Ca depend de la region', correct: true }
    ]
  },
  {
    id: 'grammaire',
    prompt: 'Lequel n est pas francais ?',
    choices: [
      { id: 'wrong', label: 'Vous acheter bitcoin', correct: true },
      { id: 'present', label: 'Vous achetez du bitcoin', correct: false },
      { id: 'past', label: 'Vous avez achete du bitcoin', correct: false }
    ]
  }
];

export function pickRandomQuestion(random = Math.random): RequestQuizQuestion {
  const index = Math.floor(random() * REQUEST_QUIZ_QUESTIONS.length);
  return REQUEST_QUIZ_QUESTIONS[index] ?? REQUEST_QUIZ_QUESTIONS[0];
}
