<template>
  <div class="game-ended">
    <h2 class="end-title">Oyun Bitti!</h2>
    <p class="winner-info">
      Kazanan: <strong>{{ winner || 'Yok' }}</strong>
    </p>

    <h3 class="end-title">Son Skorlar:</h3>
    <ul class="final-scores">
      <li v-for="(score, id) in finalScores" :key="id">
        {{ getPlayerNameById(id) }}: {{ score }} puan
      </li>
    </ul>

    <Button
      label="Lobiye Dön"
      icon="pi pi-sign-out"
      class="p-button-warning mt-3"
      @click="$emit('go-to-lobby')"
    />
  </div>
</template>

<script setup lang="ts">
import Button from 'primevue/button'

defineProps<{
  winner: string
  finalScores: Record<string, number>
  getPlayerNameById: (id: string) => string
}>()
</script>

<style scoped>
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

.mt-3 {
  margin-top: 1.5rem;
}
</style>
