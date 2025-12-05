import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // Rất quan trọng: Chỉ định thư mục public để Tailwind quét CSS
  publicDir: 'public', 
  
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  }
});