import { createApp } from 'vue'
import { createPinia } from 'pinia'
import TDesign from 'tdesign-vue-next'
import router from '@/router/router'
import '@/assets/style.less'
import App from '@/App.vue'
import 'tdesign-vue-next/es/style/index.css'

const app = createApp(App)
const pinia = createPinia()

app.use(TDesign)
app.use(pinia) // 挂载 Pinia
app.use(router) // 挂载 Router

app.mount('#app')
