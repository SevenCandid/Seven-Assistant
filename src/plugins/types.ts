/**
 * Plugin System Types
 */

export interface PluginMetadata {
  name: string;
  description: string;
  version: string;
  author?: string;
  enabled?: boolean;
}

export interface PluginContext {
  platform: string;
  userMessage: string;
  conversationHistory?: any[];
}

export interface PluginResult {
  success: boolean;
  message: string;
  data?: any;
  error?: string;
}

export interface Plugin {
  metadata: PluginMetadata;
  execute: (args: any, context: PluginContext) => Promise<PluginResult>;
}

export interface PluginRegistry {
  [key: string]: Plugin;
}














