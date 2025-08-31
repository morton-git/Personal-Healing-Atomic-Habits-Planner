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

// 新增：自動生成並下載 CSV 檔案
function generateAndDownloadCSV() {
    // 從 localStorage 取得歷史紀錄 (期望結構：{date, totalPoints, mood, checkInReason, consecutiveDays})
    const historyData = JSON.parse(localStorage.getItem('history')) || [];
    // 定義 CSV 標頭，參考 CSV 檔案格式
    let csvContent = "日期 (Date),總累積心質點(Total Points},今日心情(Today's Mood),連續打勾理由(Check-in Reason),連續打勾天數(Consecutive Days)\n";
    historyData.forEach(record => {
        csvContent += `${record.date},${record.totalPoints || 0},${record.mood || ''},${record.checkInReason || ''},${record.consecutiveDays || 0}\n`;
    });
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "history.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// 修改：處理 CSV 匯入，根據 CSV 填充任務名稱與心情紀錄
function handleCSVImport(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const text = e.target.result;
            const lines = text.split('\n').map(line => line.trim()).filter(line => line);
            if (lines.length < 2) {
                alert('CSV 文件格式錯誤。');
                return;
            }
            const headers = lines[0].split(',').map(h => h.trim());
            const dateIndex = headers.indexOf("日期");
            const taskIndex = headers.indexOf("任務名稱");
            const moodIndex = headers.indexOf("心情");
            const progressIndex = headers.indexOf("進度");
            if (dateIndex === -1 || taskIndex === -1 || moodIndex === -1 || progressIndex === -1) {
                alert("CSV 標頭格式錯誤，請確認欄位名稱為：日期, 任務名稱, 心情, 進度");
                return;
            }
            const newData = [];
            for (let i = 1; i < lines.length; i++) {
                const cols = lines[i].split(',').map(c => c.trim());
                if (cols.length < headers.length) continue;
                newData.push({
                    date: cols[dateIndex] || "",
                    task: cols[taskIndex] || "",
                    mood: cols[moodIndex] || "",
                    progress: cols[progressIndex] || ""
                });
            }
            localStorage.setItem('history', JSON.stringify(newData));
            loadHistoryTable();
            alert('CSV 匯入成功！');
        };
        reader.readAsText(file);
    }
}
