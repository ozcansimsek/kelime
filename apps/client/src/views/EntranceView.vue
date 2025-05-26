<template>
  <div class="lobby-container">
    <h1>Kelime Oyunu</h1>

    <form @submit.prevent="joinGame">
      <InputText v-model="username" placeholder="Kullanıcı adın" size="large" required />
      <InputText v-model="room" placeholder="Oda adı" size="large" required />
      <Button type="submit">Oyuna Katıl</Button>
    </form>

    <p v-if="errorMessage" class="error">{{ errorMessage }}</p>
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { socket } from '../socket'
import { InputText } from 'primevue'
import Button from 'primevue/button'
// Setup router and socket
const router = useRouter()

// State
const username = ref('')
const room = ref('')
const errorMessage = ref('')

// Handle server error message
socket.on('errorMessage', (message: string) => {
  errorMessage.value = message
  setTimeout(() => {
    errorMessage.value = ''
  }, 3000)
})

// Navigate to game after successful join
socket.on('joinSuccess', ({ username, room }) => {
  router.push({ path: '/game', state: { username, room } })
})

// Form submit handler
function joinGame() {
  if (username.value.trim() && room.value.trim()) {
    socket.emit('joinRoom', {
      username: username.value.trim(),
      room: room.value.trim(),
    })
  }
}
</script>

<style scoped>
.lobby-container {
  max-width: 400px;
  margin: 3rem auto;
  padding: 1rem;
  text-align: center;
  font-family: sans-serif;
}

input {
  display: block;
  width: 100%;
  padding: 0.5rem;
  margin: 0.5rem 0;
}

button {
  padding: 0.5rem 1rem;
  margin-top: 1rem;
}

.error {
  color: red;
  margin-top: 1rem;
}
</style>
