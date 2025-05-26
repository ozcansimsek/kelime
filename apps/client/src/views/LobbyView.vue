<template>
  <div class="lobby p-d-flex p-flex-column p-ai-center p-jc-center p-mt-5">
    <p class="info-text p-mb-3">Oyun Başlamadı</p>
    <p class="room-info p-mb-1">
      Oda adı: <span class="room-name">{{ roomName }}</span>
    </p>
    <p class="username-info p-mb-4">
      Mevcut oyuncu: <span class="username">{{ username }}</span>
    </p>
    <Button
      label="Oyunu Başlat"
      icon="pi pi-play"
      class="p-button-success"
      @click="$emit('start-game')"
    />
  </div>
</template>

<script setup lang="ts">
import { Button } from 'primevue'

defineProps<{
  roomName: string
  username: string
}>()
</script>

<style scoped>
.lobby {
  max-width: 400px;
  margin: 0 auto;
  text-align: center;
  font-family: 'Arial', sans-serif;
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
</style>
