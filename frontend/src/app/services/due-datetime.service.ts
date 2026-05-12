import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class DueDatetimeService {
  startOfLocalDay(d: Date): Date {
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
  }

  startOfToday(): Date {
    return this.startOfLocalDay(new Date());
  }

  isSameLocalDay(a: Date, b: Date): boolean {
    return (
      a.getFullYear() === b.getFullYear() &&
      a.getMonth() === b.getMonth() &&
      a.getDate() === b.getDate()
    );
  }

  combine(datePart: Date | null, timePart: Date | null): Date | null {
    if (!datePart && !timePart) {
      return null;
    }
    if (!datePart) {
      return null;
    }
    const base = this.startOfLocalDay(datePart);
    if (!timePart) {
      return base;
    }
    return new Date(
      base.getFullYear(),
      base.getMonth(),
      base.getDate(),
      timePart.getHours(),
      timePart.getMinutes(),
      timePart.getSeconds(),
      0
    );
  }

  toIsoOrNull(datePart: Date | null, timePart: Date | null): string | null {
    const c = this.combine(datePart, timePart);
    return c ? c.toISOString() : null;
  }

  fromIso(iso: string | null | undefined): { date: Date | null; time: Date | null } {
    if (!iso) {
      return { date: null, time: null };
    }
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) {
      return { date: null, time: null };
    }
    const date = this.startOfLocalDay(d);
    const time = new Date(1970, 0, 1, d.getHours(), d.getMinutes(), d.getSeconds(), 0);
    return { date, time };
  }

  isBeforeNow(combined: Date | null): boolean {
    if (!combined) {
      return false;
    }
    return combined.getTime() < Date.now();
  }

  timeMinForDate(datePart: Date | null): Date | null {
    if (!datePart) {
      return null;
    }
    return this.isSameLocalDay(datePart, new Date()) ? new Date() : null;
  }
}
