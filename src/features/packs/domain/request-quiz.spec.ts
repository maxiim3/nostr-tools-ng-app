import { REQUEST_QUIZ_QUESTIONS, pickRandomQuestion } from './request-quiz';

describe('request quiz', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('defines non-empty unique identifiers and labels', () => {
    expect(REQUEST_QUIZ_QUESTIONS.length).toBeGreaterThan(0);

    const questionIds = new Set<string>();

    for (const question of REQUEST_QUIZ_QUESTIONS) {
      expect(question.id.trim().length).toBeGreaterThan(0);
      expect(question.prompt.trim().length).toBeGreaterThan(0);
      expect(questionIds.has(question.id)).toBe(false);

      questionIds.add(question.id);
      expect(question.choices.length).toBeGreaterThan(0);

      const choiceIds = new Set<string>();

      for (const choice of question.choices) {
        expect(choice.id.trim().length).toBeGreaterThan(0);
        expect(choice.label.trim().length).toBeGreaterThan(0);
        expect(choiceIds.has(choice.id)).toBe(false);

        choiceIds.add(choice.id);
      }
    }
  });

  it('pickRandomQuestion returns a valid question', () => {
    const question = pickRandomQuestion();

    expect(REQUEST_QUIZ_QUESTIONS).toContain(question);
  });

  it('pickRandomQuestion can return the first question', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);

    expect(pickRandomQuestion()).toBe(REQUEST_QUIZ_QUESTIONS[0]);
  });

  it('pickRandomQuestion can return the last question', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.999999);

    expect(pickRandomQuestion()).toBe(REQUEST_QUIZ_QUESTIONS[REQUEST_QUIZ_QUESTIONS.length - 1]);
  });
});
