<template>
  <div class="item">
    <i>
      <slot name="icon"></slot>
    </i>
    <div class="details">
      <h3>
        <slot name="title"></slot>
      </h3>
      <slot></slot>
    </div>
  </div>
</template>

<style scoped>
 .item {
     margin-top: 2rem;
     display: flex;
     position: relative;
 }

 .details {
     flex: 1;
     margin-left: 1rem;
 }

 i {
     display: flex;
     place-items: center;
     place-content: center;
     width: 50px;
     height: 50px;

     color: var(--color-text);
 }

 i::v-deep(.fgPath) {
     fill: var(--color-text-accent);
 }

 i::v-deep(.bgPath) {
     fill: var(--color-background);
 }

 h3 {
     font-size: 1.2rem;
     font-weight: 500;
     margin-bottom: 0.4rem;
     color: var(--color-heading);
 }
</style>
