#### prisma迁移表结构时使用此命令：
```powershell
npx prisma@6 migrate dev --name init
```
#### 每次修改schema.prisma之后需手动执行：
```powershell
pnpm --filter server exec prisma generate
```
#### 创建vue组件直接复制这个去写
```vue
<template>


</template>

<script setup>


</script>

<style>


</style>


```