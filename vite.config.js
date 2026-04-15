import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  // 必须加上这一行，确保手机能找到相对路径下的资源
  base: './', 
  plugins: [vue()],
})