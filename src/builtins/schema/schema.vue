<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import VueForm from '@lljj/vue3-form-element';
const { promiseSrc, plugin } = defineProps(["promiseSrc", "plugin"]);
const emit = defineEmits(['save']);

let model = ref({});

console.log(plugin);

const uischema = ref(plugin.uischema);
const schema = ref(plugin.schema);

watch(model, (val) => {
  if (!done.value) return;
  emit('save', JSON.stringify(val));
}, {deep: true});

const done = ref(false);

async function load() {
  try {
    model.value = JSON.parse(await promiseSrc);
    console.log("model", model);
  } catch (e) {
    console.error(e);
  }
  done.value = true;
}
load();
</script>

<template>
  <div style="width: 100%; height: 100%" v-loading="true" v-if="!done" />
  <vue-form
    v-model="model"
    :ui-schema="uischema"
    :schema="schema"
    style="text-align: start; width: 60%; margin-left: 20%; margin-top: 8vh;"
    v-if="done"
    @submit.prevent
  >
    <template></template>
  </vue-form>
</template>

<style scoped>

</style>