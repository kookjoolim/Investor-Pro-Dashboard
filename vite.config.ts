import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  
  return {
    base: '/Investor-Pro-Dashboard/',
    server: {
      port: 3000,
      host: '0.0.0.0',
    },
    plugins: [react()],
    
    // 👇 여기가 핵심 수정 부분입니다!
    define: {
      'process.env.API_KEY': JSON.stringify(process.env.API_KEY || env.API_KEY),
      'process.env': {}, // 👈 이 줄을 꼭 추가해주세요! (앱이 죽는 것을 막아줍니다)
    },
    
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      }
    }
  };
});
