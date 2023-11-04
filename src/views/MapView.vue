<script setup lang="ts">
 import { onMounted } from 'vue';
 import { useRoute } from 'vue-router';
 import { decode, encode } from '../utils';

 import Map from '../components/Map.vue';

 const route = useRoute();

 const data = route.query.data;
 console.log(typeof data);
 const preloadedObjects = JSON.parse(decode(data));
</script>

<template>
    <Map :objects="preloadedObjects" />
</template>


<style scoped>
</style>
