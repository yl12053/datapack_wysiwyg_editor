<script setup>
  import { reactive, watch, ref } from 'vue'
  import LinedTextarea from './LinedTextarea.vue'

  const { promiseSrc } = defineProps(["promiseSrc"]);
  const emit = defineEmits(['save']);

  let done = ref(false);
  let model = ref("");
  watch(model, (val) => emit('save', val));

  async function load() {
    console.log("Start load");
    model.value = await promiseSrc;
    console.log("Done");
    done.value = true;
  }
  load();

  function onChange(val) {
    model.value = val;
  }
</script>

<template>
  <LinedTextarea
    :value="model"
    style='width: 100%; height: 100%;'
    type="textarea"
    v-if="done"
    @save="onChange"
    :styles="{height: 'calc(100% - 32px)', resize: 'none'}"
  />
  <div style="width: 100%; height: 100%" v-loading="true" v-if="!done" />
</template>