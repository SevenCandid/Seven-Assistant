/**
 * Plugin Manager - Handles plugin loading and execution
 */

import { Plugin, PluginRegistry, PluginContext, PluginResult } from './types';

export class PluginManager {
  private plugins: PluginRegistry = {};
  private isInitialized: boolean = false;

  constructor() {
    this.loadPlugins();
  }

  /**
   * Load all available plugins
   */
  private async loadPlugins(): Promise<void> {
    try {
      // Dynamically import all plugins
      const pluginModules = import.meta.glob('./plugins/plugins/*.ts');
      
      for (const path in pluginModules) {
        try {
          const module = await pluginModules[path]() as any;
          const plugin = module.default as Plugin;
          
          if (plugin && plugin.metadata && plugin.execute) {
            this.registerPlugin(plugin);
          }
        } catch (error) {
          console.error(`Failed to load plugin from ${path}:`, error);
        }
      }
      
      this.isInitialized = true;
      console.log(`✅ Loaded ${Object.keys(this.plugins).length} plugins:`, Object.keys(this.plugins));
    } catch (error) {
      console.error('Failed to load plugins:', error);
      this.isInitialized = true; // Mark as initialized even if failed
    }
  }

  /**
   * Register a plugin
   */
  registerPlugin(plugin: Plugin): void {
    const name = plugin.metadata.name.toLowerCase();
    
    if (this.plugins[name]) {
      console.warn(`⚠️ Plugin "${name}" already registered. Overwriting...`);
    }
    
    this.plugins[name] = plugin;
    console.log(`📦 Registered plugin: ${plugin.metadata.name} v${plugin.metadata.version}`);
  }

  /**
   * Execute a plugin by name
   */
  async executePlugin(
    pluginName: string,
    args: any,
    context: PluginContext
  ): Promise<PluginResult> {
    // Wait for plugins to load
    await this.waitForInit();

    const name = pluginName.toLowerCase();
    const plugin = this.plugins[name];

    if (!plugin) {
      return {
        success: false,
        message: `Plugin "${pluginName}" not found`,
        error: `Available plugins: ${this.getPluginList().join(', ')}`,
      };
    }

    if (plugin.metadata.enabled === false) {
      return {
        success: false,
        message: `Plugin "${pluginName}" is disabled`,
        error: 'Plugin is disabled',
      };
    }

    try {
      console.log(`🔌 Executing plugin: ${plugin.metadata.name}`, args);
      const result = await plugin.execute(args, context);
      console.log(`✅ Plugin "${plugin.metadata.name}" completed:`, result);
      return result;
    } catch (error) {
      console.error(`❌ Plugin "${plugin.metadata.name}" failed:`, error);
      return {
        success: false,
        message: `Plugin "${pluginName}" execution failed`,
        error: (error as Error).message,
      };
    }
  }

  /**
   * Wait for plugins to initialize
   */
  private async waitForInit(): Promise<void> {
    if (this.isInitialized) return;
    
    return new Promise((resolve) => {
      const check = setInterval(() => {
        if (this.isInitialized) {
          clearInterval(check);
          resolve();
        }
      }, 100);
    });
  }

  /**
   * Get list of available plugins
   */
  getPluginList(): string[] {
    return Object.keys(this.plugins);
  }

  /**
   * Get all plugins with metadata
   */
  getAllPlugins(): Plugin[] {
    return Object.values(this.plugins);
  }

  /**
   * Get plugin by name
   */
  getPlugin(name: string): Plugin | undefined {
    return this.plugins[name.toLowerCase()];
  }

  /**
   * Get plugin descriptions for LLM context
   */
  getPluginDescriptions(): string {
    const plugins = this.getAllPlugins();
    
    if (plugins.length === 0) {
      return 'No plugins available.';
    }

    return plugins.map(plugin => {
      return `- "${plugin.metadata.name}": ${plugin.metadata.description}`;
    }).join('\n');
  }

  /**
   * Check if plugin exists
   */
  hasPlugin(name: string): boolean {
    return !!this.plugins[name.toLowerCase()];
  }
}

// Singleton instance
let pluginManagerInstance: PluginManager | null = null;

export const getPluginManager = (): PluginManager => {
  if (!pluginManagerInstance) {
    pluginManagerInstance = new PluginManager();
  }
  return pluginManagerInstance;
};














