<script setup>
import JSONEditor from 'jsoneditor';
import 'jsoneditor/dist/jsoneditor.min.css';
import Ace from 'ace-builds';
import { computed, onMounted, ref, watch } from 'vue'

const { promiseSrc } = defineProps(["promiseSrc"]);
const emit = defineEmits(['save']);

let model = ref("")
const editor = ref();

const editorMode = computed({
  get: () => editor.value ? editor.value.getMode() : "code",
  set: (val) => editor.value?.setMode(val)
});

watch(model, (val) => {
  emit('save', val);
  update(false);
});

const done = ref(false);
const jref = ref();

function update(doSetMode) {
  if (!editor.value) return;
  console.log("Mode", editorMode);
  try {
    const jValue = JSON.parse(model.value);
    editor.value.update(jValue);
    if (doSetMode || init.value) {
      editorMode.value = "tree";
      init.value = false;
    }
  } catch (e) {
    if (e instanceof SyntaxError) {
      editorMode.value = "code";
      editor.value.updateText(model.value);
    } else {
      console.error(e);
    }
  }
}

const init = ref(false);

async function load() {
  model.value = await promiseSrc;
  init.value = true;
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
    language: 'zh-CN',
    modes: ['tree', 'code']
  };
  editor.value = new JSONEditor(container, options);
  update(true);
});
</script>

<template>
  <div ref="jref" v-loading="!done" style="width: 100%; height: 100%" />
</template>

<style scoped>

</style>