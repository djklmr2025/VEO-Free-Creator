import { Buffer } from 'buffer';

// Helper function to safely read files
async function readFileIfExists(path: string): Promise<string> {
  try {
    const content = await global.workspace.fs.readFile(path);
    return Buffer.from(content).toString('utf-8');
  } catch (error) {
    console.warn(`Could not read file: ${path}`, error);
    return ''; // Return empty string if file doesn't exist or can't be read
  }
}

// Function to get a high-level overview of the project structure
async function getProjectStructure(): Promise<string[]> {
  try {
    const files = await global.workspace.fs.list_files('.');
    return files;
  } catch (error) {
    console.error('Error listing project files:', error);
    return [];
  }
}

// Main function to get the project context
export async function getProjectContext(): Promise<string> {
  const fileList = await getProjectStructure();

  // Prioritize key files for context
  const keyFiles = [
    'package.json',
    'vite.config.ts',
    'README.md',
    'App.tsx',
    'index.tsx',
    'services/geminiService.ts',
    'api/autopilot.ts',
  ];

  let contextString = '## Project Overview\n\n';
  contextString +=
    'This project appears to be a modern web application built with React (likely using Vite) and TypeScript. It includes client-side and server-side (serverless functions) components. Key features involve interactions with Google AI APIs (Gemini, Veo for video, Imagen for images) and a user authentication system.\n\n';

  contextString += '### Key Files & Their Purpose:\n\n';

  for (const filePath of keyFiles) {
    if (fileList.includes(filePath)) {
      const content = await readFileIfExists(filePath);
      if (content) {
        contextString += `--- FILE: ${filePath} ---\n`;
        // Provide a summary for specific files
        if (filePath === 'package.json') {
          try {
            const pkg = JSON.parse(content);
            contextString += `Dependencies: ${Object.keys(
              pkg.dependencies || {}
            ).join(', ')}\n`;
            contextString += `Dev Dependencies: ${Object.keys(
              pkg.devDependencies || {}
            ).join(', ')}\n\n`;
          } catch (e) {
            contextString += 'Could not parse package.json.\n\n';
          }
        } else if (filePath === 'App.tsx') {
          contextString +=
            'This is the main React component, likely handling the core UI and routing.\n\n';
        } else if (filePath === 'services/geminiService.ts') {
          contextString +=
            'This service encapsulates all interactions with the Google Gemini AI models.\n\n';
        } else {
          // For other files, add a snippet
          const snippet =
            content.length > 300 ? content.substring(0, 297) + '...' : content;
          contextString += snippet + '\n\n';
        }
      }
    }
  }

  contextString += '### Project File Tree:\n';
  contextString += fileList.join('\n');

  return contextString;
}