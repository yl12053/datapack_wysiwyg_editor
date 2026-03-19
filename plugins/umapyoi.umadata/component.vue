<script setup>
import { computed, reactive, ref, watch } from 'vue'
  const { promiseSrc } = defineProps(["promiseSrc"]);
  const emit = defineEmits(['save']);
  const src = await promiseSrc;

  const defaultDefinition = {
    "distance_aptitude": [
      0,
      0,
      0,
      0
    ],
    "identifier": "umapyoi:common_uma",
    "position": "end_closer",
    "propertyRate": [
      0,
      0,
      0,
      0,
      0
    ],
    "ranking": "r",
    "surface_aptitude": [
      0,
      0,
      0
    ]
  }

  const position = [
    {
      label: "强势领头",
      value: "runaway"
    },
    {
      label: "领头",
      value: "front_runner"
    },
    {
      label: "前列",
      value: "pace_chaser"
    },
    {
      label: "居中",
      value: "late_surger"
    },
    {
      label: "后追",
      value: "end_closer"
    }
  ];

  const ranking = [
    {
      label: "R",
      value: "r"
    },
    {
      label: "SR",
      value: "sr"
    },
    {
      label: "SSR",
      value: "ssr"
    },
    {
      label: "彩蛋",
      value: "easter_egg"
    }
  ];

  const aptArr = ["速度", "耐力", "力量", "意志力", "智力"];
  const surfArr = ["草地", "砂地", "人工"];
  const distArr = ["短距离", "一里", "中距离", "长距离"];
  const apt = ["G", "F", "E", "D", "C", "B", "A", "S"];

  const aptColorMap = {
    G: "#888888",
    F: "#0000AA",
    E: "#AA00AA",
    D: "#33DDDD",
    C: "#33DD33",
    B: "#FF55FF",
    A: "#FF5555",
    S: "#FFAA00",
  }

  console.log(apt);

  const model = reactive(window.jsonUtils.parseOrDefault(src, defaultDefinition));
  watch(model, (val) => emit('save', window.jsonUtils.dumpDefault(val, defaultDefinition)), {deep: true});

  function handleChange(root, index, val) {
    console.log("change", val);
    if (isNaN(val)) {
      root[index] = 0;
    } else {
      root[index] = val ?? 0;
    }
  }
</script>

<template>
  <el-form style="margin-top: 8vh; width: 60%; margin-left: 20%">
    <el-form-item label="马娘ID" prop="identifier">
      <el-input v-model="model.identifier" />
    </el-form-item>
    <el-form-item label="跑法" prop="position">
      <el-segmented v-model="model.position" :options="position" />
    </el-form-item>
    <el-form-item label="稀有度" prop="ranking">
      <el-segmented v-model="model.ranking" :options="ranking" :class="[`ranking-${model.ranking}`]"/>
    </el-form-item>
    <el-form-item label="数值加成" prop="propertyRate" />
    <template v-for="(item, index) in aptArr">
      <el-form-item :label="item" :prop="`propertyRate[${index}]`" style="margin-left: 5%">
        <el-input-number v-model="model.propertyRate[index]" @change="(value) => handleChange(model.propertyRate, index, value)">
          <template #suffix>
            <span>%</span>
          </template>
        </el-input-number>
      </el-form-item>
    </template>
    <el-form-item label="场地适性" prop="surfaceAptitude" />
    <template v-for="(item, index) in surfArr">
      <el-form-item :label="item" :prop="`surfaceAptitude[${index}]`" style="margin-left: 5%">
        <el-select
          v-model="model.surface_aptitude[index]"
          filterable
          :placeholder="`${item}适性`"
        >
          <el-option
            v-for="(item, index) in apt"
            :key="index"
            :label="item"
            :value="index"
          >
            <span :style="{color: aptColorMap[item]}"> {{ item }} </span>
          </el-option>
        </el-select>
      </el-form-item>
    </template>
    <el-form-item label="距离适性" prop="distanceAptitude" />
    <template v-for="(item, index) in distArr">
      <el-form-item :label="item" :prop="`distanceAptitude[${index}]`" style="margin-left: 5%">
        <el-select
          v-model="model.distance_aptitude[index]"
          filterable
          :placeholder="`${item}适性`"
        >
          <el-option
            v-for="(item, index) in apt"
            :key="index"
            :label="item"
            :value="index"
          >
            <span :style="{color: aptColorMap[item]}"> {{ item }} </span>
          </el-option>
        </el-select>
      </el-form-item>
    </template>
  </el-form>
</template>

<style scoped>
.ranking-r {
  --el-segmented-item-selected-bg-color: #AAAAAA;
}

.ranking-sr {
  --el-segmented-item-selected-bg-color: #FFAA00;
}

.ranking-ssr {
  --el-segmented-item-selected-bg-color: #FF55FF;
}

.ranking-easter_egg {
  --el-segmented-item-selected-bg-color: #00AA00;
}
</style>