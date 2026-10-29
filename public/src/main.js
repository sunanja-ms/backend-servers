import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import theme from './plugins/theme'
import './styles/main.css'

const app = createApp(App)
app.use(createPinia())
app.use(theme)
app.use(router)
app.mount('#app')
