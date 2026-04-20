import { REQUEST_QUIZ_QUESTIONS } from './request-quiz';

describe('request quiz', () => {
  it('keeps at least one choice per question', () => {
    for (const question of REQUEST_QUIZ_QUESTIONS) {
      expect(question.choices.length).toBeGreaterThan(0);
    }
  });
});
