<script setup>
import { watch, ref, onMounted } from 'vue'
  import ace from 'ace-builds';

  const { promiseSrc } = defineProps(["promiseSrc"]);
  const emit = defineEmits(['save']);

  let done = ref(false);
  const dref = ref();
  const editorRef = ref();
  let model = ref("");
  watch(model, (val) => {
    emit('save', val);
    if (editorRef.value.getValue() !== val) editorRef.value.setValue(val);
  });

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

  onMounted(() => {
    const element = dref.value;
    editorRef.value = ace.edit(element);
    editorRef.value.setValue(model.value);
    editorRef.value.session.on("change", function() {
      model.value = editorRef.value.getValue();
    });
  });
</script>

<template>
  <div style="width: 100%; height: 100%" v-loading="!done" ref="dref"/>
</template>