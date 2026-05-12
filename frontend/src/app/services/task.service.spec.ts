import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { TaskService } from './task.service';
import { TaskItem } from '../models/task-item';

describe('TaskService', () => {
  let service: TaskService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), TaskService],
    });

    service = TestBed.inject(TaskService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('createTask sends POST with title and dueAt', () => {
    const expected: TaskItem = {
      id: 123,
      title: 'Write unit tests',
      createdAt: '2026-05-07T00:00:00.000Z',
      dueAt: null,
      priority: 'medium',
      category: null,
      description: null,
      done: false,
    };

    let actual: TaskItem | undefined;
    service.createTask(expected.title, expected.dueAt).subscribe((t) => {
      actual = t;
    });

    const req = httpMock.expectOne(service.baseUrl);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ title: expected.title, dueAt: null });

    req.flush(expected);
    expect(actual).toEqual(expected);
  });
});
