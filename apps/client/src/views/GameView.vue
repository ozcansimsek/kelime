<template>
  <div class="game-container">
    <h1 class="title">Kelime Oyunu</h1>

    <div v-if="!gameOver">
      <!-- Game not started section -->
      <LobbyView
        v-if="!gameStarted"
        :roomName="roomName"
        :username="username"
        @start-game="startGame"
      />

      <!-- Game in progress section -->
      <div v-if="gameStarted" class="game-in-progress">
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
              :disabled="socket.id !== currentPlayerId"
            />
            <button
              type="submit"
              class="submit-btn"
              :disabled="socket.id !== currentPlayerId || word.trim() === ''"
            >
              Kelime Gönder
            </button>
          </form>
          <p v-if="wordRejectedMessage" class="error">{{ wordRejectedMessage }}</p>
        </div>
      </div>

      <!-- Player list -->
      <div class="player-list">
        <h3>Oyuncular:</h3>
        <ul>
          <li v-for="player in playerList" :key="player.id" class="player-item">
            <span class="player-name">{{ player.username }}</span> - Puan:
            <span class="player-score">{{ scores[player.id] || 0 }}</span>
          </li>
        </ul>
      </div>
    </div>
    <!-- Game ended section -->
    <GameOverView
      v-if="gameOver"
      :winner="winner"
      :finalScores="finalScores"
      :getPlayerNameById="getPlayerNameById"
      @go-to-lobby="goToLobby"
    />
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { socket } from '../socket'
import { InputText } from 'primevue'
import GameOverView from './GameOverView.vue'
import LobbyView from './LobbyView.vue'

const router = useRouter()

// Check for navigation state
// const state = history.state
// if (!state?.username || !state?.room) {
//   router.push('/')
// }

const username = ref('')
const roomName = ref('')

// Game states
const gameStarted = ref(false)
const currentLetter = ref('')
const currentPlayer = ref('')
const currentPlayerId = ref('')
const timer = ref(20)
const word = ref('')
const wordRejectedMessage = ref('')
const playerList = ref<Array<{ id: string; username: string }>>([])
const scores = ref<Record<string, number>>({})
const gameOver = ref(false)
const winner = ref('')
const finalScores = ref({})

// Emit game start
const startGame = () => {
  socket.emit('startGame', roomName.value)
}

const goToLobby = () => {
  router.push('/')
}

onMounted(() => {
  socket.emit('requestRoomInfo')
  socket.on('roomInfo', onRoomInfoReceived)

  socket.on('gameStarted', onGameStarted)
  socket.on('roundStarted', onRoundStarted)
  socket.on('timerUpdate', onTimerUpdate)
  socket.on('turnChanged', onTurnChanged)
  socket.on('wordRejected', onWordRejected)
  socket.on('playerList', onPlayerList)
  socket.on('newWord', onNewWord)
  socket.on('gameOver', onGameOver)
})

onBeforeUnmount(() => {
  socket.off('roomInfo', onRoomInfoReceived)
  socket.off('gameStarted', onGameStarted)
  socket.off('roundStarted', onRoundStarted)
  socket.off('timerUpdate', onTimerUpdate)
  socket.off('turnChanged', onTurnChanged)
  socket.off('wordRejected', onWordRejected)
  socket.off('playerList', onPlayerList)
  socket.off('newWord', onNewWord)
  socket.off('gameOver', onGameOver)
})

function onRoomInfoReceived(data: { username: string; room: string }) {
  username.value = data.username
  roomName.value = data.room
}

function onGameStarted(firstPlayerId: string) {
  gameStarted.value = true
  currentPlayerId.value = firstPlayerId
  currentPlayer.value = getPlayerNameById(firstPlayerId)
}
function onRoundStarted(data: { letter: string }) {
  currentLetter.value = data.letter
  timer.value = 20
}
function onTimerUpdate(data: { timeLeft: number }) {
  timer.value = data.timeLeft
}
function onTurnChanged(nextPlayerId: string) {
  currentPlayerId.value = nextPlayerId
  currentPlayer.value = getPlayerNameById(nextPlayerId)
}

function onWordRejected(message: string) {
  wordRejectedMessage.value = message
  setTimeout(() => {
    wordRejectedMessage.value = ''
  }, 3000)
}
function onPlayerList(players: Array<{ id: string; username: string }>) {
  playerList.value = players
}
function onNewWord(data: { word: string; by: string; scores: Record<string, number> }) {
  scores.value = data.scores
}
function onGameOver(data: { winner: string; scores: Record<string, number> }) {
  gameOver.value = true
  winner.value = data.winner
  finalScores.value = data.scores
}

// Submit word
const sendWord = () => {
  if (word.value.trim() === '') return
  socket.emit('sendWord', { room: roomName.value, word: word.value.trim() })
  word.value = ''
}

// Helper function to get player name by ID
function getPlayerNameById(id: string) {
  const player = playerList.value.find((player) => player.id === id)
  return player ? player.username : ''
}
</script>

<style scoped>
.game-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
  font-family: 'Arial', sans-serif;
  background-color: #f4f7f6;
  border-radius: 10px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
}

.title {
  text-align: center;
  color: #333;
  font-size: 2rem;
  margin-bottom: 20px;
}

.game-start,
.game-in-progress {
  text-align: center;
  margin-bottom: 30px;
}

.info-text {
  font-size: 1.2rem;
  color: #555;
}

.room-info,
.username-info {
  font-size: 1rem;
  color: #777;
}

.room-name,
.username {
  font-weight: bold;
}

.start-btn {
  padding: 10px 20px;
  background-color: #28a745;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: 1.1rem;
  transition: background-color 0.3s;
}

.start-btn:hover {
  background-color: #218838;
}

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
  padding: 10px;
  font-size: 1rem;
  border: 1px solid #ccc;
  border-radius: 5px;
}

.submit-btn {
  padding: 10px 15px;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: 1.1rem;
  transition: background-color 0.3s;
}

.submit-btn:hover {
  background-color: #0056b3;
}

.error {
  color: red;
  font-size: 1rem;
  margin-top: 10px;
}

.player-list {
  margin-top: 30px;
}

.player-list h3 {
  text-align: center;
  font-size: 1.3rem;
  color: #333;
}

.player-item {
  font-size: 1.1rem;
  color: #555;
  margin: 5px 0;
}

.player-name {
  font-weight: bold;
}

.player-score {
  font-weight: normal;
  color: #007bff;
}

.game-ended {
  text-align: center;
  padding: 30px;
  background-color: #fff3cd;
  border: 2px solid #ffeeba;
  border-radius: 10px;
  margin-top: 30px;
}

.end-title {
  font-size: 2rem;
  color: #856404;
}

.winner-info {
  font-size: 1.2rem;
  margin: 1rem 0;
  color: #6c757d;
}

.final-scores {
  list-style: none;
  padding: 0;
  font-size: 1.1rem;
  color: #333;
}

.back-btn {
  margin-top: 20px;
  padding: 10px 20px;
  background-color: #ffc107;
  color: #212529;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-weight: bold;
}

.timer-info.danger {
  color: red;
  font-weight: bold;
}
</style>
