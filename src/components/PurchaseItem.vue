<template>
    <div class="purchase-item">
	<div>
	    <slot name="name"></slot>
	</div>
	<div class="space"></div>
	<div>
	    <slot name="amount"></slot>
	</div>
    </div>
</template>


<style scoped>
 .purchase-item {
     display: grid;
     grid-template-columns: auto 1fr auto;
 }
 .space {
     /* border-bottom: 3px dotted var(--color-border); */
     position: relative;
 }

 .space::before {
     content: '';
     position: absolute;
     bottom: 35%;
     border-bottom: 3px dotted var(--color-border);
     width: 100%;
 }


</style>
