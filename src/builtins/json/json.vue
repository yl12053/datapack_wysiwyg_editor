<script setup>
import JSONEditor from 'jsoneditor';
import 'jsoneditor/dist/jsoneditor.min.css';
import Ace from 'ace-builds';
import { onMounted, ref, watch } from 'vue'

const { promiseSrc } = defineProps(["promiseSrc"]);
const emit = defineEmits(['save']);

let model = ref("")
const editor = ref();
watch(model, (val) => {
  emit('save', val);
  update();
});

const done = ref(false);
const jref = ref();

function update() {
  if (!editor.value) return;
  try {
    const jValue = JSON.parse(model.value);
    editor.value.update(jValue);
    editor.value.setMode("tree");
  } catch (e) {
    if (e instanceof SyntaxError) {
      editor.value.setMode("code");
      editor.value.updateText(model.value);
    } else {
      console.error(e);
    }
  }
}

async function load() {
  model.value = await promiseSrc;
  done.value = true;
}
load();

onMounted(() => {
  const container = jref.value;
  const options = {
    ace: Ace,
    onChange() {
      model.value = editor.value.getText();
    },
    language: 'zh-CN'
  };
  editor.value = new JSONEditor(container, options);
  update();
});
</script>

<template>
  <div ref="jref" v-loading="!done" style="width: 100%; height: 100%" />
</template>

<style scoped>

</style>