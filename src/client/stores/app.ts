import { ref } from 'vue'
import { defineStore } from 'pinia'

export const useAppStore = defineStore('app', () => {
  const savedTheme = localStorage.getItem('theme-mode')
  const isDarkMode = ref(savedTheme === 'dark')
  const mode = ref(savedTheme ? `${savedTheme}-mode` : 'light-mode')

  const initTheme = () => {
    // 如果没有本地缓存, 跟随系统
    if (!localStorage.getItem('theme-mode')) {
      if (
        window.matchMedia &&
        window.matchMedia('(prefers-color-scheme: dark)').matches
      ) {
        isDarkMode.value = true
        applyTheme('dark')
      } else {
        applyTheme('light')
      }
    } else {
      applyTheme(isDarkMode.value ? 'dark' : 'light')
    }
  }

  const toggleTheme = () => {
    isDarkMode.value = !isDarkMode.value
    const nextMode = isDarkMode.value ? 'dark' : 'light'
    applyTheme(nextMode)
  }

  const applyTheme = (theme: 'dark' | 'light') => {
    document.documentElement.setAttribute('theme-mode', theme)
    mode.value = `${theme}-mode`
    localStorage.setItem('theme-mode', theme)
  }

  return { isDarkMode, mode, initTheme, toggleTheme }
})
