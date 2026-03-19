<script setup>
import global from '../../shared/global.js'
import { ref } from 'vue'
import { Search } from '@element-plus/icons-vue'
import { testDependencyVersion } from '../../shared/saves.js';

function removeDependencies(index) {
  global.open.value.dependencies.splice(index, 1);
}

function reset() {
  console.log(global.open.value.isNew);
  for (let val of global.open.value.dependencies) {
    if (global.open.value.isNew) {
      if (!val.reason) val.reason = "";
      if (!val.type) val.type = "required";
    } else {
      if (typeof val.mandatory !== "boolean") val.mandatory = true;
    }
    if (!val.versionRange) val.versionRange = "";
    if (!val.ordering) val.ordering = "NONE";
    if (!val.side) val.side = "BOTH";
    if (!val.referralUrl) val.referralUrl = "";
  }
}
reset();

function add() {
  const toPush = {
    modId: "",
    versionRange: "",
    ordering: "NONE",
    side: "BOTH",
    referralUrl: ""
  };
  if (global.open.value.isNew) {
    toPush.type = "required";
    toPush.reason = "";
  } else {
    toPush.mandatory = true;
  }
  global.open.value.dependencies.push(toPush);
}

async function validate() {
  try {
    const resultArray = await Promise.all(new Array(global.open.value.dependencies.length)
      .fill(0)
      .map((i, j) => j)
      .map((i) => new Promise((resolve) => {
        if (!refs.value[i]) {
          resolve(false);
          return;
        }
        refs.value[i].validate(resolve);
      })));
    return !resultArray.includes(false);
  } catch (e) {
    console.error(e);
    return false;
  }
}

const refs = ref([]);

function validateVersionRange(rule, value, callback) {
  if (value === '') {
    callback();
    return;
  }
  if (testDependencyVersion.test(value)) {
    callback();
  } else {
    callback(new Error("格式错误"));
  }
}

function validateOrdering(index, rule, value, callback) {
  if (value === "NONE") {
    if (isOptional(index)) callback(new Error("前置非必须时必须指定加载顺序"));
  }
  callback();
}

function isOptional(index) {
  const obj = global.open.value.dependencies[index];
  if (global.open.value.isNew) {
    return obj.type === "optional";
  }
  return !obj.mandatory;
}

function idMustNotSame(rule, value, callback) {
  if (value === global.open.value.modId) {
    callback(new Error("自己不能作为自己的前置"));
    return;
  }
  callback();
}

function idUnique(rule, value, callback) {
  let count = 0;
  for (let obj of global.open.value.dependencies) {
    if (obj.modId === value) {
      count++;
      if (count >= 2) {
        callback(new Error("ID 必须唯一"));
        return;
      }
    }
  }
  callback();
}

const makeRules = (index) => ({
  modId: [
    { required: true, message: 'modId不可为空', trigger: 'blur' },
    { validator: idUnique, trigger: 'blur' },
    { validator: idMustNotSame, trigger: 'blur' }
  ],
  versionRange : [
    { validator: validateVersionRange, trigger: 'blur' }
  ],
  ordering: [
    { validator: (rule, value, callback) => validateOrdering(index, rule, value, callback), trigger: 'change' }
  ]
});

const rangeExample = [
  {range: "1.0", meaning: "版本号 ≥ 1.0"},
  {range: "(,1.0]", meaning: "版本号 ≤ 1.0"},
  {range: "(,1.0)", meaning: "版本号 < 1.0"},
  {range: "[1.0]", meaning: "版本号 = 1.0"},
  {range: "[1.0,)", meaning: "版本号 ≥ 1.0"},
  {range: "(1.0,)", meaning: "版本号 > 1.0"},
  {range: "(1.0,2.0)", meaning: "1.0 < 版本号 < 2.0"},
  {range: "[1.0,2.0]", meaning: "1.0 ≤ 版本号 ≤ 2.0"},
  {range: "(,1.0],[1.2,)", meaning: "版本号 ≤ 1.0 或 版本号 ≥ 1.2"},
  {range: "(,1.1),(1.1,)", meaning: "版本号 ≠ 1.1"}
];
</script>

<template>
  <div style="height: 0">
    <div style="height: 5vh" />
    <div v-for="(item, index) in global.open.value.dependencies" style="width: 80%; margin-left: 10%;">
      <el-card>
        <template #header>
          <div style="display: flex">
            <div class="padright">{{ item.modId ? item.modId : "(未指定模组)" }}</div>
            <el-button type="danger" @click="removeDependencies(index)">删除</el-button>
          </div>
        </template>
        <el-form
          @submit.prevent
          :model="global.open.value.dependencies[index]"
          :rules="makeRules(index)"
          :ref="el => refs[index] = el"
        >
          <el-form-item label="ID" prop="modId">
            <el-input v-model="global.open.value.dependencies[index].modId" />
          </el-form-item>
          <el-form-item label="是必要前置吗?" prop="mandatory" v-if="!global.open.value.isNew">
            <el-switch
              v-model="global.open.value.dependencies[index].mandatory"
              active-text="必要"
              inactive-text="非必要"
              @change="refs[index]?.validateField('ordering')"
            />
          </el-form-item>
          <el-form-item label="前置关系" prop="type" v-if="global.open.value.isNew">
            <el-segmented
              v-model="global.open.value.dependencies[index].type"
              :options="[
                {label: '必要', value: 'required'},
                {label: '可选', value: 'optional'},
                {label: '不建议', value: 'discouraged'},
                {label: '不兼容', value: 'incompatible'}
              ]"
            />
          </el-form-item>
          <el-form-item label="理由(可选)" prop="reason" v-if="global.open.value.isNew">
            <el-input v-model="global.open.value.dependencies[index].reason" />
          </el-form-item>
          <el-form-item label="版本范围(可选)" prop="versionRange">
            <el-input v-model="global.open.value.dependencies[index].versionRange">
              <template #suffix>
                <el-popover
                  title="示例"
                  placement="top-end"
                  popper-style="width: 35%;"
                >
                  <template #reference>
                    <el-icon><Search /></el-icon>
                  </template>
                  <template #default>
                    <el-table stripe :data="rangeExample" style="width: 100%">
                      <el-table-column prop="range" label="范围表示"/>
                      <el-table-column prop="meaning" label="意义"/>
                    </el-table>
                  </template>
                </el-popover>
              </template>
            </el-input>
          </el-form-item>
          <el-form-item label="加载顺序" prop="ordering">
            <el-segmented
              v-model="global.open.value.dependencies[index].ordering"
              :options="[
                {label: '先加载此模组', value: 'BEFORE'},
                {label: '先加载此前置', value: 'AFTER'},
                {label: '顺序无关', value: 'NONE', disabled: isOptional(index)}
              ]"
            />
          </el-form-item>
          <el-form-item label="加载端" prop="side">
            <el-segmented
              v-model="global.open.value.dependencies[index].side"
              :options="[
                {label: '双端', value: 'BOTH'},
                {label: '客户端', value: 'CLIENT'},
                {label: '服务端', value: 'SERVER'}
              ]"
            />
          </el-form-item>
          <el-form-item label="前置地址(可选)" prop="referralUrl">
            <el-input v-model="global.open.value.dependencies[index].referralUrl" />
          </el-form-item>
        </el-form>
      </el-card>
      <el-divider style="margin-top: 1.25vh; margin-bottom: 1.25vh"/>
    </div>
    <div style="width: 80%; margin-left: 10%">
      <el-button type="primary" @click="add()">添加前置</el-button>
    </div>
    <div style="height: 5vh" />
  </div>
</template>

<style scoped>
.padright {
  width: 100%;
}

.is-error .el-segmented {
  --el-segmented-item-selected-bg-color: var(--el-color-danger);
  --el-segmented-item-selected-disabled-bg-color: var(--el-color-danger-light-5);
}
</style>