/**
 * Timer Plugin - Set timers and alarms
 */

import { Plugin, PluginContext, PluginResult } from '../types';

interface ActiveTimer {
  id: string;
  duration: number; // in milliseconds
  label: string;
  startTime: number;
  endTime: number;
  timeoutId: number;
}

class TimerPlugin implements Plugin {
  name = 'timer';
  description = 'Set timers and alarms. Usage: "set timer for 5 minutes" or "timer for 30 seconds" or "show timers" or "cancel all timers"';

  private timers: Map<string, ActiveTimer> = new Map();

  private parseTimeString(str: string): number | null {
    const lowerStr = str.toLowerCase();

    // Match patterns like "5 minutes", "30 seconds", "1 hour", "2h 30m"
    const hours = lowerStr.match(/(\d+)\s*(?:hour|hr|h)s?/);
    const minutes = lowerStr.match(/(\d+)\s*(?:minute|min|m)s?/);
    const seconds = lowerStr.match(/(\d+)\s*(?:second|sec|s)s?/);

    let totalMs = 0;

    if (hours) {
      totalMs += parseInt(hours[1]) * 60 * 60 * 1000;
    }
    if (minutes) {
      totalMs += parseInt(minutes[1]) * 60 * 1000;
    }
    if (seconds) {
      totalMs += parseInt(seconds[1]) * 1000;
    }

    return totalMs > 0 ? totalMs : null;
  }

  private formatDuration(ms: number): string {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      const remainingMinutes = minutes % 60;
      return `${hours}h ${remainingMinutes}m`;
    } else if (minutes > 0) {
      const remainingSeconds = seconds % 60;
      return `${minutes}m ${remainingSeconds}s`;
    } else {
      return `${seconds}s`;
    }
  }

  private getTimeRemaining(timer: ActiveTimer): number {
    return Math.max(0, timer.endTime - Date.now());
  }

  async execute(args: string, context: PluginContext): Promise<PluginResult> {
    const lowerArgs = args.toLowerCase().trim();

    // Show active timers
    if (lowerArgs.includes('show') || lowerArgs.includes('list') || lowerArgs.includes('active')) {
      if (this.timers.size === 0) {
        return {
          success: true,
          message: "No active timers. Try 'set timer for 5 minutes'",
        };
      }

      let message = `⏱️ Active Timers (${this.timers.size}):\n\n`;
      let idx = 1;

      this.timers.forEach((timer) => {
        const remaining = this.getTimeRemaining(timer);
        const remainingFormatted = this.formatDuration(remaining);
        message += `${idx}. ${timer.label} - ${remainingFormatted} remaining\n`;
        idx++;
      });

      return {
        success: true,
        message: message.trim(),
        data: { timers: Array.from(this.timers.values()) }
      };
    }

    // Cancel all timers
    if (lowerArgs.includes('cancel all') || lowerArgs.includes('stop all') || lowerArgs.includes('clear all')) {
      const count = this.timers.size;

      this.timers.forEach((timer) => {
        clearTimeout(timer.timeoutId);
      });
      this.timers.clear();

      return {
        success: true,
        message: `Cancelled ${count} timer(s)`,
      };
    }

    // Cancel specific timer
    if (lowerArgs.includes('cancel') || lowerArgs.includes('stop')) {
      const match = args.match(/(\d+)/);
      if (!match && this.timers.size === 1) {
        // Cancel the only timer
        const timer = Array.from(this.timers.values())[0];
        clearTimeout(timer.timeoutId);
        this.timers.delete(timer.id);

        return {
          success: true,
          message: `Cancelled timer: ${timer.label}`,
        };
      }

      if (!match) {
        return {
          success: false,
          message: "Please specify which timer to cancel, like 'cancel timer 1'",
        };
      }

      const timerIndex = parseInt(match[1]) - 1;
      const timersArray = Array.from(this.timers.values());

      if (timerIndex < 0 || timerIndex >= timersArray.length) {
        return {
          success: false,
          message: `Invalid timer number. You have ${timersArray.length} active timer(s).`,
        };
      }

      const timer = timersArray[timerIndex];
      clearTimeout(timer.timeoutId);
      this.timers.delete(timer.id);

      return {
        success: true,
        message: `Cancelled timer: ${timer.label}`,
      };
    }

    // Set new timer
    const duration = this.parseTimeString(args);

    if (!duration) {
      return {
        success: false,
        message: "Please specify a duration, like 'set timer for 5 minutes' or 'timer for 30 seconds'",
      };
    }

    // Extract label (optional)
    let label = args
      .replace(/set\s+timer|timer|for|to/gi, '')
      .replace(/\d+\s*(?:hour|hr|h|minute|min|m|second|sec|s)s?/gi, '')
      .trim();

    if (!label || label.length < 2) {
      label = `Timer for ${this.formatDuration(duration)}`;
    }

    const timerId = `timer-${Date.now()}`;
    const startTime = Date.now();
    const endTime = startTime + duration;

    // Create notification callback
    const timeoutId = window.setTimeout(() => {
      // Remove from active timers
      this.timers.delete(timerId);

      // Show notification (browser notification API)
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('⏰ Timer Complete!', {
          body: label,
          icon: '/seven_ico.png',
        });
      }

      // Also show an alert
      alert(`⏰ Timer Complete!\n\n${label}`);

      console.log(`⏰ Timer completed: ${label}`);
    }, duration);

    const timer: ActiveTimer = {
      id: timerId,
      duration,
      label,
      startTime,
      endTime,
      timeoutId: timeoutId as unknown as number,
    };

    this.timers.set(timerId, timer);

    // Request notification permission if not granted
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    return {
      success: true,
      message: `✓ Timer set for ${this.formatDuration(duration)}${label !== `Timer for ${this.formatDuration(duration)}` ? `: ${label}` : ''}`,
      data: { timer }
    };
  }
}

export default new TimerPlugin();













