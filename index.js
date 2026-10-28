const STORAGE_KEY = "kakeibo-entries";
const form = document.querySelector("form");
const entryDateInput = document.querySelector("#entry-date");
const entryItemInput = document.querySelector("#entry-item");
const entryTypeInput = document.querySelector("#entry-type");
const entryAmountInput = document.querySelector("#entry-amount");
const entriesBody = document.querySelector("tbody");
const totalOutput = document.querySelector("output[aria-label='収支合計']");
const statusMessage = document.querySelector("#app-status");
const yenFormatter = new Intl.NumberFormat("ja-JP", {
  style: "currency",
  currency: "JPY",
  maximumFractionDigits: 0,
});

let entries = [];

function isEntry(value) {
  return (
    value !== null &&
    typeof value === "object" &&
    typeof value.date === "string" &&
    value.date !== "" &&
    typeof value.item === "string" &&
    value.item.trim() !== "" &&
    (value.type === "income" || value.type === "expense") &&
    Number.isSafeInteger(value.amount) &&
    value.amount > 0
  );
}

function loadEntries() {
  const savedEntries = localStorage.getItem(STORAGE_KEY);

  if (savedEntries === null) {
    return [];
  }

  const parsedEntries = JSON.parse(savedEntries);

  if (!Array.isArray(parsedEntries) || !parsedEntries.every(isEntry)) {
    throw new Error("保存データの形式が正しくありません。");
  }

  return parsedEntries;
}

function showStatus(message) {
  statusMessage.textContent = message;
  statusMessage.hidden = false;
}

function renderEntries() {
  entriesBody.replaceChildren();

  if (entries.length === 0) {
    const row = document.createElement("tr");
    const cell = document.createElement("td");
    cell.colSpan = 4;
    cell.textContent = "記録はまだありません。";
    row.append(cell);
    entriesBody.append(row);
  } else {
    for (const entry of entries) {
      const row = document.createElement("tr");
      const values = [
        entry.date,
        entry.item,
        entry.type === "income" ? "収入" : "支出",
        yenFormatter.format(entry.amount),
      ];

      for (const value of values) {
        const cell = document.createElement("td");
        cell.textContent = value;
        row.append(cell);
      }

      entriesBody.append(row);
    }
  }

  const total = entries.reduce(
    (sum, entry) =>
      sum + (entry.type === "income" ? entry.amount : -entry.amount),
    0,
  );
  totalOutput.textContent = yenFormatter.format(total);
}

function disableForm() {
  form.querySelectorAll("input, select, button").forEach((control) => {
    control.disabled = true;
  });
}

form.addEventListener("submit", (event) => {
  event.preventDefault();

  const item = entryItemInput.value.trim();
  const amount = Number(entryAmountInput.value);
  const entry = {
    date: entryDateInput.value,
    item,
    type: entryTypeInput.value,
    amount,
  };

  if (
    !entry.date ||
    !entry.item ||
    (entry.type !== "income" && entry.type !== "expense") ||
    !Number.isSafeInteger(entry.amount) ||
    entry.amount <= 0
  ) {
    showStatus("日付・品目・収支区分・1円以上の金額を正しく入力してください。");
    return;
  }

  const updatedEntries = [...entries, entry];

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedEntries));
  } catch (error) {
    console.error("家計簿データを保存できませんでした。", error);
    showStatus("データを保存できませんでした。ブラウザーの保存領域を確認してください。");
    return;
  }

  entries = updatedEntries;
  renderEntries();
  form.reset();
  showStatus("記録を保存しました。");
});

let storageLoaded = false;

try {
  entries = loadEntries();
  storageLoaded = true;
} catch (error) {
  console.error("家計簿データを読み込めませんでした。", error);
  showStatus("保存データを読み込めませんでした。データ形式やブラウザーの設定を確認してください。");
  disableForm();
}

if (storageLoaded) {
  renderEntries();
}
