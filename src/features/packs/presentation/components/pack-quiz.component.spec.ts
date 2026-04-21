import { Pipe, PipeTransform } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslocoPipe } from '@jsverse/transloco';

import type { RequestQuizChoice, RequestQuizQuestion } from '../../domain/request-quiz';
import { PackQuizComponent } from './pack-quiz.component';

@Pipe({ name: 'transloco' })
class MockTranslocoPipe implements PipeTransform {
  transform(value: string): string {
    return value;
  }
}

const MOCK_QUESTION: RequestQuizQuestion = {
  id: 'test-q',
  prompt: 'Test prompt?',
  choices: [
    { id: 'a', label: 'Choice A' },
    { id: 'b', label: 'Choice B' },
  ],
};

describe('PackQuizComponent', () => {
  let fixture: ComponentFixture<PackQuizComponent>;
  let component: PackQuizComponent;

  beforeEach(async () => {
    TestBed.overrideComponent(PackQuizComponent, {
      remove: { imports: [TranslocoPipe] },
      add: { imports: [MockTranslocoPipe] },
    });

    await TestBed.configureTestingModule({
      imports: [PackQuizComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(PackQuizComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('question', MOCK_QUESTION);
    fixture.detectChanges();
  });

  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it('selects a choice and clears error', () => {
    component.error.set(true);
    const choice: RequestQuizChoice = { id: 'a', label: 'Choice A' };

    component.selectChoice(choice);

    expect(component.selectedChoice()).toEqual(choice);
    expect(component.error()).toBe(false);
  });

  it('does not select a choice when submitting', () => {
    fixture.componentRef.setInput('submitting', true);
    fixture.detectChanges();

    component.selectChoice({ id: 'a', label: 'Choice A' });

    expect(component.selectedChoice()).toBeNull();
  });

  it('emits answerSelected on submit with the selected choice', () => {
    const spy = vi.spyOn(component.answerSelected, 'emit');
    const choice: RequestQuizChoice = { id: 'a', label: 'Choice A' };
    component.selectChoice(choice);

    component.submit();

    expect(spy).toHaveBeenCalledWith(choice);
  });

  it('sets error when submitting without a selected choice', () => {
    component.submit();

    expect(component.error()).toBe(true);
  });

  it('does not submit when already submitting', () => {
    const spy = vi.spyOn(component.answerSelected, 'emit');
    component.selectChoice({ id: 'a', label: 'Choice A' });
    fixture.componentRef.setInput('submitting', true);
    fixture.detectChanges();

    component.submit();

    expect(spy).not.toHaveBeenCalled();
  });
});
