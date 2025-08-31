// 儲存與讀取 CSV 的工具函式
function saveCSVData(csv) {
    localStorage.setItem('healing_tracker_csv', csv);
}
function loadCSVData() {
    return localStorage.getItem('healing_tracker_csv') || '';
}
function parseCSV(csv) {
    const rows = csv.split('\n').filter(Boolean);
    return rows.map(row => row.split(','));
}

// 建立 Modal 與表格顯示歷史紀錄的函式
function showHistoryModal() {
    const csv = loadCSVData();
    const data = parseCSV(csv);
    if (data.length === 0) return;
    
    // 產生表格 HTML（假設第一列是標題）
    let tableHTML = '<table border="1"><thead><tr>';
    data[0].forEach(header => {
        tableHTML += `<th>${header}</th>`;
    });
    tableHTML += '</tr></thead><tbody>';
    data.slice(1).forEach(row => {
        tableHTML += '<tr>';
        row.forEach(cell => {
            tableHTML += `<td>${cell}</td>`;
        });
        tableHTML += '</tr>';
    });
    tableHTML += '</tbody></table>';
    
    // 將表格塞入 modal 內容區，並顯示 modal（modal 需預先在 HTML 中定義）
    document.getElementById('historyModalContent').innerHTML = tableHTML;
    document.getElementById('historyModal').style.display = 'block';
}

// 監聽「更新歷史紀錄」按鈕
function initHistoryButton() {
    const btn = document.getElementById('openHistoryModal');
    if (btn) {
        btn.addEventListener('click', openHistoryModal);
    } else {
        console.warn("openHistoryModal button not found");
    }
}

document.addEventListener('DOMContentLoaded', initHistoryButton);

// 加入每日歷史紀錄生成與儲存邏輯示例

function addDailyHistoryRecord() {
    const todayString = new Date().toDateString();
    let historyData = JSON.parse(localStorage.getItem('history')) || [];
    // 檢查是否今日已有記錄
    if (!historyData.some(record => record.date === todayString)) {
        const newRecord = {
            date: todayString,
            task: '自動生成歷史任務記錄', // 可根據需求自訂
            mood: '今日心情待記錄',
            progress: '未完成'
        };
        historyData.push(newRecord);
        localStorage.setItem('history', JSON.stringify(historyData));
    }
}

// 請在程序初始化時呼叫此函數
addDailyHistoryRecord();

// 修改：更新生成並下載 CSV 檔案的函式，CSV 標頭與欄位更新
function generateAndDownloadCSV() {
    const historyData = JSON.parse(localStorage.getItem('history')) || [];
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "日期,總累積心質點,今日心情,連續打勾理由,連續打勾天數\n"; // 更新 CSV 標頭
    historyData.forEach(record => {
        csvContent += `${record.date},${record.totalLightPoints || 0},${record.todayMood || ''},${record.checkInReason || ''},${record.consecutiveDays || 0}\n`;
    });
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "history.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// 修改：更新 CSV 匯入函式，根據新的 CSV 標頭解析資料
function handleCSVImport(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const text = e.target.result;
            const lines = text.split('\n').map(line => line.trim()).filter(Boolean);
            if (lines.length < 2) {
                alert('CSV 文件格式錯誤。');
                return;
            }
            const headers = lines[0].split(',').map(h => h.trim());
            const dateIndex = headers.indexOf("日期");
            const totalPointsIndex = headers.indexOf("總累積心質點");
            const moodIndex = headers.indexOf("今日心情");
            const reasonIndex = headers.indexOf("連續打勾理由");
            const consecutiveIndex = headers.indexOf("連續打勾天數");
            if (dateIndex === -1 || totalPointsIndex === -1 || moodIndex === -1 || reasonIndex === -1 || consecutiveIndex === -1) {
                alert("CSV 標頭格式錯誤，請確認欄位名稱為：日期, 總累積心質點, 今日心情, 連續打勾理由, 連續打勾天數");
                return;
            }
            const newData = [];
            for (let i = 1; i < lines.length; i++) {
                const cols = lines[i].split(',').map(c => c.trim());
                if (cols.length < headers.length) continue;
                newData.push({
                    date: cols[dateIndex] || "",
                    totalLightPoints: cols[totalPointsIndex] || 0,
                    todayMood: cols[moodIndex] || "",
                    checkInReason: cols[reasonIndex] || "",
                    consecutiveDays: cols[consecutiveIndex] || 0
                });
            }
            localStorage.setItem('history', JSON.stringify(newData));
            if (typeof loadHistoryTable === 'function') {
                loadHistoryTable();
            }
            alert('CSV 匯入成功！');
        };
        reader.readAsText(file);
    }
}

// 新增：更新今日紀錄中各欄位資料
function updateHistoryRecord() {
    const todayString = new Date().toDateString();
    let historyData = JSON.parse(localStorage.getItem('history')) || [];
    let record = historyData.find(item => item.date === todayString);

    // 從 DOM 元素取得最新數值
    const totalLightPoints = document.getElementById('totalLightPoints')
        ? document.getElementById('totalLightPoints').innerText : '';
    const todayMood = document.getElementById('currentMood')
        ? document.getElementById('currentMood').innerText : '';
    const checkInReason = document.getElementById('streakReasonInput')
        ? document.getElementById('streakReasonInput').value : '';
    const consecutiveDays = document.getElementById('streakDays')
        ? document.getElementById('streakDays').innerText : '';

    if (!record) {
        record = {
            date: todayString,
            totalLightPoints,
            todayMood,
            checkInReason,
            consecutiveDays
        };
        historyData.push(record);
    } else {
        record.totalLightPoints = totalLightPoints;
        record.todayMood = todayMood;
        record.checkInReason = checkInReason;
        record.consecutiveDays = consecutiveDays;
    }
    localStorage.setItem('history', JSON.stringify(historyData));
}

// 修改：載入歷史紀錄表格前先更新紀錄
function loadHistoryTable() {
    updateHistoryRecord(); // 確保最新狀態已紀錄
    const tableBody = document.querySelector('#historyTable tbody');
    tableBody.innerHTML = ''; // ...existing code...
    const historyData = JSON.parse(localStorage.getItem('history')) || [];
    historyData.forEach(item => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${item.date}</td>
            <td>${item.totalLightPoints || ''}</td>
            <td>${item.todayMood || ''}</td>
            <td>${item.checkInReason || ''}</td>
            <td>${item.consecutiveDays || ''}</td>
        `;
        tableBody.appendChild(row);
    });
    // ...existing code...
}

// 修改：更新連續打勾理由保存函式，完成後同樣更新歷史紀錄
function saveStreakReasonToHistory() {
    const streakInput = document.getElementById('streakReasonInput');
    if (!streakInput) {
        console.error("找不到 streakReasonInput 元素");
        return;
    }
    const reason = streakInput.value.trim();
    // 呼叫通用更新函式，讓其它狀態欄位也一併記錄
    updateHistoryRecord();
    alert("連續打勾理由已保存至 CSV 歷史紀錄！");
}

// 監聽連續打勾理由儲存按鈕
document.addEventListener('DOMContentLoaded', () => {
    const saveButton = document.getElementById('saveStreakReasonButton');
    if (saveButton) {
        saveButton.addEventListener('click', saveStreakReasonToHistory);
    } else {
        console.warn("saveStreakReasonButton 元素未找到");
    }
});
