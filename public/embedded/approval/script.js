const state = {
  activeTab: "legal",
  activeFilter: "risk",
  questionSet: 0,
  analyzed: false,
  pendingAction: null,
  opinionText: "",
};

const summaryData = [
  ["租赁位置", "星河中心 3F-302"],
  ["计租面积", "860 平方米"],
  ["月租金", "35,733 元"],
  ["押金", "107,199 元"],
  ["付款周期", "季付"],
  ["免租期", "45 天"],
  ["租金递增", "第二年起每年递增 5%"],
  ["物业费", "18 元/平方米/月"],
];

const flowSteps = ["经办提交", "部门负责人", "财务初审", "法务审批", "合规复核", "总经理审批", "归档"];
const returnedFlowSteps = ["经办提交", "部门负责人", "财务初审", "法务审批", "经办修改", "重新提交", "归档"];
const analysisSteps = ["抽取合同关键条款", "匹配租赁审批制度", "识别高风险条款", "生成审批建议"];

const questionSets = [
  ["开始审批租赁合同", "检查需要退回的风险点", "生成退回审批意见"],
  ["检查租金与付款条款", "查看法务条款偏离", "转法务复核建议"],
];

const records = [
  { role: "李若琳 · 经办人", text: "提交《星河中心 3F 商铺租赁合同》，合同金额 1,286,400 元。" },
  { role: "陈昊 · 部门负责人", text: "同意提交，租赁面积和招商计划匹配，请财务关注预算占用。" },
  { role: "周敏 · 财务初审", text: "预算科目已确认，需补充发票税率和付款前置条件。" },
  { role: "王启明 · 法务审批", text: "待处理，AI 助手可辅助生成审批建议。" },
];

const opinions = {
  return:
    "经 AI 辅助审核及本节点复核，当前租赁合同建议退回修改。请经办人重点补充或调整以下内容：一是明确出租方授权签署文件及产权/转租证明；二是补充押金退还条件、退还期限及扣减范围；三是调整提前解除条款，避免我方单方解除权受限；四是明确发票税率、开票时间及付款前置条件。修改后请重新提交审批，并同步上传补充材料。",
  formal:
    "经本节点审阅并结合 AI 辅助检查结果，当前合同存在授权材料、押金退还、提前解除权及付款条件等风险事项，暂不建议继续流转。请经办部门补充出租方权属及授权证明，完善押金退还期限、扣减依据、双方解除权及发票税率约定后重新提交审批。",
  short:
    "建议退回修改。请补充出租方授权材料，完善押金退还、提前解除权、违约责任及发票税率条款后重新提交。",
  legal:
    "建议转法务复核。当前合同涉及提前解除权不对等、押金退还条件不清晰和违约责任上限缺失，请法务进一步确认条款可执行性及修改口径。",
  conditional:
    "建议带条件通过。请经办人在合同签署前补充出租方授权材料，并完成押金退还、付款前置条件和发票税率条款的书面确认，相关材料随合同一并归档。",
  approve:
    "同意通过。请经办人按审批意见补充归档材料，并在合同签署前完成授权文件与付款条件复核。",
};

const riskGroups = {
  business: {
    label: "商务风控",
    items: [
      ["warning", "租金递增机制缺少市场依据", "第二年起每年租金递增 5%。", "递增比例超过 3% 时需补充市场询价或经营收益测算。", "可能影响长期租赁成本。", "补充周边同类物业租金对比或经营收益测算。"],
      ["warning", "免租期超过常规阈值", "出租方给予承租方 45 天免租装修期。", "常规免租期不超过 30 天，超过阈值需说明。", "影响合同总成本和首期费用确认。", "补充装修计划和免租期合理性说明。"],
      ["pass", "租赁标的位置清晰", "租赁标的为星河中心 3F-302。", "合同需明确标的位置、面积和用途。", "未发现明显商务缺口。", "建议归档平面图或交付清单。"],
    ],
  },
  legal: {
    label: "法务风控",
    items: [
      ["risk", "提前解除权不对等", "承租方提前解除需提前 90 日通知并支付剩余租期 30% 租金；出租方经营需要可提前 30 日通知解除。", "标准条款要求双方解除权、通知期和赔偿责任保持基本对等。", "出租方解除成本明显低于承租方，我方经营稳定性受影响。", "退回修改，调整为双方对等解除条件或补充出租方赔偿责任。"],
      ["risk", "押金退还条件不清晰", "合同终止后，出租方在扣除相关费用后无息退还押金。", "押金条款需明确退还期限、扣减范围和费用确认方式。", "可能导致押金长期占用或费用扣减争议。", "补充 15 个工作日内退还、扣减需提供费用明细和书面确认。"],
      ["warning", "违约责任上限缺失", "任一方违约应赔偿对方因此遭受的全部损失。", "合同违约赔偿应设置合理上限并排除间接损失。", "可能形成超过合同金额的责任敞口。", "将累计赔偿上限限定为合同总金额，并排除间接损失。"],
      ["pass", "租期起止明确", "租期为 2026-07-01 至 2029-06-30。", "合同需明确起租日、到期日和交付安排。", "未发现明显法务缺口。", "建议签署前确认交付日与计租日一致。"],
    ],
  },
  finance: {
    label: "财务风控",
    items: [
      ["warning", "发票税率未明确", "出租方应开具合法有效发票。", "付款条款需明确发票类型、税率和开票时间。", "可能影响付款审批、税务抵扣和费用入账。", "补充增值税专用发票、适用税率及开票时间。"],
      ["warning", "付款前置条件不足", "承租方按季度支付租金。", "付款前应具备合同生效、发票、账户确认等条件。", "可能导致付款资料不完整时仍触发付款义务。", "增加合同生效、收到合规发票、账户信息确认等前置条件。"],
      ["pass", "付款周期具备基础约定", "租金按季度支付。", "租赁合同需约定明确付款周期。", "付款周期清晰。", "建议同步确认首期付款日期。"],
    ],
  },
  compliance: {
    label: "合规风控",
    items: [
      ["risk", "合同主体授权材料缺失", "出租方授权代表签署本合同。", "审批需上传产权证明、出租授权书或转租同意文件。", "存在签署主体授权不足和合同效力争议风险。", "要求经办人补充出租方权属证明及授权签署材料后再流转。"],
      ["warning", "关联交易声明未上传", "附件未见关联交易或利益冲突声明。", "审批应确认交易对方与经办部门不存在未披露关联关系。", "可能影响合规审查完整性。", "补充关联交易及利益冲突声明。"],
      ["pass", "合同主体基础信息完整", "双方名称、统一社会信用代码、地址和联系人均已列明。", "合同主体信息需完整、可核验。", "未发现明显主体信息缺失。", "建议签署前再次核验工商状态。"],
    ],
  },
};

const els = {
  aiEntryBtn: document.querySelector("#aiEntryBtn"),
  aiDrawer: document.querySelector("#aiDrawer"),
  closeDrawerBtn: document.querySelector("#closeDrawerBtn"),
  maximizeDrawerBtn: document.querySelector("#maximizeDrawerBtn"),
  newChatBtn: document.querySelector("#newChatBtn"),
  drawerTitle: document.querySelector("#drawerTitle"),
  drawerBody: document.querySelector(".drawer-body"),
  assistantHome: document.querySelector("#assistantHome"),
  assistantChat: document.querySelector("#assistantChat"),
  defaultQuestions: document.querySelector("#defaultQuestions"),
  refreshQuestionsBtn: document.querySelector("#refreshQuestionsBtn"),
  drawerInput: document.querySelector("#drawerInput"),
  drawerSendBtn: document.querySelector("#drawerSendBtn"),
  drawerUploadBtn: document.querySelector("#drawerUploadBtn"),
  fileInput: document.querySelector("#fileInput"),
  riskOverlay: document.querySelector("#riskOverlay"),
  closeRiskPanelBtn: document.querySelector("#closeRiskPanelBtn"),
  riskTabs: document.querySelector("#riskTabs"),
  filterChips: document.querySelector("#filterChips"),
  riskList: document.querySelector("#riskList"),
  confirmModal: document.querySelector("#confirmModal"),
  modalTitle: document.querySelector("#modalTitle"),
  modalDesc: document.querySelector("#modalDesc"),
  cancelModalBtn: document.querySelector("#cancelModalBtn"),
  confirmActionBtn: document.querySelector("#confirmActionBtn"),
  toast: document.querySelector("#toast"),
};

function showToast(text) {
  els.toast.textContent = text;
  els.toast.classList.add("is-visible");
  window.setTimeout(() => els.toast.classList.remove("is-visible"), 1800);
}

function scrollDrawerToLatest() {
  window.requestAnimationFrame(() => {
    const latest = els.assistantChat.lastElementChild;
    if (latest) latest.scrollIntoView({ block: "end", behavior: "smooth" });
    els.drawerBody.scrollTop = els.drawerBody.scrollHeight;
  });
}

function renderQuestions() {
  els.defaultQuestions.innerHTML = questionSets[state.questionSet]
    .map(
      (text) => `
        <button type="button" data-question="${text}">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" /><path d="M14 2v6h6M8 13h8M8 17h5" /></svg>
          ${text}
        </button>
      `,
    )
    .join("");
}

function openDrawer() {
  els.aiDrawer.classList.add("is-open");
  els.aiDrawer.setAttribute("aria-hidden", "false");
}

function closeDrawer() {
  els.aiDrawer.classList.remove("is-open");
  els.riskOverlay.classList.add("is-hidden");
  els.aiDrawer.setAttribute("aria-hidden", "true");
}

function resetAssistant() {
  els.assistantHome.classList.remove("is-hidden");
  els.assistantChat.classList.add("is-hidden");
  els.assistantChat.innerHTML = "";
  els.drawerTitle.classList.add("is-hidden");
  els.drawerInput.value = "";
  els.drawerSendBtn.classList.remove("is-ready");
  els.riskOverlay.classList.add("is-hidden");
}

function enterChat(userText) {
  els.assistantHome.classList.add("is-hidden");
  els.assistantChat.classList.remove("is-hidden");
  els.drawerTitle.classList.remove("is-hidden");
  els.assistantChat.innerHTML = `
    <div class="chat-message user">${userText}</div>
    <div class="chat-message ai">
      <h3>已读取当前选中的租赁合同</h3>
      我将基于宿主页面选中的《星河中心 3F 商铺租赁合同》进行检查，重点关注租赁主体、租金与押金、付款周期、免租期、提前解除、违约责任、发票税率和签署授权。
    </div>
  `;
  runAnalysis();
}

function runAnalysis() {
  els.assistantChat.innerHTML += `
    <div class="analysis-card">
      <strong>AI 正在检查《星河中心 3F 商铺租赁合同》</strong>
      <p id="analysisText">抽取合同关键条款</p>
      <div class="progress-track"><div id="drawerProgressBar" class="progress-bar"></div></div>
      <div id="drawerAnalysisSteps" class="analysis-steps"></div>
    </div>
  `;
  const text = document.querySelector("#analysisText");
  const bar = document.querySelector("#drawerProgressBar");
  const stepsEl = document.querySelector("#drawerAnalysisSteps");
  let index = 0;
  const renderSteps = () => {
    stepsEl.innerHTML = analysisSteps
      .map((step, i) => `<span class="analysis-step ${i < index ? "is-done" : i === index ? "is-active" : ""}">${step}</span>`)
      .join("");
  };
  renderSteps();
  const timer = window.setInterval(() => {
    index += 1;
    const safeIndex = Math.min(index, analysisSteps.length - 1);
    text.textContent = analysisSteps[safeIndex];
    bar.style.width = `${Math.min(index * 28, 100)}%`;
    renderSteps();
    if (index >= analysisSteps.length) {
      window.clearInterval(timer);
      state.analyzed = true;
      applyAnalysisResult();
      appendConclusionMessage();
    }
  }, 420);
}

function applyAnalysisResult() {
  state.opinionText = opinions.return;
  showToast("AI 已生成审批建议");
}

function appendConclusionMessage() {
  els.assistantChat.innerHTML += `
    <div class="chat-message ai">
      <h3>建议退回修改后再审批</h3>
      本合同存在 3 项高风险和 5 项需关注事项，其中提前解除权不对等、押金退还条件不清晰、合同主体授权材料缺失会影响合同履约和审批合规。
      <div class="message-actions">
        <button id="drawerOpenRiskBtn" class="primary-btn" type="button">查看风险明细</button>
        <button id="drawerGenerateOpinionBtn" type="button">生成退回意见</button>
        <button id="drawerReturnBtn" type="button">退回修改</button>
      </div>
    </div>
  `;
  scrollDrawerToLatest();
  document.querySelector("#drawerOpenRiskBtn").addEventListener("click", appendRiskDetailsMessage);
  document.querySelector("#drawerGenerateOpinionBtn").addEventListener("click", () => {
    state.opinionText = opinions.return;
    appendOpinionMessage();
  });
  document.querySelector("#drawerReturnBtn").addEventListener("click", () => openActionModal("return"));
}

function appendRiskDetailsMessage() {
  const riskItems = [...normalizeItems("legal").filter((item) => item.level === "risk"), ...normalizeItems("compliance").filter((item) => item.level === "risk")];
  els.assistantChat.innerHTML += `
    <div class="chat-message ai risk-flow-card">
      <h3>风险明细</h3>
      <p>已识别 3 项高风险，建议优先处理以下条款后再继续审批。</p>
      <div class="inline-risk-list">
        ${riskItems
          .map(
            (item) => `
              <article class="inline-risk-item">
                <header>
                  <strong>${item.title}</strong>
                  <span class="level ${item.level}">高风险</span>
                </header>
                <dl>
                  <div><dt>条款原文</dt><dd>${item.original}</dd></div>
                  <div><dt>审批影响</dt><dd>${item.impact}</dd></div>
                  <div><dt>建议动作</dt><dd>${item.suggestion}</dd></div>
                </dl>
                <div class="risk-actions">
                  <button data-copy="${item.suggestion}" type="button">复制建议</button>
                  <button data-add="${item.title}：${item.suggestion}" type="button">加入审批意见</button>
                  <button data-known type="button">标记已知悉</button>
                </div>
              </article>
            `,
          )
          .join("")}
      </div>
      <div class="message-actions">
        <button id="inlineGenerateOpinionBtn" class="primary-btn" type="button">生成退回意见</button>
        <button id="inlineReturnBtn" type="button">退回修改</button>
      </div>
    </div>
  `;
  scrollDrawerToLatest();
  document.querySelector("#inlineGenerateOpinionBtn").addEventListener("click", () => {
    state.opinionText = opinions.return;
    appendOpinionMessage();
  });
  document.querySelector("#inlineReturnBtn").addEventListener("click", () => openActionModal("return"));
}

function appendOpinionMessage() {
  els.assistantChat.innerHTML += `
    <div class="chat-message ai">
      <h3>退回意见草稿</h3>
      ${state.opinionText}
      <div class="message-actions">
        <button id="copyDraftBtn" type="button">复制意见</button>
        <button id="formalDraftBtn" type="button">更正式</button>
        <button id="shortDraftBtn" type="button">更简短</button>
      </div>
    </div>
  `;
  scrollDrawerToLatest();
  document.querySelector("#copyDraftBtn").addEventListener("click", () => copyText(state.opinionText, "审批意见已复制"));
  document.querySelector("#formalDraftBtn").addEventListener("click", () => {
    state.opinionText = opinions.formal;
    appendOpinionMessage();
  });
  document.querySelector("#shortDraftBtn").addEventListener("click", () => {
    state.opinionText = opinions.short;
    appendOpinionMessage();
  });
}

function normalizeItems(group) {
  return riskGroups[group].items.map(([level, title, original, rule, impact, suggestion]) => ({ level, title, original, rule, impact, suggestion }));
}

function renderRiskPanel() {
  els.riskTabs.innerHTML = Object.entries(riskGroups)
    .map(([key, group]) => `<button class="${key === state.activeTab ? "is-active" : ""}" data-tab="${key}" type="button">${group.label}</button>`)
    .join("");
  const counts = { risk: 0, warning: 0, pass: 0 };
  normalizeItems(state.activeTab).forEach((item) => (counts[item.level] += 1));
  els.filterChips.innerHTML = [
    ["risk", "风险"],
    ["warning", "注意"],
    ["pass", "通过"],
  ]
    .map(([key, label]) => `<button class="${key} ${state.activeFilter === key ? "is-active" : ""}" data-filter="${key}" type="button">${label}(${counts[key]})</button>`)
    .join("");
  const list = normalizeItems(state.activeTab).filter((item) => item.level === state.activeFilter);
  els.riskList.innerHTML = list.length
    ? list
        .map(
          (item) => `
            <article class="risk-item">
              <header><h3>${item.title}</h3><span class="level ${item.level}">${item.level === "risk" ? "高风险" : item.level === "warning" ? "需关注" : "已通过"}</span></header>
              <dl>
                <div><dt>条款原文</dt><dd>${item.original}</dd></div>
                <div><dt>制度依据</dt><dd>${item.rule}</dd></div>
                <div><dt>审批影响</dt><dd>${item.impact}</dd></div>
                <div><dt>建议动作</dt><dd>${item.suggestion}</dd></div>
              </dl>
              <div class="risk-actions">
                <button data-copy="${item.suggestion}" type="button">复制建议</button>
                <button data-add="${item.title}：${item.suggestion}" type="button">加入审批意见</button>
                <button type="button" data-known>标记已知悉</button>
              </div>
            </article>
          `,
        )
        .join("")
    : `<article class="risk-item">当前筛选暂无条目</article>`;
}

function openRiskPanel() {
  state.activeTab = "legal";
  state.activeFilter = "risk";
  renderRiskPanel();
  els.riskOverlay.classList.remove("is-hidden");
}

function openActionModal(action) {
  state.pendingAction = action;
  const map = {
    return: ["确认退回修改？", "本次动作将退回至经办人李若琳，AI 审批意见将同步至审批记录。"],
    legal: ["确认转法务复核？", "本次动作将提交法务复核，当前 AI 风险摘要将作为复核依据。"],
    conditional: ["确认带条件通过？", "本次动作将继续流转至合规复核，并附带 AI 生成的补充条件。"],
    approve: ["确认同意通过？", "本次动作将进入下一审批节点，审批意见将写入演示记录。"],
  };
  els.modalTitle.textContent = map[action][0];
  els.modalDesc.textContent = map[action][1];
  els.confirmModal.classList.remove("is-hidden");
}

function completeAction() {
  const action = state.pendingAction || "return";
  const labels = { return: "已退回经办人李若琳", legal: "已转法务复核", conditional: "已带条件通过", approve: "已同意通过" };
  const opinion = state.opinionText || opinions[action] || opinions.return;
  records.push({ role: "王启明 · 当前审批人", text: `${labels[action]}。审批意见：${opinion}` });
  const selectedStatus = document.querySelector(".table-row.is-selected .status");
  if (action === "return") {
    if (selectedStatus) {
      selectedStatus.textContent = "已退回";
      selectedStatus.className = "status risk";
    }
  } else {
    if (selectedStatus) selectedStatus.textContent = labels[action].replace("已", "");
  }
  els.confirmModal.classList.add("is-hidden");
  showToast(labels[action]);
}

async function copyText(text, message) {
  try {
    await navigator.clipboard.writeText(text);
    showToast(message);
  } catch {
    showToast("当前浏览器暂不支持复制，可手动选择文本");
  }
}

function init() {
  renderQuestions();
}

document.querySelectorAll("[data-nav-toggle]").forEach((button) => {
  button.addEventListener("click", () => {
    const key = button.dataset.navToggle;
    const panel = document.querySelector(`[data-nav-panel="${key}"]`);
    const isOpen = panel.classList.toggle("is-open");
    button.classList.toggle("is-open", isOpen);
    const arrow = button.querySelector(".nav-arrow");
    if (arrow) arrow.textContent = isOpen ? "⌃" : "⌄";
  });
});

els.aiEntryBtn.addEventListener("click", openDrawer);
els.closeDrawerBtn.addEventListener("click", closeDrawer);
els.maximizeDrawerBtn.addEventListener("click", () => els.aiDrawer.classList.toggle("is-maximized"));
els.newChatBtn.addEventListener("click", resetAssistant);
els.refreshQuestionsBtn.addEventListener("click", () => {
  state.questionSet = (state.questionSet + 1) % questionSets.length;
  renderQuestions();
});
els.defaultQuestions.addEventListener("click", (event) => {
  const button = event.target.closest("[data-question]");
  if (button) enterChat(button.dataset.question);
});
els.drawerInput.addEventListener("input", () => els.drawerSendBtn.classList.toggle("is-ready", Boolean(els.drawerInput.value.trim())));
els.drawerSendBtn.addEventListener("click", () => {
  const text = els.drawerInput.value.trim() || "开始审批租赁合同";
  enterChat(text);
});
els.drawerUploadBtn.addEventListener("click", () => els.fileInput.click());
els.fileInput.addEventListener("change", () => {
  openDrawer();
  enterChat("审批当前选中合同");
});
els.riskTabs.addEventListener("click", (event) => {
  const tab = event.target.closest("[data-tab]");
  if (!tab) return;
  state.activeTab = tab.dataset.tab;
  state.activeFilter = "risk";
  renderRiskPanel();
});
els.filterChips.addEventListener("click", (event) => {
  const chip = event.target.closest("[data-filter]");
  if (!chip) return;
  state.activeFilter = chip.dataset.filter;
  renderRiskPanel();
});
els.riskList.addEventListener("click", (event) => {
  handleRiskAction(event);
});
els.assistantChat.addEventListener("click", (event) => {
  handleRiskAction(event);
});

function handleRiskAction(event) {
  const copy = event.target.closest("[data-copy]");
  const add = event.target.closest("[data-add]");
  const known = event.target.closest("[data-known]");
  if (copy) copyText(copy.dataset.copy, "修改建议已复制");
  if (add) {
    state.opinionText = `${state.opinionText || opinions.return}\n\n补充风险：${add.dataset.add}`;
    showToast("已加入审批意见");
  }
  if (known) showToast("已标记为知悉");
}
els.closeRiskPanelBtn.addEventListener("click", () => els.riskOverlay.classList.add("is-hidden"));
els.cancelModalBtn.addEventListener("click", () => els.confirmModal.classList.add("is-hidden"));
els.confirmActionBtn.addEventListener("click", completeAction);
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    els.riskOverlay.classList.add("is-hidden");
    els.confirmModal.classList.add("is-hidden");
    closeDrawer();
  }
});

init();
