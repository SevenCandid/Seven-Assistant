/**
 * Tasks Plugin - Manage todo lists and tasks
 */

import { Plugin, PluginContext, PluginResult } from '../types';

interface Task {
  id: string;
  title: string;
  completed: boolean;
  createdAt: Date;
  completedAt?: Date;
  priority?: 'low' | 'medium' | 'high';
}

class TasksPlugin implements Plugin {
  name = 'tasks';
  description = 'Manage tasks and todos. Usage: "add task: <task>" or "show tasks" or "complete task <number>" or "clear completed tasks"';

  private tasks: Task[] = [];
  private readonly STORAGE_KEY = 'seven_tasks';

  constructor() {
    this.loadTasks();
  }

  private loadTasks(): void {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        this.tasks = parsed.map((t: any) => ({
          ...t,
          createdAt: new Date(t.createdAt),
          completedAt: t.completedAt ? new Date(t.completedAt) : undefined
        }));
        console.log('✅ Loaded', this.tasks.length, 'tasks');
      }
    } catch (error) {
      console.error('Failed to load tasks:', error);
    }
  }

  private saveTasks(): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.tasks));
      console.log('💾 Saved tasks');
    } catch (error) {
      console.error('Failed to save tasks:', error);
    }
  }

  async execute(args: string, context: PluginContext): Promise<PluginResult> {
    const lowerArgs = args.toLowerCase().trim();

    // Show tasks
    if (lowerArgs.includes('show') || lowerArgs.includes('list') || lowerArgs.includes('my tasks')) {
      const pending = this.tasks.filter(t => !t.completed);
      const completed = this.tasks.filter(t => t.completed);

      if (this.tasks.length === 0) {
        return {
          success: true,
          message: "You don't have any tasks. Try 'add task: your task here'",
        };
      }

      let message = '';

      if (pending.length > 0) {
        message += `📋 Pending Tasks (${pending.length}):\n`;
        pending.forEach((task, idx) => {
          const priority = task.priority === 'high' ? '🔴 ' : task.priority === 'medium' ? '🟡 ' : '';
          message += `${idx + 1}. ${priority}${task.title}\n`;
        });
      }

      if (completed.length > 0) {
        message += `\n✅ Completed (${completed.length}):\n`;
        completed.slice(-3).forEach((task, idx) => {
          message += `${idx + 1}. ${task.title}\n`;
        });
      }

      return {
        success: true,
        message: message.trim(),
        data: { pending, completed }
      };
    }

    // Complete a task
    if (lowerArgs.includes('complete') || lowerArgs.includes('done') || lowerArgs.includes('finish')) {
      const match = args.match(/(\d+)/);
      if (!match) {
        return {
          success: false,
          message: "Please specify which task to complete, like 'complete task 1'",
        };
      }

      const taskIndex = parseInt(match[1]) - 1;
      const pending = this.tasks.filter(t => !t.completed);

      if (taskIndex < 0 || taskIndex >= pending.length) {
        return {
          success: false,
          message: `Invalid task number. You have ${pending.length} pending task(s).`,
        };
      }

      const task = pending[taskIndex];
      task.completed = true;
      task.completedAt = new Date();
      this.saveTasks();

      return {
        success: true,
        message: `✓ Completed: "${task.title}"`,
        data: { task }
      };
    }

    // Clear completed tasks
    if (lowerArgs.includes('clear') && lowerArgs.includes('completed')) {
      const before = this.tasks.length;
      this.tasks = this.tasks.filter(t => !t.completed);
      const removed = before - this.tasks.length;
      this.saveTasks();

      return {
        success: true,
        message: `Cleared ${removed} completed task(s)`,
      };
    }

    // Delete all tasks
    if (lowerArgs.includes('delete all') || lowerArgs.includes('clear all')) {
      const count = this.tasks.length;
      this.tasks = [];
      this.saveTasks();

      return {
        success: true,
        message: `Deleted all ${count} task(s)`,
      };
    }

    // Add new task
    let title = args
      .replace(/add task:?|new task:?|task:?|todo:?|create task:?/gi, '')
      .trim();

    if (!title) {
      return {
        success: false,
        message: "Please provide a task description, like 'add task: finish report'",
      };
    }

    // Detect priority
    let priority: 'low' | 'medium' | 'high' | undefined;
    if (title.match(/urgent|asap|important|critical|high priority/i)) {
      priority = 'high';
      title = title.replace(/urgent|asap|important|critical|high priority/gi, '').trim();
    } else if (title.match(/medium priority|moderate/i)) {
      priority = 'medium';
      title = title.replace(/medium priority|moderate/gi, '').trim();
    }

    const task: Task = {
      id: `task-${Date.now()}`,
      title,
      completed: false,
      createdAt: new Date(),
      priority,
    };

    this.tasks.push(task);
    this.saveTasks();

    const priorityText = priority === 'high' ? ' (High Priority 🔴)' : priority === 'medium' ? ' (Medium Priority 🟡)' : '';
    return {
      success: true,
      message: `✓ Task added${priorityText}: "${title}"`,
      data: { task }
    };
  }
}

export default new TasksPlugin();







