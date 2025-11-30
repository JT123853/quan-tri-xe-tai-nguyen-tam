import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  
  // Đường dẫn tương đối để Electron tìm được file
  base: './', 
  
  build: {
    // Xuất file build ra thư mục 'dist'
    outDir: 'dist',
    // Xóa thư mục 'dist' cũ trước khi build
    emptyOutDir: true,
  }
});