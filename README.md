# koishi-plugin-aris-chat

Aris Chat — Koishi plugin: 智能戳一戳 / 互动聊天功能 (Alice-like)

Features:
- 五段情绪系统 (neutral, pleasant, annoyed, angry, furious) — 群组情绪会累积并在 5 分钟后慢慢衰减
- 群组情绪与衰减
- 模式识别（节奏：gentle/fast/flirty）
- 支持外部 API 动态回复（可配置）
- 可选反击并支持禁言（依赖 adapter/OneBot）

Install
```
# 将本目录发布并在项目中引用，或本地 link
npm install
```

Usage
- 插件导入：在 Koishi 配置中加入插件：
```ts
export const plugins = [
  'koishi-plugin-aris-chat',
]
```
 
 Quick Start (本地开发 / 测试 - 推荐 Node.js >= 18)
 ```bash
 # 安装 dev 依赖和构建
 npm install
 npm run build
 # 然后在 Koishi 项目中引入并启动
 ```

Config
- `pokeWindowMs`: 连续戳计数窗口（毫秒）
- `userPokeCooldownMs`: 单用户戳冷却（毫秒）
- `enableApiResponse`, `apiUrl`, `apiMethod`: 外部 API 动态回复配置
- `muteDuration`: 反击后禁言秒数（0 表示不禁言）

Notes
- 反击/禁言在不同 adapter 下可能不可用，本插件在执行前进行了检测。
 - 管理命令 `poke.reset` 与 `poke.affection` 默认为插件内 `adminIds` 列表所限制，若为空则允许任意用户执行，请在配置中加入管理员 ID（例如 Bot 拥有者）。
- 建议在生产部署时持久化 `affection`、`pokeStats` 等数据（例如使用 CosmosDB/Redis）。
- 插件现在优先使用 Koishi 的数据库服务进行持久化：请在 Koishi 配置中启用 `database` 服务（例如使用 sqlite/mysql 等）；该插件的 `persistenceEnable` 开关会在 Koishi DB 可用时生效。
