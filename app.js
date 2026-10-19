'use strict';

// The only download destination; every data-download link uses this value.
const SITE_CONFIG = Object.freeze({ downloadUrl: 'https://www.pgyer.com/liaoji-android' });
const CATEGORIES = Object.freeze({ water: '水料', electric: '电料', floor: '地热' });
// A small, anonymous example based on the App's material vocabulary. Quantities
// use integer thousandths, matching the App's precision without float drift.
const MATERIALS = Object.freeze([
  { id: 'pipe', category: 'water', name: '4分水管', spec: '上水料 · 根', unit: '根', initial: 6000 },
  { id: 'elbow', category: 'water', name: '4分弯头', spec: '上水料 · 个', unit: '个', initial: 8000 },
  { id: 'tee', category: 'water', name: '4分三通', spec: '上水料 · 个', unit: '个', initial: 4000 },
  { id: 'valve', category: 'water', name: '截止阀', spec: '上水料 · 个', unit: '个', initial: 0 },
  { id: 'wire', category: 'electric', name: '铜芯电线', spec: 'BV 2.5 平方 · 卷', unit: '卷', initial: 2000 },
  { id: 'conduit', category: 'electric', name: '穿线管', spec: '20mm · 根', unit: '根', initial: 0 },
  { id: 'box', category: 'electric', name: '接线盒', spec: '86型 · 个', unit: '个', initial: 0 },
  { id: 'socket', category: 'electric', name: '五孔插座', spec: '86型 · 个', unit: '个', initial: 0 },
  { id: 'heating-pipe', category: 'floor', name: '地热管', spec: 'PERT 20mm · 米', unit: '米', initial: 0 },
  { id: 'manifold', category: 'floor', name: '分水器', spec: '地热 · 组', unit: '组', initial: 0 },
  { id: 'insulation', category: 'floor', name: '保温板', spec: '地热 · 平方米', unit: '㎡', initial: 0 },
  { id: 'clip', category: 'floor', name: '地热卡钉', spec: '地热 · 包', unit: '包', initial: 0 }
]);
const STORIES = Object.freeze({
  home: { title: '过去记过的，都找得到。', copy: '按施工地点整理料单，地址、联系人和电话都能搜索。再接到电话时，不必从头翻找。', caption: '我的料单', image: 'assets/app-home.png', alt: '料记 App 料单列表，使用虚构工地与联系人展示' },
  library: { title: '熟悉的材料，放在顺手的位置。', copy: '水料、电料、地热分开整理，常用材料按分类与分组查找。名称、规格和单位，下次不必重新录一遍。', caption: '常用材料库', image: 'assets/app-library.png', alt: '料记 App 常用材料库，展示水料分组与分类定位' },
  quantity: { title: '点一下数字，就能记下用量。', copy: '加减连续录量，点数字直接输入小数。只记数量也可以，价格按需填写，编辑时自动保存。', caption: '编辑材料', image: 'assets/app-quantity.png', alt: '料记 App 录量界面，展示材料数量加减与直接输入控件' },
  pdf: { title: '交出去的，是一张清楚的料单。', copy: '材料与用量分列，按分类整理成 A5 中文 PDF。在 App 内预览后，就能通过系统分享或外部打开。', caption: 'A5 用量版 PDF', image: 'assets/app-pdf.png', alt: '由料记 App 当前 PDF 导出代码生成的匿名施工材料清单示例' }
});
const MAX_MILLI = 999999999; // 999,999.999 per material, safe for integer steps.
const state = { category: 'water', search: '', quantities: new Map(MATERIALS.map(item => [item.id, item.initial])), invalid: new Set() };
const $ = selector => document.querySelector(selector);
const formatQuantity = milli => String(milli / 1000);

function parseQuantity(value) {
  const text = value.trim();
  if (!/^\d+(?:\.\d{1,3})?$/.test(text)) return null;
  const [whole, decimal = ''] = text.split('.');
  const result = Number(whole) * 1000 + Number(decimal.padEnd(3, '0'));
  return Number.isSafeInteger(result) && result <= MAX_MILLI ? result : null;
}

function setMessage(message, isError = false) {
  const messageElement = $('#input-message');
  messageElement.textContent = message;
  messageElement.classList.toggle('is-error', isError);
}

function renderMaterials() {
  const list = $('#material-list');
  const query = state.search.toLocaleLowerCase();
  const shown = MATERIALS.filter(item => item.category === state.category && `${item.name} ${item.spec}`.toLocaleLowerCase().includes(query));
  list.replaceChildren();
  if (!shown.length) {
    const empty = document.createElement('div');
    empty.className = 'empty-search';
    const title = document.createElement('strong');
    title.textContent = '这个分类里，暂时没找到。';
    const hint = document.createElement('span');
    hint.textContent = '换个关键词，或切换分类再找找。';
    empty.append(title, hint);
    list.append(empty);
    return;
  }
  shown.forEach(item => {
    const row = document.createElement('div');
    row.className = 'material-row';
    row.dataset.material = item.id;
    // All interpolated strings below are local constants, never visitor input.
    row.innerHTML = `<div class="material-info"><label for="quantity-${item.id}">${item.name}</label><small>${item.spec}</small></div><div class="stepper"><button type="button" data-step="-1" data-id="${item.id}" aria-label="减少${item.name}用量">−</button><input class="quantity-input" id="quantity-${item.id}" data-id="${item.id}" type="text" inputmode="decimal" autocomplete="off" maxlength="24" aria-label="${item.name}用量（${item.unit}）" aria-describedby="input-message" value="${formatQuantity(state.quantities.get(item.id))}"><button type="button" data-step="1" data-id="${item.id}" aria-label="增加${item.name}用量">＋</button></div>`;
    list.append(row);
    updateStepper(item.id);
  });
}

function updateStepper(id) {
  const row = $(`[data-material="${id}"]`);
  if (!row) return;
  const quantity = state.quantities.get(id);
  row.querySelector('[data-step="-1"]').disabled = quantity === 0;
  row.querySelector('[data-step="1"]').disabled = quantity === MAX_MILLI;
}

function renderPreview() {
  const active = MATERIALS.filter(item => state.quantities.get(item.id) > 0);
  $('#selection-count').textContent = `已选 ${active.length} 项材料`;
  $('#paper-count').textContent = `共 ${active.length} 项材料`;
  const content = $('#preview-content');
  content.replaceChildren();
  if (!active.length) {
    const empty = document.createElement('p');
    empty.className = 'paper-empty';
    empty.textContent = '还没记用量。为一项材料加一点试试。';
    content.append(empty);
    return;
  }
  let number = 0;
  Object.entries(CATEGORIES).forEach(([category, name]) => {
    const items = active.filter(item => item.category === category);
    if (!items.length) return;
    const group = document.createElement('section');
    group.className = 'receipt-group';
    group.innerHTML = `<h3>${name}</h3><table class="receipt-table" aria-label="${name}示例用量"><thead><tr><th scope="col">序</th><th scope="col">材料名称</th><th scope="col">用量</th></tr></thead><tbody>${items.map(item => `<tr><td>${++number}</td><td>${item.name}</td><td>${formatQuantity(state.quantities.get(item.id))}<span class="receipt-unit">${item.unit}</span></td></tr>`).join('')}</tbody></table>`;
    content.append(group);
  });
}

function commitInput(input, normalize = false) {
  const id = input.dataset.id;
  const value = parseQuantity(input.value);
  if (value === null) {
    state.invalid.add(id);
    input.setAttribute('aria-invalid', 'true');
    setMessage('请输入 0–999999.999 的用量，最多三位小数；预览保留上次有效用量。', true);
    return false;
  }
  state.invalid.delete(id);
  input.removeAttribute('aria-invalid');
  state.quantities.set(id, value);
  if (normalize) input.value = formatQuantity(value);
  setMessage(state.invalid.size ? '请修正标红的用量，预览保留上次有效数值。' : '', state.invalid.size > 0);
  updateStepper(id);
  renderPreview();
  return true;
}

function switchCategory(category) {
  state.category = category;
  // Inputs disappearing under filtering/tab switches return to their last valid
  // value; malformed drafts never alter the receipt or silently round a value.
  state.invalid.clear();
  setMessage('');
  document.querySelectorAll('[data-category]').forEach(tab => {
    const selected = tab.dataset.category === category;
    tab.classList.toggle('active', selected);
    tab.setAttribute('aria-selected', String(selected));
    tab.tabIndex = selected ? 0 : -1;
  });
  $('#material-panel').setAttribute('aria-labelledby', `tab-${category}`);
  renderMaterials();
}

function switchStory(key) {
  const story = STORIES[key];
  document.querySelectorAll('[data-story]').forEach(tab => {
    const selected = tab.dataset.story === key;
    tab.classList.toggle('active', selected);
    tab.setAttribute('aria-selected', String(selected));
    tab.tabIndex = selected ? 0 : -1;
  });
  $('#story-panel').setAttribute('aria-labelledby', `story-tab-${key}`);
  $('#story-panel').classList.toggle('pdf-mode', key === 'pdf');
  $('#story-title').textContent = story.title;
  $('#story-copy').textContent = story.copy;
  $('#stage-caption').textContent = story.caption;
  $('#asset-caption').textContent = key === 'pdf' ? 'App 导出文件 · 匿名示例' : '真实 App 界面 · 演示资料';
  const screenshot = $('#app-screenshot');
  screenshot.src = story.image;
  screenshot.alt = story.alt;
  screenshot.width = key === 'pdf' ? 840 : 780;
  screenshot.height = key === 'pdf' ? 1192 : 1688;
}

function addTabKeyboardNavigation(container, attribute, activate) {
  container.addEventListener('keydown', event => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    const tabs = [...container.querySelectorAll('[role="tab"]')];
    const current = tabs.indexOf(document.activeElement);
    if (current < 0) return;
    event.preventDefault();
    let next;
    if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = tabs.length - 1;
    else next = (current + (event.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length;
    activate(tabs[next].dataset[attribute]);
    tabs[next].focus();
  });
}

document.querySelectorAll('[data-download]').forEach(link => { link.href = SITE_CONFIG.downloadUrl; });
document.querySelectorAll('[data-category]').forEach(tab => tab.addEventListener('click', () => switchCategory(tab.dataset.category)));
document.querySelectorAll('[data-story]').forEach(tab => tab.addEventListener('click', () => switchStory(tab.dataset.story)));
addTabKeyboardNavigation($('.category-tabs'), 'category', switchCategory);
addTabKeyboardNavigation($('.story-tabs'), 'story', switchStory);

$('#material-search').addEventListener('input', event => {
  state.search = event.target.value.trim();
  state.invalid.clear();
  setMessage('');
  renderMaterials();
});
$('#material-list').addEventListener('input', event => {
  if (event.target.matches('.quantity-input')) commitInput(event.target);
});
$('#material-list').addEventListener('focusout', event => {
  if (event.target.matches('.quantity-input')) commitInput(event.target, true);
});
$('#material-list').addEventListener('keydown', event => {
  if (!event.target.matches('.quantity-input')) return;
  if (event.key === 'Enter') { event.preventDefault(); commitInput(event.target, true); }
  if (event.key === 'Escape') {
    event.target.value = formatQuantity(state.quantities.get(event.target.dataset.id));
    commitInput(event.target, true);
  }
});
$('#material-list').addEventListener('click', event => {
  const button = event.target.closest('[data-step]');
  if (!button) return;
  const id = button.dataset.id;
  const next = Math.max(0, Math.min(MAX_MILLI, state.quantities.get(id) + Number(button.dataset.step) * 1000));
  state.quantities.set(id, next);
  state.invalid.delete(id);
  const input = $(`#quantity-${id}`);
  input.value = formatQuantity(next);
  input.removeAttribute('aria-invalid');
  setMessage(state.invalid.size ? '请修正标红的用量，预览保留上次有效数值。' : '', state.invalid.size > 0);
  updateStepper(id);
  renderPreview();
});
$('#reset-demo').addEventListener('click', () => {
  state.quantities = new Map(MATERIALS.map(item => [item.id, item.initial]));
  state.search = '';
  $('#material-search').value = '';
  switchCategory('water');
  renderPreview();
  setMessage('已恢复最初的示例用量。');
});
renderMaterials();
renderPreview();
