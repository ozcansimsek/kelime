<template>
  <div class="game-in-progress">
    <div class="game-info">
      <p class="room-info">
        Oda adı: <span class="room-name">{{ roomName }}</span>
      </p>
      <p class="turn-info">
        Şu anda <strong>{{ currentPlayer }}</strong> oynuyor
      </p>
      <p class="letter-info">
        Harf: <strong>{{ currentLetter }}</strong>
      </p>
      <p class="timer-info" :class="{ danger: timer <= 5 }">
        Geçerli Süre: <strong>{{ timer }}</strong> saniye
      </p>
    </div>

    <div class="word-input-section">
      <form @submit.prevent="sendWord" class="word-form">
        <InputText
          v-model="word"
          class="word-input"
          placeholder="Kelime girin"
          :disabled="socketId !== currentPlayerId"
        />
        <Button
          label="Kelime Gönder"
          type="submit"
          class="submit-btn"
          :disabled="socketId !== currentPlayerId || word.trim() === ''"
        />
      </form>
      <p v-if="wordRejectedMessage" class="error">{{ wordRejectedMessage }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Button, InputText } from 'primevue'
import { ref, watch, defineProps, defineEmits } from 'vue'

const props = defineProps<{
  roomName: string
  currentPlayer: string
  currentPlayerId: string
  currentLetter: string
  timer: number
  wordRejectedMessage: string
  socketId: string
}>()

const emits = defineEmits<{
  (e: 'send-word', word: string): void
}>()

const word = ref('')

watch(word, () => {
  // Clear rejection message on input change
  if (props.wordRejectedMessage) {
    // If needed, emit an event to clear rejection on input (optional)
  }
})

const sendWord = () => {
  if (word.value.trim() === '') return
  emits('send-word', word.value.trim())
  word.value = ''
}
</script>

<style scoped>
.game-in-progress {
  background-color: #ffffff;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
}

.game-info {
  margin-bottom: 15px;
}

.turn-info,
.letter-info,
.timer-info {
  font-size: 1.2rem;
  color: #444;
}

.word-input-section {
  margin-top: 20px;
}

.word-form {
  display: flex;
  justify-content: center;
  gap: 10px;
}

.word-input {
  width: 250px;
}

.error {
  color: red;
  font-size: 1rem;
  margin-top: 10px;
}

.timer-info.danger {
  color: red;
  font-weight: bold;
}
</style>
