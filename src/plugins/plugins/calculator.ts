/**
 * Calculator Plugin - Perform mathematical calculations
 */

import { Plugin, PluginContext, PluginResult } from '../types';

const plugin: Plugin = {
  metadata: {
    name: 'calculator',
    description: 'Perform mathematical calculations. Example: "calculate 25 * 48 + 100"',
    version: '1.0.0',
    author: 'Seven AI',
    enabled: true,
  },

  async execute(args: any, context: PluginContext): Promise<PluginResult> {
    try {
      let expression = typeof args === 'string' ? args : args.expression || args.query || '';
      
      // Clean up the expression
      expression = expression
        .replace(/[×x]/gi, '*')
        .replace(/[÷]/g, '/')
        .replace(/\^/g, '**')
        .trim();

      // Safety check - only allow numbers, operators, parentheses, and spaces
      if (!/^[\d\s+\-*/.()%**]+$/.test(expression)) {
        return {
          success: false,
          message: 'Invalid expression. Only numbers and basic operators (+, -, *, /, %, ^, parentheses) are allowed.',
          error: 'Invalid characters in expression',
        };
      }

      // Evaluate the expression
      // Using Function constructor is safer than eval for this use case
      const result = Function(`"use strict"; return (${expression})`)();

      if (!isFinite(result)) {
        return {
          success: false,
          message: 'Calculation resulted in infinity or invalid number.',
          error: 'Invalid result',
        };
      }

      // Format result
      const formatted = typeof result === 'number' 
        ? (Number.isInteger(result) ? result.toString() : result.toFixed(2))
        : result.toString();

      return {
        success: true,
        message: `${expression} = ${formatted}`,
        data: {
          expression,
          result,
          formatted,
        },
      };
    } catch (error) {
      return {
        success: false,
        message: `Calculation failed: ${(error as Error).message}`,
        error: (error as Error).message,
      };
    }
  },
};

export default plugin;








