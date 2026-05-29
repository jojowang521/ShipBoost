# AI Demo Shell

产品经理用来制作 AI 交互 Demo 的工具项目。写一份剧本文件，即可在浏览器里演示完整的 AI 对话流程，无需写任何代码。

---

## 从这里开始

**产品经理请看** → [`03-guide-01-quickstart.md`](③ 剧本编写指南/01%20快速上手.md)

所有你需要的内容都在 `③ 剧本编写指南/` 文件夹里：

| 文件 | 用途 |
|------|------|
| `01 快速上手.md` | 新手必读，3 步上手 |
| `02 填写业务演示剧本.md` | 新建场景时照着填 |
| `03 查看示例.md` | 完整示例，看实际效果 |
| `04 配置卡片.md` | 生成物卡片与未来左侧组件边界 |
| `05 配置右侧面板.md` | 改右侧展示内容时参考 |

## Shell 模式

默认是原生 / 独立模式：浏览器打开后直接进入 AI Demo Shell。

如果需要在产品页面右下角显示 AI 入口，并点击打开右侧 AI 侧边栏，可以使用侧边栏模式：

```text
?shell=sidebar
```

侧边栏模式可以指定宿主页面预设：

```text
?shell=sidebar&host=list
?shell=sidebar&host=workbench
?shell=sidebar&host=detail
?shell=sidebar&host=split
```

宿主页面只是产品背景页，AI 对话、生成物卡片、工作台内容仍由场景剧本统一驱动。

---

## 与 AI 协作

- **Cursor 用户**：项目已内置 `business-design-writer` Skill，直接描述场景即可生成剧本
- **Claude Code / Cowork 用户**：项目根目录有 `CLAUDE.md`，Claude 会自动读取项目规则
- **其他 AI 工具**：把 `03-guide-02-script-template.md` + `03-guide-03-example.md` 粘贴给 AI，再描述你的场景
