import path from 'path';
import { fileURLToPath } from 'url';

// Calculate __filename and __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Export the constants
export { __filename, __dirname };
