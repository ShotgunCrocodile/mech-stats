<script setup lang="ts">
 import { PlayerRecord } from '../replay.ts';

 const props = defineProps<{
     player: PlayerRecord;
 }>();
</script>

<template>
    <div>
	{{ player.name }}
    </div>
</template>

<style scoped></style>
