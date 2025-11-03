/**
 * Utility Functions
 */

/**
 * Get current time formatted
 */
export const getCurrentTime = (): string => {
  const now = new Date();
  return now.toLocaleTimeString([], { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: true 
  });
};

/**
 * Get current date formatted
 */
export const getCurrentDate = (): string => {
  const now = new Date();
  return now.toLocaleDateString([], { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
};

/**
 * Detect the current platform
 */
export const detectPlatform = async (): Promise<string> => {
  // Check if running in Electron
  if (typeof window !== 'undefined' && (window as any).electron) {
    return 'Electron';
  }
  
  // Check if running in Capacitor (mobile)
  if (typeof window !== 'undefined' && (window as any).Capacitor) {
    const platform = (window as any).Capacitor.getPlatform();
    return platform === 'ios' ? 'iOS' : platform === 'android' ? 'Android' : 'Mobile';
  }
  
  // Check user agent for more specific web platform info
  if (typeof navigator !== 'undefined') {
    const userAgent = navigator.userAgent.toLowerCase();
    
    if (userAgent.includes('iphone') || userAgent.includes('ipad')) {
      return 'Web (iOS)';
    }
    if (userAgent.includes('android')) {
      return 'Web (Android)';
    }
    if (userAgent.includes('mac')) {
      return 'Web (Mac)';
    }
    if (userAgent.includes('win')) {
      return 'Web (Windows)';
    }
    if (userAgent.includes('linux')) {
      return 'Web (Linux)';
    }
  }
  
  return 'Web';
};













