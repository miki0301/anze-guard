// src/utils/excelGenerator.js
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

// ---------------------------------------------------------
// 1. 智慧排程邏輯：將 UI 的 PDCA 資料轉為甘特圖任務
// ---------------------------------------------------------
const generateTasksFromData = (visitData) => {
  const tasks = [];

  // A. 固定例行項目 (每月都有)
  tasks.push({ 
    category: '例行服務', 
    name: '護理師臨場訪視服務', 
    schedule: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] 
  });

  // B. 四大計畫補強 (根據 PDCA 的 'P' 是否勾選來判斷)
  // 邏輯：如果 'P(計畫)' 為 false (未勾選)，代表缺計畫，需排入建置
  
  // 1. 過勞預防
  if (!visitData.plans.overwork.p) {
    tasks.push({
      category: '重點計畫',
      name: '異常工作負荷(過勞)預防計畫建置',
      schedule: [1, 2, 3] // 預設排在 Q1
    });
  }

  // 2. 人因危害
  if (!visitData.plans.ergo.p) {
    tasks.push({
      category: '重點計畫',
      name: '人因性危害預防計畫建置',
      schedule: [4, 5, 6] // 預設排在 Q2
    });
  }

  // 3. 不法侵害
  if (!visitData.plans.violence.p) {
    tasks.push({
      category: '重點計畫',
      name: '不法侵害預防計畫建置',
      schedule: [7, 8, 9] // 預設排在 Q3
    });
  }

  // 4. 母性保護
  if (!visitData.plans.maternal.p) {
    tasks.push({
      category: '重點計畫',
      name: '母性健康保護計畫建置',
      schedule: [1, 4, 7, 10] // 每季檢核
    });
  }

  // C. 現場危害對應
  if (visitData.hazards.noise) {
    tasks.push({
      category: '危害管理',
      name: '噪音作業聽力保護計畫與特殊健檢追蹤',
      schedule: [5, 6]
    });
  }
  
  if (visitData.hazards.chemical) {
    tasks.push({
      category: '危害管理',
      name: '化學品分級管理 (CCB) 與 SDS 更新檢核',
      schedule: [8, 9]
    });
  }

  // D. 年度總結
  tasks.push({
    category: '年度評估',
    name: '年度成效評估與次年度計畫規劃',
    schedule: [12]
  });

  return tasks;
};

// ---------------------------------------------------------
// 2. Excel 生成核心函式
// ---------------------------------------------------------
export const exportAnnualPlanExcel = async (visitData, goals, adminStatus = 'DRAFT') => {
  // 建立活頁簿
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('年度健康服務計畫');

  // 定義樣式 (Style Constants)
  const borderStyle = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
  const headerFill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEEEEEE' } }; // 淺灰
  const activeCellFill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF92D050' } }; // 亮綠 (甘特圖色塊)
  const fontBold = { name: '微軟正黑體', size: 12, bold: true };
  const fontNormal = { name: '微軟正黑體', size: 11 };

  // -------------------------------------------------------
  // 區塊一：表頭資訊
  // -------------------------------------------------------
  sheet.mergeCells('A1:N1');
  const titleCell = sheet.getCell('A1');
  titleCell.value = `年度勞工健康服務執行計畫書 ${adminStatus === 'APPROVED' ? '' : '(草稿/待審核)'}`;
  titleCell.font = { name: '微軟正黑體', size: 18, bold: true };
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
  
  sheet.mergeCells('A2:N2');
  sheet.getCell('A2').value = `事業單位：${visitData.companyName || '未填寫'}   |   年度：${new Date().getFullYear()}   |   製表日期：${new Date().toLocaleDateString()}`;
  sheet.getCell('A2').alignment = { horizontal: 'center' };

  // -------------------------------------------------------
  // 區塊二：年度目標 (Short/Mid/Long Term Goals)
  // -------------------------------------------------------
  sheet.addRow(['壹、年度策略目標']);
  sheet.mergeCells('A3:N3');
  sheet.getCell('A3').font = fontBold;
  sheet.getCell('A3').fill = headerFill;

  // 目標標題列
  const goalHeaderRow = sheet.addRow(['類別', '目標內容', '', '', '', '', '', '', '', '', '', '', '', '']);
  sheet.mergeCells(`B${goalHeaderRow.number}:N${goalHeaderRow.number}`);
  
  // 填入目標
  const goalRows = [
    ['短期目標 (1-3月)', goals.shortTerm || '完成缺失計畫建置'],
    ['中期目標 (1年)', goals.midTerm || '降低危害風險'],
    ['長期目標 (3年)', goals.longTerm || '建立健康職場認證']
  ];

  goalRows.forEach((goal) => {
    const row = sheet.addRow(goal);
    sheet.mergeCells(`B${row.number}:N${row.number}`);
    row.getCell(1).font = fontBold;
    row.getCell(2).font = fontNormal;
    row.eachCell((cell) => { cell.border = borderStyle; });
  });
  sheet.addRow([]); // 空行間隔

  // -------------------------------------------------------
  // 區塊三：甘特圖 (Gantt Chart)
  // -------------------------------------------------------
  sheet.addRow(['貳、執行進度甘特圖']);
  sheet.mergeCells(`A${sheet.lastRow.number}:N${sheet.lastRow.number}`);
  sheet.lastRow.getCell(1).font = fontBold;
  sheet.lastRow.getCell(1).fill = headerFill;

  // 甘特圖標題列
  const headerRow = sheet.addRow(['類別', '執行項目', '1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月']);
  headerRow.eachCell((cell) => {
    cell.fill = headerFill;
    cell.font = fontBold;
    cell.alignment = { horizontal: 'center' };
    cell.border = borderStyle;
  });

  // 設定欄寬
  sheet.getColumn(1).width = 15; // 類別
  sheet.getColumn(2).width = 40; // 執行項目
  for (let i = 3; i <= 14; i++) {
    sheet.getColumn(i).width = 5; // 月份格子
  }

  // 取得自動排程任務
  const tasks = generateTasksFromData(visitData);

  // 繪製任務列
  tasks.forEach((task) => {
    const row = sheet.addRow([task.category, task.name]);
    
    // 樣式設定
    row.getCell(1).alignment = { vertical: 'middle', horizontal: 'center' };
    row.getCell(2).alignment = { vertical: 'middle' };
    row.eachCell((cell) => { cell.border = borderStyle; cell.font = fontNormal; });

    // 塗色邏輯：遍歷 1-12 月
    for (let month = 1; month <= 12; month++) {
      if (task.schedule.includes(month)) {
        // 月份欄位從第 3 欄開始 (1月=Col 3, 2月=Col 4...)
        const cell = row.getCell(month + 2);
        cell.fill = activeCellFill;
      }
    }
  });

  // -------------------------------------------------------
  // 區塊四：簽核欄位
  // -------------------------------------------------------
  sheet.addRow([]);
  sheet.addRow([]);
  const footerRow = sheet.addRow(['專案護理師：', '', '', '', '企業負責人/代表：', '', '', '', '安澤主管審核：', '']);
  footerRow.getCell(1).font = fontBold;
  footerRow.getCell(5).font = fontBold;
  footerRow.getCell(9).font = fontBold;
  
  // 簽核狀態顯示
  if (adminStatus === 'APPROVED') {
    footerRow.getCell(10).value = '✅ 已核准';
    footerRow.getCell(10).font = { color: { argb: 'FF008000' }, bold: true };
  } else {
    footerRow.getCell(10).value = '⏳ 待審核';
    footerRow.getCell(10).font = { color: { argb: 'FFFF0000' }, bold: true };
  }

  // 輸出檔案
  const buffer = await workbook.xlsx.writeBuffer();
  const fileName = `${visitData.companyName || '未命名'}_年度健康服務計畫.xlsx`;
  saveAs(new Blob([buffer]), fileName);
};