import { createRouter, createWebHistory } from 'vue-router'
import EntranceView from '../views/EntranceView.vue'
import GameView from '../views/GameView.vue'

export default createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', component: EntranceView },
    { path: '/game', component: GameView },
  ],
})
