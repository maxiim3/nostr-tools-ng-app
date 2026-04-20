import { REQUEST_QUIZ_QUESTIONS, pickRandomQuestion } from './request-quiz';

describe('request quiz', () => {
  it('keeps at least one choice per question', () => {
    for (const question of REQUEST_QUIZ_QUESTIONS) {
      expect(question.choices.length).toBeGreaterThan(0);
    }
  });

  it('pickRandomQuestion returns a valid question', () => {
    const question = pickRandomQuestion();
    expect(REQUEST_QUIZ_QUESTIONS).toContain(question);
  });
});
