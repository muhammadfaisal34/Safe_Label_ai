import path from 'node:path';
import { fileURLToPath } from 'node:url';

const projectDir = path.dirname(fileURLToPath(import.meta.url));

const nextConfig = {
  outputFileTracingRoot: path.join(projectDir, '..'),
};

export default nextConfig;
