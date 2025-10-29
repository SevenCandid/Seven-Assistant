/**
 * Notes Plugin - Store and retrieve quick notes
 */

import { Plugin, PluginContext, PluginResult } from '../types';

interface Note {
  id: string;
  content: string;
  title?: string;
  createdAt: Date;
  tags?: string[];
}

// Internal state
const notes: Note[] = [];
const STORAGE_KEY = 'seven_notes';

function loadNotes(): void {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      notes.length = 0;
      notes.push(...parsed.map((n: any) => ({
        ...n,
        createdAt: new Date(n.createdAt)
      })));
      console.log('📝 Loaded', notes.length, 'notes');
    }
  } catch (error) {
    console.error('Failed to load notes:', error);
  }
}

function saveNotes(): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
    console.log('💾 Saved notes');
  } catch (error) {
    console.error('Failed to save notes:', error);
  }
}

// Load notes on module initialization
loadNotes();

const plugin: Plugin = {
  metadata: {
    name: 'notes',
    description: 'Store and retrieve quick notes. Usage: "take a note: <content>" or "show my notes" or "search notes for <keyword>"',
    version: '1.0.0',
    author: 'Seven AI',
    enabled: true,
  },

  async execute(args: string, context: PluginContext): Promise<PluginResult> {
    const lowerArgs = args.toLowerCase().trim();

    // List all notes
    if (lowerArgs.includes('show') || lowerArgs.includes('list') || lowerArgs.includes('all notes')) {
      if (notes.length === 0) {
        return {
          success: true,
          message: "You don't have any notes yet. Try saying 'take a note: your note content'",
        };
      }

      const notesList = notes
        .slice(-10) // Show last 10 notes
        .reverse()
        .map((note, idx) => {
          const date = note.createdAt.toLocaleDateString([], { 
            month: 'short', 
            day: 'numeric' 
          });
          const preview = note.content.substring(0, 50);
          return `${idx + 1}. [${date}] ${preview}${note.content.length > 50 ? '...' : ''}`;
        })
        .join('\n');

      return {
        success: true,
        message: `Here are your recent notes (${notes.length} total):\n\n${notesList}`,
        data: { notes: notes.slice(-10).reverse() }
      };
    }

    // Search notes
    if (lowerArgs.includes('search') || lowerArgs.includes('find')) {
      const query = args
        .replace(/search|find|notes?|for/gi, '')
        .trim()
        .toLowerCase();

      if (!query) {
        return {
          success: false,
          message: "Please specify what to search for, like 'search notes for meeting'",
        };
      }

      const matches = notes.filter(note =>
        note.content.toLowerCase().includes(query) ||
        note.title?.toLowerCase().includes(query)
      );

      if (matches.length === 0) {
        return {
          success: true,
          message: `No notes found containing "${query}"`,
        };
      }

      const results = matches
        .slice(-5)
        .reverse()
        .map((note, idx) => `${idx + 1}. ${note.content}`)
        .join('\n\n');

      return {
        success: true,
        message: `Found ${matches.length} note(s) containing "${query}":\n\n${results}`,
        data: { matches }
      };
    }

    // Delete last note
    if (lowerArgs.includes('delete') && (lowerArgs.includes('last') || lowerArgs.includes('recent'))) {
      if (notes.length === 0) {
        return {
          success: false,
          message: "No notes to delete",
        };
      }

      const deleted = notes.pop();
      saveNotes();

      return {
        success: true,
        message: `Deleted note: "${deleted!.content.substring(0, 50)}..."`,
      };
    }

    // Clear all notes
    if (lowerArgs.includes('clear') || lowerArgs.includes('delete all')) {
      const count = notes.length;
      notes.length = 0;
      saveNotes();

      return {
        success: true,
        message: `Cleared all ${count} notes`,
      };
    }

    // Create new note
    let content = args
      .replace(/take a note:?|note:?|save note:?|remember:?/gi, '')
      .trim();

    if (!content) {
      return {
        success: false,
        message: "Please provide note content, like 'take a note: buy groceries'",
      };
    }

    const note: Note = {
      id: `note-${Date.now()}`,
      content,
      createdAt: new Date(),
    };

    notes.push(note);
    saveNotes();

    return {
      success: true,
      message: `✓ Note saved: "${content.substring(0, 60)}${content.length > 60 ? '...' : ''}"`,
      data: { note }
    };
  },
};

export default plugin;

