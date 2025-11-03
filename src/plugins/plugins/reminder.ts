/**
 * Reminder Plugin - Set reminders with timeout alerts
 */

import { Plugin, PluginContext, PluginResult } from '../types';

interface ReminderArgs {
  message: string;
  delayMinutes?: number;
  delaySeconds?: number;
}

const parseReminderArgs = (args: any): ReminderArgs => {
  // If args is a string, parse it
  if (typeof args === 'string') {
    const text = args.toLowerCase();
    
    // Extract time
    let delayMinutes = 5; // Default
    let delaySeconds = 0;
    
    // Check for minutes
    const minutesMatch = text.match(/(\d+)\s*(?:minute|min|m)/i);
    if (minutesMatch) {
      delayMinutes = parseInt(minutesMatch[1]);
    }
    
    // Check for seconds
    const secondsMatch = text.match(/(\d+)\s*(?:second|sec|s)/i);
    if (secondsMatch) {
      delaySeconds = parseInt(secondsMatch[1]);
      delayMinutes = 0; // If seconds specified, ignore default minutes
    }
    
    // Check for hours
    const hoursMatch = text.match(/(\d+)\s*(?:hour|hr|h)/i);
    if (hoursMatch) {
      delayMinutes = parseInt(hoursMatch[1]) * 60;
    }
    
    // Extract message (everything after "to" or just use the original)
    let message = args;
    const toMatch = text.match(/(?:to|that)\s+(.+)/i);
    if (toMatch) {
      message = toMatch[1].trim();
    }
    
    return { message, delayMinutes, delaySeconds };
  }
  
  // If args is an object
  return {
    message: args.message || 'Reminder!',
    delayMinutes: args.delayMinutes || args.minutes || 5,
    delaySeconds: args.delaySeconds || args.seconds || 0,
  };
};

const plugin: Plugin = {
  metadata: {
    name: 'reminder',
    description: 'Set reminders with custom messages and delays. Example: "remind me in 5 minutes to check email"',
    version: '1.0.0',
    author: 'Seven AI',
    enabled: true,
  },

  async execute(args: any, context: PluginContext): Promise<PluginResult> {
    try {
      const { message, delayMinutes, delaySeconds } = parseReminderArgs(args);
      
      // Calculate total delay in milliseconds
      const totalMs = (delayMinutes || 0) * 60 * 1000 + (delaySeconds || 0) * 1000;
      
      if (totalMs <= 0) {
        return {
          success: false,
          message: 'Invalid delay time. Please specify a positive time.',
          error: 'Delay must be greater than 0',
        };
      }

      // Format time display
      let timeStr = '';
      if (delayMinutes && delayMinutes > 0) {
        timeStr = `${delayMinutes} minute${delayMinutes !== 1 ? 's' : ''}`;
      }
      if (delaySeconds && delaySeconds > 0) {
        if (timeStr) timeStr += ' and ';
        timeStr += `${delaySeconds} second${delaySeconds !== 1 ? 's' : ''}`;
      }

      // Set the reminder
      setTimeout(() => {
        // Show browser notification if permitted
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('⏰ Seven Reminder', {
            body: message,
            icon: '/seven_ico.png',
            tag: 'seven-reminder',
          });
        }
        
        // Always show alert as fallback
        alert(`⏰ Reminder from Seven:\n\n${message}`);
        
        // Log to console
        console.log('⏰ REMINDER:', message);
      }, totalMs);

      // Request notification permission if not granted
      if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission().then(permission => {
          if (permission === 'granted') {
            console.log('✅ Notification permission granted');
          }
        });
      }

      return {
        success: true,
        message: `Reminder set! I'll remind you in ${timeStr}: "${message}"`,
        data: {
          reminderMessage: message,
          delayMs: totalMs,
          delayMinutes,
          delaySeconds,
          willFireAt: new Date(Date.now() + totalMs).toLocaleTimeString(),
        },
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to set reminder',
        error: (error as Error).message,
      };
    }
  },
};

export default plugin;














