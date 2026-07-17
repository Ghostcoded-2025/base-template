import './assets/main.css'

import { library } from '@fortawesome/fontawesome-svg-core'
import { faRightToBracket } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { ViteSSG } from 'vite-ssg'
import { createPinia } from 'pinia'

import App from './App.vue'
import { routes, setupRouterGuards } from './router'

library.add(faRightToBracket)

export const createApp = ViteSSG(
  App,
  { routes },
  ({ app, router }) => {
    setupRouterGuards(router)
    app.component('FontAwesomeIcon', FontAwesomeIcon)
    app.use(createPinia())
  },
)
