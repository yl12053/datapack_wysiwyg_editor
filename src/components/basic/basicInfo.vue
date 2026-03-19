<script setup>
import { reactive, ref } from 'vue'
import global from '../../shared/global.js'

const formRef = ref();

const rules = reactive({
  modId: [
    { required: true, message: '模组ID不得为空', trigger: 'blur' }
  ],
  version: [
    { required: true, message: '版本号不得为空', trigger: 'blur' }
  ]
});

let isLoading = false;

async function loadLicense() {
  if (global.license) return;
  if (isLoading) return;
  isLoading = true;
  global.license = await (await fetch("https://raw.githubusercontent.com/spdx/license-list-data/refs/heads/main/json/licenses.json")).json();
  isLoading = false;
}
loadLicense();

async function querySearch(string, callback) {
  await loadLicense();
  callback(global.license.licenses.map((v) => v.name).filter((n) => string ? n.toLowerCase().indexOf(string.toLowerCase()) >= 0 : true).map((value) => ({value})));
}
</script>

<template>
  <el-form ref="formRef" :model="global.open" label-width="auto" style="width: 60%; margin-left: 20%; margin-top: 8vh;" :rules="rules" @submit.prevent>
    <el-form-item label="ID" prop="modId">
      <el-input v-model="global.open.value.modId" />
    </el-form-item>
    <el-form-item label="名字" prop="name">
      <el-input v-model="global.open.value.name" />
    </el-form-item>
    <el-form-item label="版本号" prop="version">
      <el-input v-model="global.open.value.version" />
    </el-form-item>
    <el-form-item label="作者" prop="authors">
      <el-input v-model="global.open.value.authors" />
    </el-form-item>
    <el-form-item label="模组介绍" prop="description">
      <el-input v-model="global.open.value.description" type="textarea"/>
    </el-form-item>
    <el-form-item label="使用条款" prop="license">
      <el-autocomplete
        v-model="global.open.value.license"
        :fetch-suggestions="querySearch"
      />
    </el-form-item>
  </el-form>
</template>