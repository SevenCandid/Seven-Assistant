# Contributing to Seven AI Assistant

Thank you for your interest in contributing to Seven AI Assistant! This document provides guidelines and instructions for contributing.

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/your-username/seven-ai-assistant.git`
3. Install dependencies: `npm install`
4. Create a branch: `git checkout -b feature/your-feature-name`

## Development Workflow

1. Make your changes
2. Test thoroughly on all platforms (web, desktop, mobile if possible)
3. Ensure code follows the existing style
4. Commit your changes with clear commit messages
5. Push to your fork
6. Open a Pull Request

## Code Style

- Use TypeScript for all new code
- Follow the existing code structure
- Use meaningful variable and function names
- Add comments for complex logic
- Keep functions small and focused

## Project Structure

- `src/core/` - Core functionality (LLM, speech, actions, utils)
- `src/ui/` - React components and hooks
- `electron/` - Electron-specific code
- `public/` - Static assets

## Adding New Features

### Adding a New Action

1. Add the action type to `src/core/actions.ts`:
   ```typescript
   case 'your-action':
     return await this.yourAction(action.param);
   ```

2. Implement the handler method:
   ```typescript
   private async yourAction(param: string): Promise<ActionResult> {
     // Implementation
   }
   ```

3. Update the system prompt in `src/core/llm.ts` to inform the AI

### Adding a New Component

1. Create the component in `src/ui/components/YourComponent.tsx`
2. Follow the existing component structure
3. Use TypeScript interfaces for props
4. Apply no border radius styling (per user preference)

### Adding a New Hook

1. Create the hook in `src/ui/hooks/useYourHook.ts`
2. Follow React hooks best practices
3. Add TypeScript types for return values

## Testing

Before submitting a PR, test:

- [ ] Web version (`npm run dev`)
- [ ] Electron version (`npm run electron:start`)
- [ ] Build process (`npm run build`)
- [ ] TypeScript compilation (no errors)
- [ ] All features work as expected

## Pull Request Guidelines

1. **Title**: Use clear, descriptive titles
2. **Description**: Explain what changes you made and why
3. **Screenshots**: Add screenshots for UI changes
4. **Testing**: Describe how you tested the changes
5. **Breaking Changes**: Clearly mark any breaking changes

## Reporting Issues

When reporting issues, include:

- Clear description of the problem
- Steps to reproduce
- Expected vs actual behavior
- Platform (web/electron/capacitor)
- Browser/OS version
- Error messages or console logs

## Feature Requests

Feature requests are welcome! Please:

- Check if the feature already exists or is requested
- Explain the use case
- Describe the expected behavior
- Consider implementation complexity

## Code of Conduct

- Be respectful and inclusive
- Provide constructive feedback
- Help others learn and grow
- Focus on what's best for the project

## Questions?

If you have questions, feel free to:

- Open an issue
- Start a discussion
- Reach out to maintainers

Thank you for contributing! 🎉



