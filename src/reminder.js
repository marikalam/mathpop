import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';

// The daily practice reminder (iPhone and iPad app only): a grown-up turns
// it on, and every day at the same time iOS
// shows "Pip has new math for Maddie!". Nothing leaves the device: it's a
// local notification, set on this phone.

const KEY = 'mathpop-reminder-v1';
const ID = 4101;

export const canRemind = Capacitor.isNativePlatform();

export function reminderState() {
  try {
    return JSON.parse(localStorage.getItem(KEY)) || { on: false, hour: 17 };
  } catch {
    return { on: false, hour: 17 };
  }
}

function save(state) {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* private mode */
  }
}

export function hourLabel(hour) {
  const h = hour % 12 || 12;
  return `${h} ${hour < 12 ? 'am' : 'pm'}`;
}

// Turns the reminder on at `hour` (0-23). Resolves to the new state; it
// stays off if iOS notifications aren't allowed.
export async function turnOnReminder(name, hour = reminderState().hour) {
  if (!canRemind) return reminderState();
  try {
    let perm = await LocalNotifications.checkPermissions();
    if (perm.display !== 'granted') perm = await LocalNotifications.requestPermissions();
    if (perm.display !== 'granted') return { ...reminderState(), on: false, denied: true };
    await LocalNotifications.cancel({ notifications: [{ id: ID }] });
    await LocalNotifications.schedule({
      notifications: [
        {
          id: ID,
          title: 'MathPop',
          body: name ? `Pip has new math for ${name}! Ready for today's round?` : "Pip has new math for you! Ready for today's round?",
          schedule: { on: { hour, minute: 0 }, allowWhileIdle: true },
        },
      ],
    });
    const state = { on: true, hour };
    save(state);
    return state;
  } catch {
    return reminderState();
  }
}

export async function turnOffReminder() {
  const state = { ...reminderState(), on: false };
  save(state);
  if (canRemind) {
    try {
      await LocalNotifications.cancel({ notifications: [{ id: ID }] });
    } catch {
      /* nothing to cancel */
    }
  }
  return state;
}
