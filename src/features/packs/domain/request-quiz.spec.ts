import { REQUEST_QUIZ_QUESTIONS } from './request-quiz';

describe('request quiz', () => {
  it('keeps exactly one correct answer per question', () => {
    for (const question of REQUEST_QUIZ_QUESTIONS) {
      const correctChoices = question.choices.filter((choice) => choice.correct);
      expect(correctChoices.length).toBe(1);
    }
  });
});
