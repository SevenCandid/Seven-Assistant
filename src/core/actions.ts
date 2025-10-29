/**
 * Action Execution System
 * Safely execute structured JSON-based actions
 */

import { getCurrentTime, getCurrentDate, detectPlatform } from './utils';

export interface ActionResult {
  success: boolean;
  data?: any;
  error?: string;
}

/**
 * Action Executor Class
 */
export class ActionExecutor {
  private platform: string = 'web';

  constructor() {
    this.initialize();
  }

  private async initialize() {
    this.platform = await detectPlatform();
  }

  /**
   * Execute an action based on its name
   */
  async execute(action: string | null, data: any): Promise<ActionResult> {
    if (!action) {
      return { success: true, data: null };
    }

    try {
      switch (action) {
        case 'open_url':
          return await this.openURL(data);

        case 'get_time':
          return this.getTime();

        case 'get_date':
          return this.getDate();

        case 'play_media':
          return await this.playMedia(data);

        case 'search':
          return await this.search(data);

        case 'show_alert':
          return this.showAlert(data);

        case 'system_info':
          return await this.getSystemInfo();

        case 'send_sms':
          return await this.sendSMS(data);

        case 'open_whatsapp':
          return await this.openWhatsApp(data);

        default:
          return {
            success: false,
            error: `Unknown action: ${action}`,
          };
      }
    } catch (error) {
      return {
        success: false,
        error: (error as Error).message,
      };
    }
  }

  /**
   * Open a URL
   */
  private async openURL(url: string): Promise<ActionResult> {
    if (!url) {
      return { success: false, error: 'URL is required' };
    }

    // Validate URL
    try {
      new URL(url);
    } catch {
      return { success: false, error: 'Invalid URL' };
    }

    if (this.platform === 'electron' && window.electron) {
      // Use Electron's shell.openExternal
      const result = await window.electron.executeAction({ type: 'open-url', url });
      return result;
    } else {
      // Use window.open for web and capacitor
      window.open(url, '_blank');
      return { success: true, data: { url } };
    }
  }

  /**
   * Get current time
   */
  private getTime(): ActionResult {
    const time = getCurrentTime();
    return {
      success: true,
      data: { time },
    };
  }

  /**
   * Get current date
   */
  private getDate(): ActionResult {
    const date = getCurrentDate();
    return {
      success: true,
      data: { date },
    };
  }

  /**
   * Play media
   */
  private async playMedia(url: string): Promise<ActionResult> {
    if (!url) {
      return { success: false, error: 'Media URL is required' };
    }

    try {
      // Create an audio element and play
      const audio = new Audio(url);
      await audio.play();
      return {
        success: true,
        data: { url, message: 'Playing media' },
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to play media: ${(error as Error).message}`,
      };
    }
  }

  /**
   * Search the web
   */
  private async search(query: string): Promise<ActionResult> {
    if (!query) {
      return { success: false, error: 'Search query is required' };
    }

    const searchURL = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
    return await this.openURL(searchURL);
  }

  /**
   * Show alert
   */
  private showAlert(message: string): ActionResult {
    if (!message) {
      return { success: false, error: 'Alert message is required' };
    }

    alert(message);
    return {
      success: true,
      data: { message },
    };
  }

  /**
   * Get system information
   */
  private async getSystemInfo(): Promise<ActionResult> {
    if (this.platform === 'electron' && window.electron) {
      const result = await window.electron.executeAction({ type: 'system-info' });
      return result;
    }

    return {
      success: true,
      data: {
        platform: this.platform,
        userAgent: navigator.userAgent,
        language: navigator.language,
      },
    };
  }

  /**
   * Send SMS
   * Opens the default SMS app with pre-filled recipient and message
   */
  private async sendSMS(data: { recipient: string; message: string }): Promise<ActionResult> {
    const { recipient, message } = data;

    if (!recipient) {
      return { success: false, error: 'Recipient phone number is required' };
    }

    if (!message) {
      return { success: false, error: 'Message content is required' };
    }

    // Clean phone number (remove spaces, dashes, etc.)
    const cleanPhone = recipient.replace(/[\s\-\(\)]/g, '');

    // Build SMS URI
    const smsURI = `sms:${cleanPhone}?body=${encodeURIComponent(message)}`;

    try {
      if (this.platform === 'electron' && window.electron) {
        // Use Electron's shell.openExternal for SMS
        const result = await window.electron.executeAction({ 
          type: 'open-url', 
          url: smsURI 
        });
        return {
          success: result.success,
          data: { 
            recipient: cleanPhone, 
            message,
            response: `Opening SMS app to text ${cleanPhone}`
          },
        };
      } else {
        // Use window.open for web/PWA/Capacitor
        window.open(smsURI, '_self');
        return {
          success: true,
          data: { 
            recipient: cleanPhone, 
            message,
            response: `Opening SMS app to text ${cleanPhone}`
          },
        };
      }
    } catch (error) {
      return {
        success: false,
        error: `Failed to open SMS app: ${(error as Error).message}`,
      };
    }
  }

  /**
   * Open WhatsApp chat
   * Opens WhatsApp web/app with specified phone number and optional pre-filled message
   */
  private async openWhatsApp(data: { phone: string; message?: string }): Promise<ActionResult> {
    const { phone, message = '' } = data;

    if (!phone) {
      return { success: false, error: 'Phone number is required' };
    }

    // Clean phone number (remove spaces, dashes, parentheses, leading +)
    const cleanPhone = phone.replace(/[\s\-\(\)]/g, '').replace(/^\+/, '');

    // Build WhatsApp URL
    let whatsappURL = `https://wa.me/${cleanPhone}`;
    
    if (message) {
      whatsappURL += `?text=${encodeURIComponent(message)}`;
    }

    try {
      if (this.platform === 'electron' && window.electron) {
        // Use Electron's shell.openExternal for WhatsApp
        const result = await window.electron.executeAction({ 
          type: 'open-url', 
          url: whatsappURL 
        });
        return {
          success: result.success,
          data: { 
            phone: cleanPhone, 
            message,
            response: `Opening WhatsApp chat with ${cleanPhone}`
          },
        };
      } else {
        // Use window.open for web/PWA/Capacitor
        window.open(whatsappURL, '_blank');
        return {
          success: true,
          data: { 
            phone: cleanPhone, 
            message,
            response: `Opening WhatsApp chat with ${cleanPhone}`
          },
        };
      }
    } catch (error) {
      return {
        success: false,
        error: `Failed to open WhatsApp: ${(error as Error).message}`,
      };
    }
  }
}

/**
 * Create action executor instance
 */
export const createActionExecutor = (): ActionExecutor => {
  return new ActionExecutor();
};

