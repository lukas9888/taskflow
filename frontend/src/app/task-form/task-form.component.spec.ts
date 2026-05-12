import { TaskService } from '../services/task.service';
import { TaskItem } from '../models/task-item';
import { TaskFormComponent } from './task-form.component';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { of, throwError } from 'rxjs';

describe('TaskFormComponent', () => {
  function createTaskServiceMock() {
    return jasmine.createSpyObj<TaskService>('TaskService', ['createTask']);
  }

  it('submitting a valid title calls createTask and emits created', () => {
    const taskService = createTaskServiceMock();

    const createdTask: TaskItem = {
      id: 1,
      title: 'My new task',
      createdAt: '2026-05-07T00:00:00.000Z',
      dueAt: '2026-05-07T23:45:00.000Z',
      priority: 'medium',
      category: null,
      description: null,
      done: false,
    };

    taskService.createTask.and.returnValue(of(createdTask));

    TestBed.configureTestingModule({
      imports: [TaskFormComponent],
      providers: [{ provide: TaskService, useValue: taskService }],
    });

    const fixture = TestBed.createComponent(TaskFormComponent);
    const component = fixture.componentInstance;

    const createdSpy = jasmine.createSpy('created');
    component.created.subscribe(createdSpy);

    fixture.detectChanges();

    component.title = '  My new task  ';
    fixture.detectChanges();

    const form = fixture.debugElement.query(By.css('form'));
    form.triggerEventHandler('ngSubmit', {});

    expect(taskService.createTask).toHaveBeenCalledTimes(1);
    expect(taskService.createTask.calls.mostRecent().args[0]).toBe('My new task');

    expect(createdSpy).toHaveBeenCalledWith(createdTask);
    expect(component.submitting).toBeFalse();
    expect(component.title).toBe('');
  });

  it('shows an error when createTask fails', () => {
    const taskService = createTaskServiceMock();
    taskService.createTask.and.returnValue(
      throwError(() => new Error('API down'))
    );

    TestBed.configureTestingModule({
      imports: [TaskFormComponent],
      providers: [{ provide: TaskService, useValue: taskService }],
    });

    const fixture = TestBed.createComponent(TaskFormComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    component.title = 'Valid title';
    fixture.detectChanges();

    const form = fixture.debugElement.query(By.css('form'));
    form.triggerEventHandler('ngSubmit', {});
    fixture.detectChanges();

    expect(component.submitting).toBeFalse();
    expect(component.submitError).toBe(
      'Could not save task. Check API and database.'
    );
  });
});

