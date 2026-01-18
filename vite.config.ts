import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // 환경 변수 로드
  const env = loadEnv(mode, '.', '');
  
  return {
    // 1. 배포 주소 설정 (이게 없어서 화면이 안 나왔던 겁니다!)
    base: '/Investor-Pro-Dashboard/',

    server: {
      port: 3000,
      host: '0.0.0.0',
    },
    plugins: [react()],
    
    // 2. API 키 연결 설정
    define: {
      // 깃허브(process.env) 또는 로컬(env)에서 API_KEY를 찾아서 넣어줍니다.
      'process.env.API_KEY': JSON.stringify(process.env.API_KEY || env.API_KEY),
    },
    
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      }
    }
  };
});
