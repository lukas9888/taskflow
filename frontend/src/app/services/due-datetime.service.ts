import { Injectable } from '@angular/core';

/**
 * Merges Material datepicker + timepicker values into one local Date and API ISO strings.
 * Date and time are separate `Date` instances (Material pattern); time uses clock fields only.
 */
@Injectable({ providedIn: 'root' })
export class DueDatetimeService {
  /** Start of local calendar day (00:00:00.000). */
  startOfLocalDay(d: Date): Date {
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
  }

  /** Today at local midnight. */
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

  /**
   * @param datePart from mat-datepicker (calendar day)
   * @param timePart from mat-timepicker (only H/M/S are used; date part ignored)
   */
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

  /**
   * Split API / ISO string into two Dates for pickers (time anchored to 1970-01-01 local for display).
   */
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

  /**
   * Minimum selectable time when the chosen date is today (otherwise null = no extra bound).
   */
  timeMinForDate(datePart: Date | null): Date | null {
    if (!datePart) {
      return null;
    }
    return this.isSameLocalDay(datePart, new Date()) ? new Date() : null;
  }
}
