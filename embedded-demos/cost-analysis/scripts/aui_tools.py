#!/usr/bin/env python3
"""AI Demo Shell maintenance tools.

These commands are designed for agents, not for product managers. They keep
scenario generation deterministic: one scenario package per folder, one data
package per scenario, and scoped write locks before edits.
"""

from __future__ import annotations

import argparse
import datetime as dt
import json
import os
import re
import shutil
import sys
from pathlib import Path
from typing import Any


ROOT = Path.cwd()
REQUIRED_HEADINGS = [
    "# 场景说明",
    "# 交互流程",
    "### 触发方式",
    "### AI 台词",
    "### 确认节点（可选）",
    "### 操作按钮",
    "### 右侧面板",
    "# 常见追问",
]
PLACEHOLDER_TEXT = ["暂无内容", "面板组件开发中"]
LOCK_DIR_NAME = ".aui-write-lock"


def ok(data: dict[str, Any]) -> None:
    print(json.dumps({"success": True, **data}, ensure_ascii=False, indent=2))


def fail(code: str, message: str, hint: str | None = None, **extra: Any) -> None:
    payload: dict[str, Any] = {
        "success": False,
        "error": {"code": code, "message": message},
    }
    if hint:
        payload["error"]["hint"] = hint
    payload.update(extra)
    print(json.dumps(payload, ensure_ascii=False, indent=2))
    raise SystemExit(1)


def project_root(value: str | None) -> Path:
    root = Path(value).expanduser().resolve() if value else ROOT.resolve()
    if not (root / "src" / "scenarios").exists():
        fail(
            "NOT_AI_DEMO_SHELL",
            f"未找到 AI Demo Shell 场景目录: {root / 'src' / 'scenarios'}",
            "请在 AI Demo Shell 项目根目录执行，或传入 --project。",
        )
    return root


def read_json(path: Path) -> dict[str, Any]:
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except FileNotFoundError:
        return {}
    except json.JSONDecodeError as exc:
        fail("INVALID_JSON", f"JSON 解析失败: {path}", str(exc))


def write_json(path: Path, data: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def slug(value: str) -> str:
    text = value.strip().lower()
    text = re.sub(r"[^a-z0-9\u4e00-\u9fa5]+", "-", text)
    return text.strip("-") or "scenario"


def safe_lock_name(value: str) -> str:
    return slug(value).replace("/", "-")


def shortcut(value: str) -> str:
    return re.sub(r"\s+", "", value)[:8] or "演示场景"


def scenario_dirs(root: Path) -> list[Path]:
    scenarios_root = root / "src" / "scenarios"
    return sorted([p for p in scenarios_root.iterdir() if p.is_dir()])


def load_manifest(scenario_dir: Path) -> dict[str, Any]:
    return read_json(scenario_dir / "scenario.manifest.json")


def business_template(agent_name: str, scenario_name: str, data: dict[str, str]) -> str:
    project_name = data.get("projectName", "星河湾一期")
    contract_name = data.get("contractName", "星河湾一期总承包合同")
    amount = data.get("amount", "1,280,000 元")
    return f"""---
场景名称: {scenario_name}
AI专员名称: {agent_name}
AI专员简介: 专注{scenario_name}的资料识别、风险判断和业务推进。
头像色: blue
---

# 场景说明

{scenario_name}用于演示{agent_name}如何协助产品经理完成业务资料识别、关键风险判断和结果确认。

---

# 交互流程

## 步骤 1：资料识别

> ### 触发方式
> 用户进入场景后自动触发

### AI 台词

{agent_name}：我已读取本次演示资料，识别到项目、合同、金额和待确认事项。

**识别摘要**

| 字段 | 内容 |
|---|---|
| 项目名称 | {project_name} |
| 合同名称 | {contract_name} |
| 本次金额 | **{amount}** |

### 确认节点（可选）

无

### 操作按钮

- 「开始分析」→ 进入步骤 2

### 右侧面板

**工作台卡片：资料识别摘要**

查看本次演示的项目、合同、金额和资料范围。

**基础信息**

| 字段 | 内容 |
|---|---|
| 项目名称 | {project_name} |
| 合同名称 | {contract_name} |
| 本次金额 | **{amount}** |

---

## 步骤 2：智能分析

> ### 触发方式
> 用户点击「开始分析」后自动进入

### AI 台词

{agent_name}：我已完成业务规则匹配，发现 1 项需要优先确认的风险。

**分析结论**

- 业务口径：与当前演示数据一致
- 风险等级：中风险
- 建议动作：先确认金额和附件，再提交下一步

### 确认节点（可选）

无

### 操作按钮

- 「查看结论」→ 进入步骤 3

### 右侧面板

**工作台卡片：智能分析结论**

查看规则命中、风险依据和建议动作。

**风险明细**

| 维度 | 结论 | 建议 |
|---|---|---|
| 金额口径 | 待确认 | 使用系统识别金额 |
| 附件资料 | 基本完整 | 补充最新审批记录 |

---

## 步骤 3：结果确认

> ### 触发方式
> 用户点击「查看结论」后自动进入

### AI 台词

{agent_name}：本次演示已形成可提交的业务结论。你可以在右侧工作台查看完整核对结果。

### 确认节点（可选）

无

### 操作按钮

- 「重新开始」→ 重新开始

### 右侧面板

**工作台卡片：最终核对单**

查看提交前的最终结论和后续动作。

**最终核对**

| 核对项 | 内容 |
|---|---|
| 业务结论 | **建议通过，保留 1 项确认提醒** |
| 关键依据 | 项目、合同、金额和附件均来自当前场景数据包 |
| 后续动作 | 提交业务负责人确认 |

---

# 常见追问

## 为什么这个风险需要确认？

因为当前金额和附件口径会影响后续审批结论，建议先确认后再提交。

## 可以调整演示数据吗？

可以。请只修改当前场景目录下的 `data/demo-data.json` 和 `business-design.md`。

## 这份结论能导出吗？

当前 Demo Shell 以浏览器演示为主，导出能力属于后续组件增强范围。

## 与任务无关的问题

我专注于当前演示场景的业务分析和流程推进，请继续围绕本任务提问。
"""


def lock_base(root: Path) -> Path:
    return root / LOCK_DIR_NAME


def lock_target_id(scope: str, args: argparse.Namespace) -> str:
    if scope == "project":
        return "project"
    if scope == "agent":
        target = args.agent_id or args.agent_name
        if not target:
            fail("LOCK_TARGET_REQUIRED", "专员锁需要传入 --agent-id 或 --agent-name。")
        return safe_lock_name(target)
    if scope == "scenario":
        target = args.scenario_id or args.scenario_name
        if not target:
            fail("LOCK_TARGET_REQUIRED", "场景锁需要传入 --scenario-id 或 --scenario-name。")
        owner = args.agent_id or args.agent_name
        if owner:
            return f"{safe_lock_name(owner)}__{safe_lock_name(target)}"
        return safe_lock_name(target)
    fail("INVALID_LOCK_SCOPE", f"不支持的写入锁范围: {scope}")


def scoped_lock_path(root: Path, scope: str, args: argparse.Namespace) -> Path:
    base = lock_base(root)
    if scope == "project":
        return base / "project.lock.json"
    if scope == "agent":
        return base / "agents" / f"{lock_target_id(scope, args)}.lock.json"
    if scope == "scenario":
        return base / "scenarios" / f"{lock_target_id(scope, args)}.lock.json"
    fail("INVALID_LOCK_SCOPE", f"不支持的写入锁范围: {scope}")


def all_lock_files(root: Path) -> list[Path]:
    base = lock_base(root)
    if not base.exists():
        return []
    files: list[Path] = []
    legacy = base / "lock.json"
    if legacy.exists():
        files.append(legacy)
    files.extend(sorted(base.glob("*.lock.json")))
    files.extend(sorted((base / "agents").glob("*.lock.json")))
    files.extend(sorted((base / "scenarios").glob("*.lock.json")))
    return files


def cleanup_empty_lock_dirs(root: Path) -> None:
    base = lock_base(root)
    if not base.exists():
        return
    for child in [base / "agents", base / "scenarios"]:
        if child.exists() and not any(child.iterdir()):
            child.rmdir()
    if not any(base.iterdir()):
        base.rmdir()


def lock_is_stale(lock: dict[str, Any], now: dt.datetime, ttl_minutes: int) -> bool:
    created_raw = lock.get("createdAt")
    if not created_raw:
        return True
    try:
        created = dt.datetime.fromisoformat(str(created_raw))
    except ValueError:
        return True
    return now - created > dt.timedelta(minutes=ttl_minutes)


def lock_scope(lock: dict[str, Any], path: Path) -> str:
    scope = lock.get("scope")
    if scope in {"project", "agent", "scenario"}:
        return str(scope)
    if path.name == "lock.json":
        return "project"
    if path.parent.name == "agents":
        return "agent"
    if path.parent.name == "scenarios":
        return "scenario"
    return "project"


def same_target(request: argparse.Namespace, lock: dict[str, Any], scope: str) -> bool:
    if scope == "scenario":
        request_ids = {request.scenario_id, request.scenario_name} - {None, ""}
        lock_ids = {lock.get("scenarioId"), lock.get("scenarioName")} - {None, ""}
        if not bool(request_ids & lock_ids):
            return False
        request_agent_ids = {request.agent_id, request.agent_name} - {None, ""}
        lock_agent_ids = {lock.get("agentId"), lock.get("agentName")} - {None, ""}
        if request_agent_ids and lock_agent_ids:
            return bool(request_agent_ids & lock_agent_ids)
        return True
    if scope == "agent":
        request_ids = {request.agent_id, request.agent_name} - {None, ""}
        lock_ids = {lock.get("agentId"), lock.get("agentName")} - {None, ""}
        return bool(request_ids & lock_ids)
    return True


def locks_conflict(request_scope: str, request: argparse.Namespace, lock: dict[str, Any], path: Path) -> bool:
    existing_scope = lock_scope(lock, path)
    if existing_scope == "project" or request_scope == "project":
        return True
    if request_scope == "scenario" and existing_scope == "scenario":
        return same_target(request, lock, "scenario")
    if request_scope == "agent" and existing_scope == "agent":
        return same_target(request, lock, "agent")
    if request_scope == "scenario" and existing_scope == "agent":
        return same_target(request, lock, "agent")
    if request_scope == "agent" and existing_scope == "scenario":
        return same_target(request, lock, "agent")
    return False


def conflict_message(request_scope: str, lock: dict[str, Any], path: Path, stale: bool) -> tuple[str, str, str]:
    existing_scope = lock_scope(lock, path)
    if existing_scope == "scenario":
        name = str(lock.get("scenarioName") or lock.get("scenarioId") or "当前")
        message = f"当前「{name}」场景正在被修改。强行继续可能导致对话内容、演示数据或右侧工作台串用。建议等待当前修改完成。是否仍要继续？"
        code = "SCENARIO_WRITE_LOCKED"
    elif existing_scope == "agent":
        name = str(lock.get("agentName") or lock.get("agentId") or "当前 AI 专员")
        message = f"当前「{name}」正在修改身份信息或首页快捷入口。强行继续可能导致首页和对话页名称、头像不一致。是否仍要继续？"
        code = "AGENT_WRITE_LOCKED"
    else:
        message = "当前 demo 正在进行底座或批量迁移修改。为避免多个场景数据串改，本次修改已暂停。请等待当前任务完成后再继续。"
        code = "PROJECT_WRITE_LOCKED" if request_scope != "project" else "WRITE_LOCKED"
    hint = "如确认继续，请让 Codex 使用确认继续模式重新执行；否则等待当前修改完成。"
    if stale:
        hint = "检测到可能过期的写入锁，请让 Codex 检查并清理后再继续。"
    return code, message, hint


def lock_payload(scope: str, args: argparse.Namespace, token: str, now: dt.datetime) -> dict[str, Any]:
    payload: dict[str, Any] = {
        "token": token,
        "task": args.task,
        "scope": scope,
        "createdAt": now.isoformat(),
        "pid": os.getpid(),
        "forceContinue": bool(args.force_continue),
    }
    if args.agent_id:
        payload["agentId"] = args.agent_id
    if args.agent_name:
        payload["agentName"] = args.agent_name
    if args.scenario_id:
        payload["scenarioId"] = args.scenario_id
    if args.scenario_name:
        payload["scenarioName"] = args.scenario_name
    return payload


def acquire_lock(args: argparse.Namespace) -> None:
    root = project_root(args.project)
    scope = args.scope
    now = dt.datetime.now(dt.timezone.utc)
    ttl_minutes = int(args.ttl_minutes)
    target_lock = scoped_lock_path(root, scope, args)
    conflicts: list[dict[str, Any]] = []

    for path in all_lock_files(root):
        lock = read_json(path)
        if locks_conflict(scope, args, lock, path):
            conflicts.append({"path": path, "lock": lock, "stale": lock_is_stale(lock, now, ttl_minutes)})

    if conflicts and not args.force_continue:
        conflict = conflicts[0]
        code, message, hint = conflict_message(scope, conflict["lock"], conflict["path"], conflict["stale"])
        fail(
            code,
            message,
            hint,
            displayMessage=message,
            lock=conflict["lock"],
            lockFile=str(conflict["path"]),
            stale=conflict["stale"],
            conflictCount=len(conflicts),
        )

    overrode_locks: list[str] = []
    if conflicts and args.force_continue:
        for conflict in conflicts:
            conflict["path"].unlink(missing_ok=True)
            overrode_locks.append(str(conflict["path"]))
        cleanup_empty_lock_dirs(root)

    token = f"aui-{int(now.timestamp())}-{os.getpid()}"
    write_json(target_lock, lock_payload(scope, args, token, now))
    ok(
        {
            "token": token,
            "scope": scope,
            "lockFile": str(target_lock),
            "overrodeLocks": overrode_locks,
        }
    )


def release_lock(args: argparse.Namespace) -> None:
    root = project_root(args.project)
    locks = all_lock_files(root)
    if not locks:
        ok({"released": False, "message": "没有写入锁。"})
        return

    released: list[str] = []
    if args.token:
        for path in locks:
            lock = read_json(path)
            if lock.get("token") == args.token:
                path.unlink(missing_ok=True)
                released.append(str(path))
        if not released:
            fail("LOCK_TOKEN_MISMATCH", "写入锁 token 不匹配，未释放。")
    else:
        target = scoped_lock_path(root, args.scope, args)
        if target.exists():
            target.unlink()
            released.append(str(target))
        legacy = lock_base(root) / "lock.json"
        if args.scope == "project" and legacy.exists():
            legacy.unlink()
            released.append(str(legacy))

    cleanup_empty_lock_dirs(root)
    ok({"released": bool(released), "lockFiles": released})


def create_scenario_package(args: argparse.Namespace) -> tuple[Path, str]:
    root = project_root(args.project)
    scenario_id = args.scenario_id or slug(args.scenario_name)
    dir_id = args.dir_id or f"{args.agent_id}__{scenario_id}"
    target = root / "src" / "scenarios" / dir_id
    if target.exists() and not args.force:
        fail("SCENARIO_EXISTS", f"场景目录已存在: {target}", "如需覆盖，请传 --force。")
    target.mkdir(parents=True, exist_ok=True)

    data = {
        "scenarioId": dir_id,
        "projectName": args.project_name or f"{args.scenario_name}项目",
        "contractName": args.contract_name or f"{args.scenario_name}示例合同",
        "amount": args.amount or "1,280,000 元",
    }
    write_json(target / "data" / "demo-data.json", data)
    write_json(
        target / "scenario.manifest.json",
        {
            "agentId": args.agent_id,
            "agentName": args.agent_name,
            "agentDescription": args.agent_description or f"专注{args.agent_name}相关业务演示。",
            "avatarKey": args.avatar_key,
            "scenarioName": args.scenario_name,
            "shortcutLabel": shortcut(args.shortcut_label or args.scenario_name),
            "shortcutOrder": args.shortcut_order,
            "dataScope": "scenario-only",
        },
    )
    (target / "business-design.md").write_text(
        business_template(args.agent_name, args.scenario_name, data),
        encoding="utf-8",
    )
    return target, dir_id


def scaffold_scenario(args: argparse.Namespace) -> None:
    target, dir_id = create_scenario_package(args)
    ok({"scenarioDir": str(target), "scenarioId": dir_id})


def scaffold_test_suite(args: argparse.Namespace) -> None:
    root = project_root(args.project)
    agents = [
        ("cost-payment", "成本请款专员", "avatar-ai-1"),
        ("contract-risk", "合同风控专员", "avatar-ai-2"),
        ("sales-follow", "营销跟进专员", "avatar-ai-3"),
        ("operation-service", "运营服务专员", "avatar-ai-4"),
    ]
    scene_names = ["资料识别", "风险分析", "金额核对", "进度查询", "结果确认"]
    created: list[str] = []

    if args.clean:
        for path in scenario_dirs(root):
            shutil.rmtree(path)

    for agent_id, agent_name, avatar_key in agents:
        for idx, scene_name in enumerate(scene_names, start=1):
            scenario_name = f"{agent_name.replace('专员', '')}{scene_name}"
            ns = argparse.Namespace(
                project=str(root),
                agent_id=agent_id,
                agent_name=agent_name,
                agent_description=f"{agent_name}用于演示{scene_name}相关业务处理。",
                avatar_key=avatar_key,
                scenario_name=scenario_name,
                scenario_id=f"scene-{idx:02d}",
                dir_id=f"{agent_id}__scene-{idx:02d}",
                shortcut_label=scene_name,
                shortcut_order=idx,
                project_name=f"{agent_name[:2]}演示项目{idx}",
                contract_name=f"{scenario_name}示例合同",
                amount=f"{120 + idx * 16},000 元",
                force=True,
            )
            create_scenario_package(ns)
            created.append(ns.dir_id)
    ok({"createdCount": len(created), "scenarios": created})


def backup_legacy_demo(args: argparse.Namespace) -> None:
    root = project_root(args.project)
    source = Path(args.source).expanduser().resolve()
    if not source.exists():
        fail("SOURCE_NOT_FOUND", f"旧 demo 不存在: {source}")
    stamp = dt.datetime.now().strftime("%Y%m%d-%H%M%S")
    target = root / "backups" / f"{source.name}-{stamp}"
    shutil.copytree(source, target, ignore=shutil.ignore_patterns("node_modules", "dist", ".git"))
    ok({"backupDir": str(target)})


def extract_demo_outline(args: argparse.Namespace) -> None:
    source = Path(args.source).expanduser().resolve()
    if not source.exists():
        fail("SOURCE_NOT_FOUND", f"旧 demo 不存在: {source}")
    out = Path(args.out).expanduser().resolve()
    exts = {".md", ".txt", ".html", ".tsx", ".ts", ".jsx", ".js"}
    items: list[str] = []
    for path in sorted(source.rglob("*")):
        if path.is_dir() or path.suffix not in exts:
            continue
        if any(part in {"node_modules", "dist", ".git"} for part in path.parts):
            continue
        text = path.read_text(encoding="utf-8", errors="ignore")
        hits = re.findall(r"[\u4e00-\u9fa5A-Za-z0-9，。；：、（）()《》“”\"' -]{8,80}", text)
        if hits:
            rel = path.relative_to(source)
            items.append(f"## {rel}\n\n" + "\n".join(f"- {h.strip()}" for h in hits[:20]))
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text("# 旧 Demo 业务线索抽取\n\n" + "\n\n".join(items), encoding="utf-8")
    ok({"outlineFile": str(out), "filesScanned": len(items)})


def create_migration_report(args: argparse.Namespace) -> None:
    out = Path(args.out).expanduser().resolve()
    content = f"""# 旧 Demo 迁移报告

## 迁移目标

- 新场景：{args.scenario_name}
- 迁移方式：只读旧 demo，重建到标准 AI Demo Shell

## 已还原内容

- AI 专员名称和简介
- 主流程步骤
- 左侧对话、操作按钮和生成物卡片
- 右侧工作台 Markdown 内容
- 当前场景独立数据包

## 降级表达

- 真实上传、拖拽、导出、复杂表单先降级为可演示的对话和右侧工作台内容。

## 组件缺口

- 如需真实原生交互，请后续补充自定义组件并单独验收。
"""
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(content, encoding="utf-8")
    ok({"reportFile": str(out)})


def validate_isolation(args: argparse.Namespace) -> None:
    root = project_root(args.project)
    errors: list[str] = []
    warnings: list[str] = []
    scenarios = scenario_dirs(root)
    seen_dirs: set[str] = set()
    agents: dict[str, list[dict[str, Any]]] = {}

    for scenario_dir in scenarios:
        if scenario_dir.name in seen_dirs:
            errors.append(f"场景目录重复: {scenario_dir.name}")
        seen_dirs.add(scenario_dir.name)

        manifest = load_manifest(scenario_dir)
        if not manifest:
            errors.append(f"{scenario_dir.name}: 缺少 scenario.manifest.json")
            continue
        agent_id = manifest.get("agentId")
        agent_name = manifest.get("agentName")
        avatar_key = manifest.get("avatarKey")
        shortcut_label = manifest.get("shortcutLabel", "")
        if not agent_id or not agent_name or not avatar_key:
            errors.append(f"{scenario_dir.name}: agentId / agentName / avatarKey 必填")
        if len(shortcut_label) > 8:
            errors.append(f"{scenario_dir.name}: shortcutLabel 超过 8 个字: {shortcut_label}")
        if manifest.get("dataScope") != "scenario-only":
            warnings.append(f"{scenario_dir.name}: 建议 dataScope 写为 scenario-only")

        data_file = scenario_dir / "data" / "demo-data.json"
        if not data_file.exists():
            errors.append(f"{scenario_dir.name}: 缺少 data/demo-data.json")

        business_file = scenario_dir / "business-design.md"
        if not business_file.exists():
            errors.append(f"{scenario_dir.name}: 缺少 business-design.md")
        else:
            text = business_file.read_text(encoding="utf-8")
            for heading in REQUIRED_HEADINGS:
                if heading not in text:
                    errors.append(f"{scenario_dir.name}: 缺少结构标题 {heading}")
            for placeholder in PLACEHOLDER_TEXT:
                if placeholder in text:
                    errors.append(f"{scenario_dir.name}: 包含未完成占位文案 {placeholder}")

        agents.setdefault(agent_id or "unknown", []).append(
            {
                "dir": scenario_dir.name,
                "agentName": agent_name,
                "avatarKey": avatar_key,
                "shortcutLabel": shortcut_label,
                "shortcutOrder": manifest.get("shortcutOrder", 999),
            }
        )

    if args.expected_agents is not None and len(agents) != args.expected_agents:
        errors.append(f"AI 专员数量应为 {args.expected_agents}，实际为 {len(agents)}")
    if args.expected_scenarios_per_agent is not None:
        for agent_id, items in agents.items():
            if len(items) != args.expected_scenarios_per_agent:
                errors.append(
                    f"{agent_id}: 场景数量应为 {args.expected_scenarios_per_agent}，实际为 {len(items)}"
                )

    for agent_id, items in agents.items():
        names = {item["agentName"] for item in items}
        avatars = {item["avatarKey"] for item in items}
        if len(names) > 1:
            errors.append(f"{agent_id}: 同一专员下 agentName 不一致: {sorted(names)}")
        if len(avatars) > 1:
            errors.append(f"{agent_id}: 同一专员下 avatarKey 不一致: {sorted(avatars)}")
        sorted_items = sorted(items, key=lambda x: (x["shortcutOrder"], x["dir"]))
        homepage_shortcuts = [item["shortcutLabel"] for item in sorted_items[:4]]
        if len(homepage_shortcuts) > 4:
            errors.append(f"{agent_id}: 首页快捷入口超过 4 个")
        if any(len(label) > 8 for label in homepage_shortcuts):
            errors.append(f"{agent_id}: 首页快捷入口存在超过 8 个字的文案")

    report = {
        "success": not errors,
        "summary": {
            "agentCount": len(agents),
            "scenarioCount": len(scenarios),
            "expectedAgents": args.expected_agents,
            "expectedScenariosPerAgent": args.expected_scenarios_per_agent,
        },
        "agents": agents,
        "errors": errors,
        "warnings": warnings,
    }
    report_path = root / "validation-report.md"
    report_path.write_text(
        "# AI Demo Shell 场景隔离校验\n\n"
        + f"- 校验结果：{'通过' if not errors else '未通过'}\n"
        + f"- AI 专员数：{len(agents)}\n"
        + f"- 场景数：{len(scenarios)}\n\n"
        + "## 问题\n\n"
        + ("\n".join(f"- {e}" for e in errors) if errors else "无\n")
        + "\n\n## 提醒\n\n"
        + ("\n".join(f"- {w}" for w in warnings) if warnings else "无\n"),
        encoding="utf-8",
    )
    if errors:
        print(json.dumps(report, ensure_ascii=False, indent=2))
        raise SystemExit(1)
    ok({"report": report, "reportFile": str(report_path)})


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="AI Demo Shell maintenance tools")
    sub = parser.add_subparsers(dest="cmd", required=True)

    p = sub.add_parser("acquire-lock")
    p.add_argument("--project")
    p.add_argument("--task", default="AI Demo Shell 写入任务")
    p.add_argument("--ttl-minutes", default=30)
    p.add_argument("--scope", choices=["project", "agent", "scenario"], default="project")
    p.add_argument("--agent-id")
    p.add_argument("--agent-name")
    p.add_argument("--scenario-id")
    p.add_argument("--scenario-name")
    p.add_argument("--force-continue", action="store_true")
    p.set_defaults(func=acquire_lock)

    p = sub.add_parser("release-lock")
    p.add_argument("--project")
    p.add_argument("--token")
    p.add_argument("--scope", choices=["project", "agent", "scenario"], default="project")
    p.add_argument("--agent-id")
    p.add_argument("--agent-name")
    p.add_argument("--scenario-id")
    p.add_argument("--scenario-name")
    p.set_defaults(func=release_lock)

    p = sub.add_parser("scaffold-scenario")
    p.add_argument("--project")
    p.add_argument("--agent-id", required=True)
    p.add_argument("--agent-name", required=True)
    p.add_argument("--agent-description")
    p.add_argument("--avatar-key", default="avatar-ai-1")
    p.add_argument("--scenario-name", required=True)
    p.add_argument("--scenario-id")
    p.add_argument("--dir-id")
    p.add_argument("--shortcut-label")
    p.add_argument("--shortcut-order", type=int, default=999)
    p.add_argument("--project-name")
    p.add_argument("--contract-name")
    p.add_argument("--amount")
    p.add_argument("--force", action="store_true")
    p.set_defaults(func=scaffold_scenario)

    p = sub.add_parser("scaffold-test-suite")
    p.add_argument("--project")
    p.add_argument("--clean", action="store_true")
    p.set_defaults(func=scaffold_test_suite)

    p = sub.add_parser("backup-legacy-demo")
    p.add_argument("--project")
    p.add_argument("--source", required=True)
    p.set_defaults(func=backup_legacy_demo)

    p = sub.add_parser("extract-demo-outline")
    p.add_argument("--source", required=True)
    p.add_argument("--out", required=True)
    p.set_defaults(func=extract_demo_outline)

    p = sub.add_parser("create-migration-report")
    p.add_argument("--scenario-name", required=True)
    p.add_argument("--out", required=True)
    p.set_defaults(func=create_migration_report)

    p = sub.add_parser("validate-isolation")
    p.add_argument("--project")
    p.add_argument("--expected-agents", type=int)
    p.add_argument("--expected-scenarios-per-agent", type=int)
    p.set_defaults(func=validate_isolation)
    return parser


def main() -> None:
    parser = build_parser()
    args = parser.parse_args()
    args.func(args)


if __name__ == "__main__":
    main()
