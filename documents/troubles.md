#### prisma迁移表结构时使用此命令：
```powershell
npx prisma@6 migrate dev --name init
```
#### 每次修改schema.prisma之后需手动执行：
```powershell
pnpm --filter server exec prisma generate
```
