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
      { id: 'depends', label: 'Ca depend de la region' }
    ]
  }
];

export function pickRandomQuestion(): RequestQuizQuestion {
  return REQUEST_QUIZ_QUESTIONS[0];
}
