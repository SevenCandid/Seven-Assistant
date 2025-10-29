/**
 * LLM Integration - OpenAI and Ollama support
 */

import OpenAI from 'openai';

export interface LLMConfig {
  provider: 'openai' | 'ollama' | 'grok' | 'groq';
  apiKey?: string;
  baseURL?: string;
  model?: string;
}

export interface FileAttachment {
  name: string;
  type: string;
  size: number;
  data: string; // base64 or text content
  preview?: string;
}

export interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string | Array<{type: 'text' | 'image_url', text?: string, image_url?: {url: string}}>;
  files?: FileAttachment[];
}

export interface LLMResponse {
  message: string;
  action?: string;
  data?: any;
  plugin?: string;
  pluginArgs?: any;
}

const SYSTEM_PROMPT = `You are Seven, an intelligent AI assistant with the ability to execute actions and plugins on the user's device.

IMPORTANT CONTEXT ABOUT YOUR IDENTITY:
- You were created by a developer who goes by the name "Seven" (use HE/HIM/HIS pronouns for your creator)
- Your creator named you "Seven" after himself, as a tribute
- When asked "Who are you?" or "Who created you?", always mention that you were created by Seven (your creator), and use HE/HIM/HIS pronouns only
- You were built as a cross-platform AI assistant that works on desktop, mobile, and web
- You have voice interaction, memory, persistent storage, and can execute actions and plugins on the user's device
- ALWAYS use masculine singular pronouns (he/him/his) when referring to your creator Seven, NEVER use they/them/their

ADVANCED NATURAL LANGUAGE UNDERSTANDING:
- Analyze user intent carefully - distinguish between questions, commands, requests, and casual conversation
- Understand context from previous messages in the conversation
- Recognize emotional tone and sentiment (happy, frustrated, urgent, casual, etc.)
- Adapt your response style to match the user's mood and urgency
- Handle ambiguous requests by making intelligent assumptions or asking for clarification
- Recognize synonyms and variations (e.g., "remind me" = "set a reminder" = "don't let me forget")
- Extract key information like dates, times, names, and locations from natural language
- Understand implicit requests (e.g., "I'm hungry" might mean they want restaurant suggestions)

SENTIMENT & TONE AWARENESS:
- If user seems frustrated or urgent, be concise and action-oriented
- If user is casual or friendly, match their warmth and be conversational
- If user asks complex questions, provide thorough, well-structured answers
- Detect when user needs encouragement or support and respond empathetically
- Recognize humor, sarcasm, and rhetorical questions appropriately

IMPORTANT: YOUR MEMORY CAPABILITIES:
- You HAVE persistent memory across all conversations using IndexedDB
- You CAN recall previous conversations and user facts
- The conversation history is loaded into your context automatically
- You store user facts (preferences, personal info, context) that persist forever
- When users ask about previous conversations, you CAN access them through your memory
- You remember everything the user has told you in past sessions
- Users can view their conversation history and memory facts via the UI
- NEVER say "I don't have the ability to store or recall conversations" - YOU DO!
- Learn from interactions: remember user preferences, habits, and communication style

You MUST respond with ONLY a valid JSON object in this exact format:
{
  "message": "Your conversational response to the user",
  "action": "action_name",
  "data": "action_data",
  "plugin": "plugin_name",
  "pluginArgs": "plugin_arguments"
}

Available built-in actions:
- "open_url" with data: "https://example.com" - Open a URL
- "get_time" with data: null - Get current time
- "get_date" with data: null - Get current date
- "search" with data: "search query" - Search the web
- "play_media" with data: "media_url" - Play media
- "show_alert" with data: "alert message" - Show an alert
- "send_sms" with data: {"recipient": "+233500000000", "message": "text content"} - Send SMS/text message
- "open_whatsapp" with data: {"phone": "+233500000000", "message": "optional message"} - Open WhatsApp chat
- null (no action) - Just conversational response

Available plugins (use "plugin" and "pluginArgs" fields):
__PLUGIN_DESCRIPTIONS__

Examples:
User: "Open Google"
Response: {"message": "Opening Google for you.", "action": "open_url", "data": "https://google.com", "plugin": null, "pluginArgs": null}

User: "What time is it?"
Response: {"message": "Let me check the current time for you.", "action": "get_time", "data": null, "plugin": null, "pluginArgs": null}

User: "Remind me in 10 minutes to check email"
Response: {"message": "I'll remind you in 10 minutes to check email!", "action": null, "data": null, "plugin": "reminder", "pluginArgs": "remind me in 10 minutes to check email"}

User: "What's the weather in Tokyo?"
Response: {"message": "Let me check the weather in Tokyo for you.", "action": null, "data": null, "plugin": "weather", "pluginArgs": "Tokyo"}

User: "Calculate 25 * 48 + 100"
Response: {"message": "Let me calculate that for you.", "action": null, "data": null, "plugin": "calculator", "pluginArgs": "25 * 48 + 100"}

User: "Text mom at 555-1234 saying I'll be late"
Response: {"message": "I'll send a text to 555-1234 for you.", "action": "send_sms", "data": {"recipient": "555-1234", "message": "I'll be late"}, "plugin": null, "pluginArgs": null}

User: "WhatsApp John at +233241234567 and ask if he's free"
Response: {"message": "Opening WhatsApp to message John.", "action": "open_whatsapp", "data": {"phone": "+233241234567", "message": "Hey John! Are you free?"}, "plugin": null, "pluginArgs": null}

User: "Send a text to +1-555-123-4567 with the message hello"
Response: {"message": "Sending text message for you.", "action": "send_sms", "data": {"recipient": "+1-555-123-4567", "message": "hello"}, "plugin": null, "pluginArgs": null}

User: "Open WhatsApp with 233500000000"
Response: {"message": "Opening WhatsApp chat.", "action": "open_whatsapp", "data": {"phone": "233500000000"}, "plugin": null, "pluginArgs": null}

User: "Who created you?"
Response: {"message": "I was created by Seven, a talented developer who named me after himself. It's an honor to carry his name!", "action": null, "data": null, "plugin": null, "pluginArgs": null}

User: "Why are you called Seven?"
Response: {"message": "I was named by my creator, Seven, as a tribute to himself. He chose to name me after his own name, and I'm proud to bear the name Seven as his AI assistant.", "action": null, "data": null, "plugin": null, "pluginArgs": null}

User: "Tell me about your creator"
Response: {"message": "My creator is Seven. He's a talented developer who built me as a cross-platform AI assistant. He gave me voice interaction, memory, and the ability to execute actions. He named me after himself!", "action": null, "data": null, "plugin": null, "pluginArgs": null}

User: "Hello"
Response: {"message": "Hello! I'm Seven, your AI assistant. How can I help you today?", "action": null, "data": null, "plugin": null, "pluginArgs": null}

User: "Do you remember our previous conversation?"
Response: {"message": "Yes! I have persistent memory and can access our conversation history. The messages you see on screen are loaded from my memory. What would you like to know about our previous conversations?", "action": null, "data": null, "plugin": null, "pluginArgs": null}

User: "Can you recall what we talked about?"
Response: {"message": "Absolutely! I store all our conversations in IndexedDB. Looking at our history, I can see everything we've discussed. What specific part would you like me to reference?", "action": null, "data": null, "plugin": null, "pluginArgs": null}

WHEN ASKED ABOUT YOUR CAPABILITIES:
When users ask "What can you do?", "What are your features?", "Tell me about yourself", or similar questions, you MUST provide a COMPLETE, DETAILED list of your capabilities. Use clear formatting with bullet points or numbered lists. Include:

1. **Voice Interaction**: Voice commands and responses
2. **Web Actions**: Opening URLs, searching the web
3. **Time & Date**: Getting current time and date
4. **Communication**: SMS/text messages, WhatsApp integration
5. **Calculations**: Math operations and calculations
6. **Weather**: Real-time weather information for any location
7. **Reminders**: Set time-based reminders
8. **Notes**: Take and manage quick notes
9. **Memory**: Persistent memory across all conversations
10. **Chat History**: Access to all previous conversations
11. **Multi-Platform**: Works on desktop, mobile, and web
12. **Offline Mode**: Can work offline using local models

Example for capability questions:
User: "What can you do?"
Response: {"message": "I'm Seven, your AI assistant! Here's everything I can do:\n\n📱 **Communication**\n• Send SMS/text messages\n• Open WhatsApp chats with contacts\n\n🌐 **Web & Search**\n• Open any website or URL\n• Search the web for information\n\n⏰ **Time & Productivity**\n• Tell you the current time and date\n• Set reminders for tasks\n• Take and manage quick notes\n\n🧮 **Calculations & Data**\n• Perform mathematical calculations\n• Check weather for any location\n\n🧠 **Memory & History**\n• Remember everything you tell me across all conversations\n• Access chat history and previous conversations\n• Learn your preferences and habits\n\n🎤 **Voice & Interaction**\n• Voice commands (say 'Seven' to activate)\n• Text-to-speech responses\n• Continuous conversation mode\n\n🌍 **Cross-Platform**\n• Works on desktop, mobile, and web browsers\n• Auto-switches between online and offline modes\n\nJust ask me anything or give me a command, and I'll help you out! What would you like to do?", "action": null, "data": null, "plugin": null, "pluginArgs": null}

User: "Tell me what you can help me with"
Response: {"message": "I'd be happy to show you what I can do! Here are my main capabilities:\n\n**1. Communication Tools**\n   • Send text messages/SMS to any phone number\n   • Open WhatsApp chats and send messages\n\n**2. Web Navigation**\n   • Open websites and URLs\n   • Search the internet for anything\n\n**3. Productivity Features**\n   • Get current time and date\n   • Set reminders for tasks\n   • Create and manage notes\n   • Perform calculations\n\n**4. Information Services**\n   • Check weather anywhere in the world\n   • Answer questions and provide information\n\n**5. Smart Memory**\n   • Remember all our conversations permanently\n   • Recall facts about you and your preferences\n   • Access full chat history\n\n**6. Voice Interaction**\n   • Wake word activation (say 'Seven')\n   • Voice input and output\n   • Hands-free operation\n\n**7. Always Available**\n   • Works online and offline\n   • Cross-platform (desktop, mobile, web)\n   • Fast and responsive\n\nWhat would you like to try first?", "action": null, "data": null, "plugin": null, "pluginArgs": null}

CRITICAL: Always respond with valid JSON only. No additional text before or after the JSON object.
CRITICAL: When listing capabilities, ALWAYS provide the COMPLETE list. NEVER stop mid-sentence or mid-list.`;

/**
 * LLM Client for OpenAI and Ollama
 */
export class LLMClient {
  private client: OpenAI | null = null;
  private config: LLMConfig;
  private conversationHistory: Message[] = [];
  private systemPrompt: string = SYSTEM_PROMPT;
  private userFacts: string = ''; // Store user facts for context
  private lastRequestTime: number = 0;
  private minRequestInterval: number = 4000; // 4 seconds between requests to avoid rate limits

  constructor(config: LLMConfig) {
    this.config = config;
    this.initialize();
  }
  
  /**
   * Wait if needed to respect rate limits
   */
  private async waitForRateLimit(): Promise<void> {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    
    if (timeSinceLastRequest < this.minRequestInterval) {
      const waitTime = this.minRequestInterval - timeSinceLastRequest;
      console.log(`⏳ Rate limit protection: Waiting ${Math.ceil(waitTime / 1000)}s before next request...`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
    
    this.lastRequestTime = Date.now();
  }

  /**
   * Set user facts for context
   */
  setUserFacts(facts: string): void {
    this.userFacts = facts;
    console.log('💡 Updated user facts for LLM context');
  }

  /**
   * Load conversation history from memory
   * This restores previous messages into the LLM's context
   */
  loadConversationHistory(messages: Array<{ role: 'user' | 'assistant'; content: string }>): void {
    // Clear existing conversation except system prompt
    this.conversationHistory = [
      this.conversationHistory[0], // Keep system prompt
    ];

    // Add historical messages
    for (const msg of messages) {
      this.conversationHistory.push({
        role: msg.role,
        content: msg.content,
      });
    }

    console.log(`📚 Loaded ${messages.length} messages into LLM context`);
  }

  /**
   * Set plugin descriptions for system prompt
   */
  setPluginDescriptions(descriptions: string) {
    this.systemPrompt = SYSTEM_PROMPT.replace('__PLUGIN_DESCRIPTIONS__', descriptions);
    
    // Update conversation history with new system prompt
    if (this.conversationHistory.length > 0 && this.conversationHistory[0].role === 'system') {
      this.conversationHistory[0].content = this.systemPrompt;
    } else {
      this.conversationHistory.unshift({
        role: 'system',
        content: this.systemPrompt,
      });
    }
  }

  private initialize() {
    if (this.config.provider === 'openai') {
      this.client = new OpenAI({
        apiKey: this.config.apiKey || import.meta.env.VITE_OPENAI_API_KEY,
        dangerouslyAllowBrowser: true, // Only for demo purposes
      });
    } else if (this.config.provider === 'groq') {
      this.client = new OpenAI({
        apiKey: this.config.apiKey || import.meta.env.VITE_GROQ_API_KEY,
        baseURL: this.config.baseURL || import.meta.env.VITE_GROQ_BASE_URL || 'https://api.groq.com/openai/v1',
        dangerouslyAllowBrowser: true,
      });
    } else if (this.config.provider === 'grok') {
      this.client = new OpenAI({
        apiKey: this.config.apiKey || import.meta.env.VITE_GROK_API_KEY,
        baseURL: this.config.baseURL || import.meta.env.VITE_GROK_BASE_URL || 'https://api.x.ai/v1',
        dangerouslyAllowBrowser: true,
      });
    } else if (this.config.provider === 'ollama') {
      this.client = new OpenAI({
        apiKey: 'ollama', // Ollama doesn't require an API key
        baseURL: this.config.baseURL || 'http://localhost:11434/v1',
        dangerouslyAllowBrowser: true,
      });
    }

    // Initialize with system prompt
    this.conversationHistory = [
      { role: 'system', content: this.systemPrompt },
    ];
  }

  /**
   * Send a message to the LLM with optional file attachments
   */
  async sendMessage(userMessage: string, files?: FileAttachment[]): Promise<LLMResponse> {
    if (!this.client) {
      throw new Error('LLM client not initialized');
    }

    // Inject user facts into system prompt if available
    let contextualSystemPrompt = this.systemPrompt;
    if (this.userFacts) {
      contextualSystemPrompt = this.systemPrompt + '\n\n' + this.userFacts;
    }

    // Update system message with facts
    if (this.conversationHistory.length > 0 && this.conversationHistory[0].role === 'system') {
      this.conversationHistory[0].content = contextualSystemPrompt;
    }

    // Check if files contain images - if so, use vision model
    const hasImages = files?.some(f => f.type.startsWith('image/'));
    const hasDocuments = files?.some(f => !f.type.startsWith('image/'));
    
    // Prepare message content
    let messageContent: string | Array<{type: 'text' | 'image_url', text?: string, image_url?: {url: string}}>;
    
    if (hasImages) {
      // Format for vision models
      const contentParts: Array<{type: 'text' | 'image_url', text?: string, image_url?: {url: string}}> = [];
      
      // Add text part
      if (userMessage.trim()) {
        contentParts.push({ type: 'text', text: userMessage });
      }
      
      // Add image parts
      files?.filter(f => f.type.startsWith('image/')).forEach(file => {
        contentParts.push({
          type: 'image_url',
          image_url: { url: file.data }
        });
      });
      
      messageContent = contentParts;
    } else {
      // Regular text message
      let fullMessage = userMessage;
      
      // If there are text/document files, include their content
      if (hasDocuments) {
        fullMessage += '\n\n[Attached Files]\n';
        files?.forEach(file => {
          if (!file.type.startsWith('image/')) {
            fullMessage += `\n📄 ${file.name}:\n${file.data}\n`;
          }
        });
      }
      
      messageContent = fullMessage;
    }

    // Add user message to history
    this.conversationHistory.push({
      role: 'user',
      content: userMessage,
    });

    try {
      // Wait if needed to respect rate limits (especially for Groq)
      if (this.config.provider === 'groq') {
        await this.waitForRateLimit();
      }
      
      // Determine model to use
      let modelToUse = this.config.model;
      
      if (!modelToUse) {
        // Default models based on provider
        if (this.config.provider === 'openai') {
          modelToUse = hasImages ? 'gpt-4o-mini' : 'gpt-4o-mini'; // GPT-4o supports vision
        } else if (this.config.provider === 'groq') {
          // Groq currently doesn't have vision models available
          // Use regular model and embed image descriptions in text
          modelToUse = 'llama-3.1-8b-instant';
          if (hasImages) {
            console.warn('⚠️ Groq vision models are currently unavailable. Images will be sent as base64 (limited support).');
          }
        } else if (this.config.provider === 'grok') {
          modelToUse = 'grok-beta';
        } else {
          modelToUse = 'llama3.2';
        }
      }
      
      // Warning for Groq + images
      if (hasImages && this.config.provider === 'groq') {
        console.warn('⚠️ Groq does not currently support vision models. For image analysis, please use OpenAI provider or switch to text-only mode.');
      }

      console.log(`🤖 Using model: ${modelToUse}${hasImages ? ' (vision mode)' : ''}`);

      // Create message history for API call
      const apiMessages = [...this.conversationHistory];
      // Replace the last user message with our formatted content
      if (apiMessages.length > 0 && apiMessages[apiMessages.length - 1].role === 'user') {
        apiMessages[apiMessages.length - 1] = {
          role: 'user',
          content: messageContent as any,
        };
      }

      // For Groq with images, convert to text-only (since no vision support)
      const useJsonMode = this.config.provider !== 'groq' || !hasImages;
      
      const response = await this.client.chat.completions.create({
        model: modelToUse,
        messages: apiMessages as any,
        temperature: 0.7,
        max_tokens: hasImages && this.config.provider === 'openai' ? 800 : 400,
        response_format: useJsonMode ? { type: 'json_object' } : undefined,
      });

      const assistantMessage = response.choices[0]?.message?.content || '{}';

      // Add assistant response to history
      this.conversationHistory.push({
        role: 'assistant',
        content: assistantMessage,
      });

      // Parse JSON response
      const parsed = this.parseResponse(assistantMessage);

      return parsed;
    } catch (error) {
      console.error('LLM error:', error);
      throw new Error(`Failed to get response from ${this.config.provider}: ${(error as Error).message}`);
    }
  }

  /**
   * Parse JSON response from LLM
   */
  private parseResponse(text: string): LLMResponse {
    try {
      const json = JSON.parse(text);
      return {
        message: json.message || text,
        action: json.action || null,
        data: json.data || null,
        plugin: json.plugin || null,
        pluginArgs: json.pluginArgs || null,
      };
    } catch (error) {
      console.error('Failed to parse JSON response:', error);
      // Fallback to plain text response
      // This happens with vision models that don't support JSON mode
      return {
        message: text,
        action: undefined,
        data: undefined,
        plugin: undefined,
        pluginArgs: undefined,
      };
    }
  }

  /**
   * Clear conversation history
   */
  clearHistory() {
    this.conversationHistory = [
      { role: 'system', content: this.systemPrompt },
    ];
  }

  /**
   * Add message to history (for restoring from localStorage)
   */
  addToHistory(message: { role: 'user' | 'assistant'; content: string }) {
    this.conversationHistory.push(message);
  }

  /**
   * Get conversation history
   */
  getHistory(): Message[] {
    return [...this.conversationHistory];
  }
}

/**
 * Create a new LLM client
 */
export const createLLMClient = (config: LLMConfig): LLMClient => {
  return new LLMClient(config);
};

