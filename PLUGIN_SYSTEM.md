# 🔌 Seven AI Assistant - Plugin System Documentation

## Overview

Seven now features a **powerful plugin system** that allows extending functionality through modular plugins. Plugins are automatically discovered, registered, and routed by the AI layer.

---

## 🎯 **Architecture**

### **Components**

1. **Plugin Manager** (`src/plugins/pluginManager.ts`)
   - Discovers and loads plugins automatically
   - Manages plugin registry
   - Executes plugins with context
   - Provides plugin descriptions to LLM

2. **Plugin Types** (`src/plugins/types.ts`)
   - Defines plugin interfaces
   - Plugin metadata structure
   - Plugin context and results

3. **Plugins Directory** (`src/plugins/plugins/`)
   - Contains all plugin implementations
   - Each plugin is a separate TypeScript file
   - Auto-discovered by the plugin manager

---

## 📦 **Built-in Plugins**

### **1. Reminder Plugin** ⏰

**Purpose**: Set timed reminders with custom messages

**File**: `src/plugins/plugins/reminder.ts`

**Usage**:
```
User: "Remind me in 10 minutes to check email"
User: "Set a reminder in 2 hours to call mom"
User: "Remind me in 30 seconds to test"
```

**Features**:
- Parse natural language time (minutes, seconds, hours)
- Browser notifications (if permitted)
- Alert fallback
- Precise scheduling

**Example**:
```typescript
{
  "plugin": "reminder",
  "pluginArgs": "remind me in 10 minutes to check email"
}
```

---

### **2. Weather Plugin** 🌤️

**Purpose**: Get current weather and forecast for any location

**File**: `src/plugins/plugins/weather.ts`

**API**: [Open-Meteo](https://open-meteo.com/) (free, no API key required)

**Usage**:
```
User: "What's the weather in Tokyo?"
User: "Weather forecast for New York"
User: "How's the weather in London?"
```

**Features**:
- Geocoding (location name → coordinates)
- Current weather (temp, humidity, wind, conditions)
- 2-day forecast
- WMO weather codes interpretation
- Fahrenheit & mph units

**Example Response**:
```
Weather in Tokyo, Japan:
🌡️ Temperature: 72°F
☁️ Conditions: Partly cloudy
💨 Wind: 8 mph
💧 Humidity: 65%

📅 Forecast:
Today: Partly cloudy, High 75°F, Low 68°F
Tomorrow: Clear sky, High 78°F, Low 70°F
```

---

### **3. Calculator Plugin** 🧮

**Purpose**: Perform mathematical calculations

**File**: `src/plugins/plugins/calculator.ts`

**Usage**:
```
User: "Calculate 25 * 48 + 100"
User: "What is 15% of 200?"
User: "Compute (25 + 30) * 2"
```

**Features**:
- Basic arithmetic (+, -, *, /)
- Modulo (%)
- Power (^)
- Parentheses
- Safe evaluation

**Example**:
```typescript
{
  "plugin": "calculator",
  "pluginArgs": "25 * 48 + 100"
}
```

---

## 🔧 **Creating a Custom Plugin**

### **1. Create Plugin File**

Create `src/plugins/plugins/your-plugin.ts`:

```typescript
import { Plugin, PluginContext, PluginResult } from '../types';

const plugin: Plugin = {
  metadata: {
    name: 'your-plugin',
    description: 'Short description of what your plugin does',
    version: '1.0.0',
    author: 'Your Name',
    enabled: true,
  },

  async execute(args: any, context: PluginContext): Promise<PluginResult> {
    try {
      // Your plugin logic here
      
      return {
        success: true,
        message: 'Plugin executed successfully!',
        data: { /* optional data */ },
      };
    } catch (error) {
      return {
        success: false,
        message: 'Plugin execution failed',
        error: (error as Error).message,
      };
    }
  },
};

export default plugin;
```

### **2. Plugin Interface**

```typescript
interface Plugin {
  metadata: PluginMetadata;
  execute: (args: any, context: PluginContext) => Promise<PluginResult>;
}

interface PluginMetadata {
  name: string;              // Unique plugin name (lowercase)
  description: string;        // What the plugin does (shown to LLM)
  version: string;            // Semantic version
  author?: string;            // Plugin author
  enabled?: boolean;          // Whether plugin is enabled (default: true)
}

interface PluginContext {
  platform: string;           // 'web', 'electron', 'mobile'
  userMessage: string;        // Original user message
  conversationHistory?: any[]; // Past messages (optional)
}

interface PluginResult {
  success: boolean;           // Whether plugin executed successfully
  message: string;            // Message to display to user
  data?: any;                 // Optional structured data
  error?: string;             // Error message if failed
}
```

### **3. Parse Arguments**

```typescript
const parseArgs = (args: any): YourArgsType => {
  // If args is a string
  if (typeof args === 'string') {
    // Parse the string
    return { parsed: args };
  }
  
  // If args is an object
  return {
    field1: args.field1 || 'default',
    field2: args.field2 || 0,
  };
};
```

### **4. Example: Quote Plugin**

```typescript
/**
 * Quote Plugin - Get random inspirational quotes
 */

import { Plugin, PluginContext, PluginResult } from '../types';

const quotes = [
  "The only way to do great work is to love what you do. - Steve Jobs",
  "Innovation distinguishes between a leader and a follower. - Steve Jobs",
  "Stay hungry, stay foolish. - Steve Jobs",
  // Add more quotes...
];

const plugin: Plugin = {
  metadata: {
    name: 'quote',
    description: 'Get random inspirational quotes',
    version: '1.0.0',
    author: 'Seven AI',
    enabled: true,
  },

  async execute(args: any, context: PluginContext): Promise<PluginResult> {
    try {
      const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
      
      return {
        success: true,
        message: `💭 ${randomQuote}`,
        data: { quote: randomQuote },
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to get quote',
        error: (error as Error).message,
      };
    }
  },
};

export default plugin;
```

### **5. Auto-Discovery**

Once you create the plugin file in `src/plugins/plugins/`, it will be automatically discovered and registered on app start!

**No additional configuration required!** ✨

---

## 🤖 **How AI Routing Works**

### **1. LLM Context**

When the app starts, all plugin descriptions are automatically added to the LLM system prompt:

```
Available plugins:
- "reminder": Set reminders with custom messages and delays
- "weather": Get current weather and forecast for any location
- "calculator": Perform mathematical calculations
```

### **2. AI Decision**

The LLM decides whether to use a plugin based on the user's request:

```json
{
  "message": "I'll set that reminder for you!",
  "action": null,
  "data": null,
  "plugin": "reminder",
  "pluginArgs": "remind me in 10 minutes to check email"
}
```

### **3. Plugin Execution**

The plugin manager executes the plugin and returns results:

```typescript
const pluginResult = await pluginManager.executePlugin(
  'reminder',
  'remind me in 10 minutes to check email',
  {
    platform: 'web',
    userMessage: 'Remind me in 10 minutes to check email',
  }
);
```

### **4. Response Display**

The plugin result is displayed in the chat:

```
🤖 Seven: I'll set that reminder for you!
🤖 Seven: Reminder set! I'll remind you in 10 minutes: "check email"
```

---

## 🔍 **Plugin Manager API**

### **Get Plugin Manager**

```typescript
import { getPluginManager } from './plugins/pluginManager';

const pluginManager = getPluginManager();
```

### **Execute Plugin**

```typescript
const result = await pluginManager.executePlugin(
  'weather',
  'Tokyo',
  {
    platform: 'web',
    userMessage: 'What\'s the weather in Tokyo?',
  }
);

console.log(result.message);
// "Weather in Tokyo, Japan: ..."
```

### **Get Plugin List**

```typescript
const plugins = pluginManager.getPluginList();
// ['reminder', 'weather', 'calculator']
```

### **Get All Plugins**

```typescript
const allPlugins = pluginManager.getAllPlugins();
allPlugins.forEach(plugin => {
  console.log(`${plugin.metadata.name}: ${plugin.metadata.description}`);
});
```

### **Get Plugin Descriptions**

```typescript
const descriptions = pluginManager.getPluginDescriptions();
console.log(descriptions);
// - "reminder": Set reminders with custom messages...
// - "weather": Get current weather and forecast...
```

### **Check Plugin Existence**

```typescript
if (pluginManager.hasPlugin('weather')) {
  console.log('Weather plugin is available!');
}
```

---

## 🎨 **Plugin Examples**

### **1. Simple Plugin (No External API)**

```typescript
// src/plugins/plugins/coin-flip.ts

import { Plugin, PluginContext, PluginResult } from '../types';

const plugin: Plugin = {
  metadata: {
    name: 'coin-flip',
    description: 'Flip a coin (heads or tails)',
    version: '1.0.0',
  },

  async execute(args: any, context: PluginContext): Promise<PluginResult> {
    const result = Math.random() > 0.5 ? 'Heads' : 'Tails';
    
    return {
      success: true,
      message: `🪙 The coin landed on: **${result}**!`,
      data: { result },
    };
  },
};

export default plugin;
```

### **2. API Plugin (External Data)**

```typescript
// src/plugins/plugins/joke.ts

import { Plugin, PluginContext, PluginResult } from '../types';

const plugin: Plugin = {
  metadata: {
    name: 'joke',
    description: 'Get a random joke from API',
    version: '1.0.0',
  },

  async execute(args: any, context: PluginContext): Promise<PluginResult> {
    try {
      const response = await fetch('https://official-joke-api.appspot.com/random_joke');
      const joke = await response.json();
      
      return {
        success: true,
        message: `😄 ${joke.setup}\n\n${joke.punchline}`,
        data: joke,
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to fetch joke',
        error: (error as Error).message,
      };
    }
  },
};

export default plugin;
```

### **3. Complex Plugin (Multiple Operations)**

```typescript
// src/plugins/plugins/translator.ts

import { Plugin, PluginContext, PluginResult } from '../types';

const plugin: Plugin = {
  metadata: {
    name: 'translator',
    description: 'Translate text to different languages',
    version: '1.0.0',
  },

  async execute(args: any, context: PluginContext): Promise<PluginResult> {
    // Parse: "translate 'hello' to spanish"
    const match = args.match(/translate ['"](.+?)['"] to (\w+)/i);
    
    if (!match) {
      return {
        success: false,
        message: 'Invalid format. Use: translate "text" to language',
        error: 'Invalid format',
      };
    }
    
    const [, text, targetLang] = match;
    
    // Use a translation API (e.g., LibreTranslate)
    const response = await fetch('https://libretranslate.de/translate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        q: text,
        source: 'en',
        target: targetLang.toLowerCase(),
      }),
    });
    
    const result = await response.json();
    
    return {
      success: true,
      message: `Translation: ${result.translatedText}`,
      data: result,
    };
  },
};

export default plugin;
```

---

## 🧪 **Testing Plugins**

### **Manual Testing**

1. Start the app: `npm run dev`
2. Ask Seven: "Remind me in 30 seconds to test"
3. Wait 30 seconds → Alert should appear!
4. Ask Seven: "What's the weather in Paris?"
5. Check console for plugin logs

### **Console Testing**

```javascript
// Open DevTools Console

// Get plugin manager
const { getPluginManager } = await import('./src/plugins/pluginManager.ts');
const pm = getPluginManager();

// List plugins
pm.getPluginList();
// ['reminder', 'weather', 'calculator']

// Test reminder
await pm.executePlugin('reminder', 'remind me in 5 seconds', { platform: 'web', userMessage: 'test' });

// Test weather
await pm.executePlugin('weather', 'New York', { platform: 'web', userMessage: 'test' });

// Test calculator
await pm.executePlugin('calculator', '25 * 48 + 100', { platform: 'web', userMessage: 'test' });
```

### **Unit Testing**

```typescript
import { getPluginManager } from './plugins/pluginManager';

describe('Plugin System', () => {
  it('should load plugins', async () => {
    const pm = getPluginManager();
    expect(pm.getPluginList().length).toBeGreaterThan(0);
  });

  it('should execute calculator plugin', async () => {
    const pm = getPluginManager();
    const result = await pm.executePlugin('calculator', '2 + 2', { platform: 'web', userMessage: 'test' });
    expect(result.success).toBe(true);
    expect(result.data.result).toBe(4);
  });
});
```

---

## 🚀 **Plugin Ideas**

Here are some plugin ideas you can implement:

1. **Todo List** - Add/remove/list todos
2. **Timer** - Set countdown timers
3. **Dictionary** - Look up word definitions
4. **Translator** - Translate text between languages
5. **News** - Fetch latest news headlines
6. **Joke** - Get random jokes
7. **Quote** - Inspirational quotes
8. **Dice** - Roll dice (e.g., "roll 2d6")
9. **Currency** - Convert currencies
10. **Unit Converter** - Convert units (miles to km, etc.)
11. **QR Code** - Generate QR codes
12. **Password** - Generate secure passwords
13. **Hash** - Hash text (MD5, SHA256, etc.)
14. **Base64** - Encode/decode base64
15. **Color** - Convert color formats (HEX, RGB, HSL)

---

## 📊 **Plugin Statistics**

View plugin usage in the console:

```javascript
// Get all plugins
const plugins = pluginManager.getAllPlugins();

console.log('Plugin Registry:');
plugins.forEach(p => {
  console.log(`- ${p.metadata.name} v${p.metadata.version}: ${p.metadata.description}`);
});
```

---

## 🔒 **Security Considerations**

### **Safe Plugins**
- Plugins run in browser context (no server-side execution)
- No file system access (web platform)
- Same-origin policy applies to API calls
- User must grant notification permissions

### **Plugin Validation**
- Plugins must implement the `Plugin` interface
- TypeScript ensures type safety
- Invalid plugins are logged and skipped

### **Disabling Plugins**
```typescript
// In plugin file
metadata: {
  name: 'plugin-name',
  enabled: false, // Disable plugin
}
```

---

## 🎉 **Summary**

Seven's plugin system provides:

✅ **Auto-discovery** - No manual registration  
✅ **AI routing** - LLM automatically routes to plugins  
✅ **Type-safe** - Full TypeScript support  
✅ **Extensible** - Easy to add new plugins  
✅ **Async execution** - Non-blocking plugin calls  
✅ **Context-aware** - Plugins receive platform & conversation context  
✅ **Error handling** - Graceful fallbacks  
✅ **3 built-in plugins** - Reminder, Weather, Calculator  

---

## 📝 **Next Steps**

1. Create your first custom plugin
2. Test it with Seven
3. Share your plugins with the community!

**Happy plugin development!** 🔌✨








