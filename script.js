const STORAGE_KEY = "inventoryAppHunter";
let data = JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
let currentCategory = "";
let editingIndex = null; // Track kung aling item yung ineedit

// PAGE SWITCH
function switchTab(id, btn) {
  document.querySelectorAll('.page').forEach(p => p.classList.add('hidden'));
  document.getElementById(id).classList.remove('hidden');
  document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  if (id === 'inventory-section') {
    backToCategories();
    renderCategories();
  }
}

// SAVE DATA
function saveData() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  filterCategories();
}

// ADD CATEGORY
function addCategory() {
  const cat = document.getElementById("new-category").value.trim();
  if (!cat) return alert("Please enter category name");
  if (data[cat]) return alert("Category already exists");
  data[cat] = [];
  document.getElementById("new-category").value = "";
  saveData();
  alert("Category Added!");
}

// SAVE ITEM
function saveItem() {
  const cat = document.getElementById("category-select").value;
  const itemName = document.getElementById("new-item").value.trim();
  const price = parseFloat(document.getElementById("price-required").value) || 0;
  const pricePcs = parseFloat(document.getElementById("price-pcs").value) || null;

  if (!cat) return alert("Please select a category first");
  if (!itemName) return alert("Please enter item name");
  if (price <= 0) return alert("Please enter required price");

  data[cat].push({ name: itemName, price: price, pricePcs: pricePcs });
  document.getElementById("new-item").value = "";
  document.getElementById("price-required").value = "";
  document.getElementById("price-pcs").value = "";
  document.getElementById("category-search").value = "";
  document.getElementById("category-select").value = "";
  saveData();
  alert("Item Saved!");
}

// SEARCHABLE DROPDOWN
function filterCategories() {
  const input = document.getElementById("category-search").value.toLowerCase();
  const dropdown = document.getElementById("category-list-dropdown");
  dropdown.innerHTML = "";
  let hasResult = false;
  for (let cat in data) {
    if (cat.toLowerCase().includes(input)) {
      dropdown.innerHTML += `<div onclick="selectCategory('${cat}')">${cat}</div>`;
      hasResult = true;
    }
  }
  if(!hasResult && input!== "") {
    dropdown.innerHTML = `<div style="color:#8899aa; cursor:default;">No category found</div>`;
  }
  dropdown.classList.add("show");
}
function selectCategory(cat) {
  document.getElementById("category-search").value = cat;
  document.getElementById("category-select").value = cat;
  document.getElementById("category-list-dropdown").classList.remove("show");
}
window.onclick = function(event) {
  if (!event.target.matches('#category-search')) {
    document.getElementById("category-list-dropdown").classList.remove("show");
  }
}

// INVENTORY FUNCTIONS - A-Z SORT + INDEX
function renderCategories() {
  const list = document.getElementById("category-list");
  const alphaIndex = document.getElementById("alpha-index");
  list.innerHTML = "";
  alphaIndex.innerHTML = "";

  let categories = Object.keys(data).sort((a, b) => a.localeCompare(b));
  let grouped = {};
  categories.forEach(cat => {
    let firstLetter = cat[0].toUpperCase();
    if (!grouped[firstLetter]) grouped[firstLetter] = [];
    grouped[firstLetter].push(cat);
  });

  let letters = Object.keys(grouped).sort();
  letters.forEach(letter => {
    list.innerHTML += `<div class="alpha-group" id="group-${letter}">
      <div class="alpha-header">${letter}</div>`;
    grouped[letter].forEach(cat => {
      list.innerHTML += `
        <div class="card" onclick="showItems('${cat}')">
          <span>${cat} (${data[cat].length} items)</span>
          <button class="del-btn" onclick="event.stopPropagation(); deleteCat('${cat}')">X</button>
        </div>
      `;
    });
    list.innerHTML += `</div>`;
    alphaIndex.innerHTML += `<div onclick="scrollToLetter('${letter}')">${letter}</div>`;
  });
}

function scrollToLetter(letter) {
  const element = document.getElementById(`group-${letter}`);
  if (element) {
    element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    document.querySelectorAll('.alpha-index div').forEach(el => el.classList.remove('active'));
    event.target.classList.add('active');
  }
}

// EDIT SPECIFIC ITEM
function editItem(index) {
  editingIndex = index;
  showItems(currentCategory);
}

// CANCEL EDIT
function cancelEdit() {
  editingIndex = null;
  showItems(currentCategory);
}

// SHOW ITEMS FULLSCREEN - PER ITEM EDIT
function showItems(cat) {
  currentCategory = cat;
  document.getElementById("category-view").classList.add("hidden");
  document.getElementById("item-view").classList.remove("hidden");
  document.getElementById("item-view-title").innerText = cat.toUpperCase();

  const box = document.getElementById("item-list");
  if (data[cat].length === 0) {
    box.innerHTML = "No items yet in this category";
    return;
  }

  let sortedItems = [...data[cat]].sort((a, b) => a.name.localeCompare(b.name));

  box.innerHTML = sortedItems.map((item, index) => {
    let originalIndex = data[cat].indexOf(item);

    if (editingIndex === originalIndex) {
      // EDIT MODE FOR THIS ITEM ONLY
      return `
        <div class="item-row editing" id="item-${originalIndex}">
          <input type="text" id="edit-name-${originalIndex}" value="${item.name}">
          <input type="number" id="edit-price-${originalIndex}" value="${item.price}" step="0.01" placeholder="Required Price">
          <input type="number" id="edit-pcs-${originalIndex}" value="${item.pricePcs || ''}" step="0.01" placeholder="/pcs Optional">
          <div class="item-actions">
            <button class="btn-save" onclick="saveItemEdit(${originalIndex})">SAVE</button>
            <button class="btn-delete-item" onclick="deleteItem(${originalIndex})">DELETE</button>
            <button class="btn-cancel" onclick="cancelEdit()">CANCEL</button>
          </div>
        </div>
      `;
    } else {
      // NORMAL VIEW - CLICKABLE
      return `
        <div class="item-row" onclick="editItem(${originalIndex})">
          <div>
            <b>${item.name}</b> <br>
            Price: ₱${item.price.toFixed(2)}
            ${item.pricePcs? ` | ₱${item.pricePcs.toFixed(2)}/pcs` : ''}
          </div>
        </div>
      `;
    }
  }).join("");
}

// SAVE EDITED ITEM
function saveItemEdit(index) {
  const name = document.getElementById(`edit-name-${index}`).value.trim();
  const price = parseFloat(document.getElementById(`edit-price-${index}`).value) || 0;
  const pricePcs = parseFloat(document.getElementById(`edit-pcs-${index}`).value) || null;

  if (!name) return alert("Item name cannot be empty");
  if (price <= 0) return alert("Required price must be > 0");

  data[currentCategory][index] = { name, price, pricePcs };
  editingIndex = null;
  saveData();
  showItems(currentCategory);
  alert("Item Updated!");
}

// DELETE SPECIFIC ITEM
function deleteItem(index) {
  if (confirm(`Delete "${data[currentCategory][index].name}"?`)) {
    data[currentCategory].splice(index, 1);
    editingIndex = null;
    saveData();
    showItems(currentCategory);
  }
}

// BACK BUTTON
function backToCategories() {
  editingIndex = null;
  document.getElementById("item-view").classList.add("hidden");
  document.getElementById("category-view").classList.remove("hidden");
  renderCategories();
}

// DELETE CATEGORY
function deleteCat(cat) {
  if (confirm(`Delete category "${cat}" and all its items?`)) {
    delete data[cat];
    saveData();
    renderCategories();
  }
}

window.onload = () => {
  filterCategories();
}