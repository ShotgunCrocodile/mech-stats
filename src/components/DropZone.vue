<script setup lang="ts">
 import { ref, onMounted, onUnmounted } from 'vue'
const emit = defineEmits(['files-dropped'])

let active = ref(false)

function setActive() {
    active.value = true
}

function setInactive() {
    active.value = false
}

function onDrop(e) {
     setInactive()
     emit('files-dropped', [...e.dataTransfer.files])
 }


 function preventDefaults(e) {
     e.preventDefault()
 }

 const events = ['dragenter', 'dragover', 'dragleave', 'drop']

 onMounted(() => {
     events.forEach((eventName) => {
         document.body.addEventListener(eventName, preventDefaults)
     })
 })

 onUnmounted(() => {
     events.forEach((eventName) => {
         document.body.removeEventListener(eventName, preventDefaults)
     })
 })
</script>


<template>
    <div class="zone"
	 :data-active="active"
	 @dragenter.prevent="setActive"
	 @dragover.prevent="setActive"
	 @dragleave.prevent="setInactive"
	 @drop.prevent="onDrop">
        <slot></slot>
    </div>
</template>

<style scoped>
 .zone {
     padding: 100px;
     text-align: center;
     background: var(--color-background-soft);
 }
 .zone[data-active=true] {
     padding: 100px;
     background: green;
     text-align: center;
 }

</style>
