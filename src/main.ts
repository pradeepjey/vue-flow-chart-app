import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { VueQueryPlugin } from '@tanstack/vue-query'
import App from './App.vue'
import { createAppRouter } from './router'
import { queryClientConfig } from './lib/queryClient'
import './style.css'

const app = createApp(App)
app.use(createPinia())
app.use(createAppRouter())
app.use(VueQueryPlugin, { queryClientConfig })
app.mount('#app')
