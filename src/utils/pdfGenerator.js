// src/utils/pdfGenerator.js
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// 1. 輔助函式：載入字型 (加入更強的錯誤檢查)
const loadFont = async (filename) => {
  try {
    // 取得當前網站的根目錄網址，例如 http://localhost:5173
    const baseUrl = window.location.origin;
    const fullUrl = `${baseUrl}/${filename}`;
    
    console.log(`正在嘗試載入字型: ${fullUrl}`); // 在 Console 顯示路徑，方便除錯

    const response = await fetch(fullUrl);
    if (!response.ok) {
      throw new Error(`HTTP 錯誤! 狀態: ${response.status}`);
    }
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (reader.result) {
          resolve(reader.result.split(',')[1]); 
        } else {
          resolve(null);
        }
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error("❌ 字型檔載入失敗:", error);
    return null;
  }
};

export const generateChecklistPDF = async (data) => {
  try {
    const doc = new jsPDF();

    // 2. 載入中文字型
    // 使用 NotoSansTC-Regular.ttf
    const fontBase64 = await loadFont('NotoSansTC-Regular.ttf');
    
    if (fontBase64) {
      doc.addFileToVFS('NotoSansTC.ttf', fontBase64);
      doc.addFont('NotoSansTC.ttf', 'NotoSansTC', 'normal');
      doc.setFont('NotoSansTC');
      console.log("✅ 中文字型載入成功！");
    } else {
      // 如果載入失敗，跳出視窗警告使用者
      alert("⚠️ 字型載入失敗！\n\n這會導致 PDF 出現亂碼。\n請按 F12 開啟 Console，將紅色錯誤訊息截圖給工程師。");
    }

    // 3. 設定樣式 (強制所有表格使用 NotoSansTC)
    const fontName = fontBase64 ? 'NotoSansTC' : 'helvetica';
    
    const styles = { 
      font: fontName, 
      fontStyle: 'normal', 
      fontSize: 10, 
      cellPadding: 1.5, 
      lineColor: [0, 0, 0], 
      lineWidth: 0.1 
    };
    
    const headStyles = { 
      font: fontName, 
      fillColor: [240, 240, 240], 
      textColor: [0, 0, 0], 
      fontStyle: 'bold', 
      halign: 'center', 
      lineWidth: 0.1, 
      lineColor: [0, 0, 0] 
    };

    const check = (condition) => condition ? '■' : '□';
    const textCheck = (val, target) => val === target ? '■' : '□';

    // ---------------------------------------------------------
    // 開始繪製 PDF 內容
    // ---------------------------------------------------------
    doc.setFontSize(16);
    doc.text("安澤健康顧問 (ANZECARE CONSULTING)", 105, 15, { align: "center" });
    doc.setFontSize(14);
    doc.text("首次臨場服務工作檢核表 (優化版 v2.0)", 105, 23, { align: "center" });

    let accRoleText = '';
    if (data.accompanyingRole === 'labor') accRoleText = '勞安';
    else if (data.accompanyingRole === 'hr') accRoleText = '人資';
    else accRoleText = data.accompanyingRoleNote || '其他';
    const accDisplay = data.accompanyingName ? `${data.accompanyingName} (${accRoleText})` : '';
    const shiftDisplay = `${check(data.shiftType==='normal')}常日班  ${check(data.shiftType==='shift')}輪班 (班別: ${data.shiftNote||'__________'})`;

    autoTable(doc, {
      startY: 28,
      theme: 'plain',
      styles: { ...styles, fontSize: 11 },
      body: [
        [{ content: '基本資料', colSpan: 4, styles: { fontStyle: 'bold', fillColor: [230, 230, 230] } }],
        ['事業單位名稱', data.companyName, '訪視日期', data.visitDate],
        ['服務護理師', data.nurseName || '', '陪同人員', accDisplay],
        ['員工人數', `男: ${data.empMale} / 女: ${data.empFemale} (總計: ${data.empTotal})`, '輪班狀況', shiftDisplay]
      ],
      columnStyles: { 0: { cellWidth: 25, fontStyle: 'bold' }, 2: { cellWidth: 20, fontStyle: 'bold' } },
      didParseCell: (data) => { data.cell.styles.lineWidth = 0.1; data.cell.styles.lineColor = [0, 0, 0]; }
    });

    let finalY = doc.lastAutoTable.finalY + 5;

    // Part 1: 行政準備
    doc.setFontSize(11);
    doc.setFont(undefined, 'bold');
    doc.text("第一部分：行前/行政準備檢核 (Pre-visit)", 14, finalY);
    doc.setFont(undefined, 'normal');
    
    const sdsDisplay = data.admin.sdsList && data.admin.sdsList.length > 0 ? data.admin.sdsList.join('、') : '未填寫細項';

    autoTable(doc, {
      startY: finalY + 2,
      head: [['檢核項目', '文件狀況', '備註/數據']],
      body: [
        ['1. 勞工健康服務年度計畫', `${textCheck(data.admin.hasAnnualPlan, 'paper')}有(紙本)  ${textCheck(data.admin.hasAnnualPlan, 'electronic')}有(電子)  ${textCheck(data.admin.hasAnnualPlan, 'no')}無`, data.admin.hasAnnualPlan==='no' ? '會協助建置' : ''],
        ['2. 上年度健檢報告分析', `${textCheck(data.admin.hasCheckupAnalysis, 'yes')}有  ${textCheck(data.admin.hasCheckupAnalysis, 'no')}無`, data.admin.hasCheckupAnalysis==='yes' ? `異常人數: ${data.admin.abnormalCount||'_'} 人 (${data.admin.abnormalRate||'_'}%)` : ''],
        ['3. 作業環境監測報告', `${textCheck(data.admin.hasEnvMonitor, 'yes')}有  ${textCheck(data.admin.hasEnvMonitor, 'no')}無  ${textCheck(data.admin.hasEnvMonitor, 'na')}不適用`, data.admin.hasEnvMonitor==='yes' ? `年度: ${data.admin.envMonitorYear||''} / 項目: ${data.admin.envMonitorItems||''}` : ''],
        ['4. 安全資料表 (SDS)', `${textCheck(data.admin.hasSDS, 'yes')}有  ${textCheck(data.admin.hasSDS, 'no')}無  ${textCheck(data.admin.hasSDS, 'na')}不適用`, data.admin.hasSDS==='yes' ? `化學品: ${sdsDisplay}` : ''],
        ['5. 員工名冊 (含年齡/部門)', `${textCheck(data.admin.hasEmpList, 'yes')}有 (已取得電子檔)  ${textCheck(data.admin.hasEmpList, 'no')}無`, '用於分析高風險族群分佈']
      ],
      styles: styles,
      headStyles: headStyles,
      columnStyles: { 0: { cellWidth: 50 }, 2: { cellWidth: 60 } }
    });
    
    finalY = doc.lastAutoTable.finalY + 5;

    // Part 2: 現場危害
    doc.setFont(undefined, 'bold');
    doc.text("第二部分：現場危害與資源盤點 (On-site Walkthrough)", 14, finalY);
    
    doc.text("A. 危害辨識 (依現場觀察勾選)", 14, finalY + 5);
    autoTable(doc, {
      startY: finalY + 7,
      head: [['危害類別', '具體危害因子 (請填寫)', '現有防護具/工程控制', '優先關注']],
      body: [
        [`${check(data.hazards.physical)} 物理性`, data.hazards.physicalNote || '(例: 噪音、高溫、游離輻射)', '', check(data.hazards.physicalPriority)],
        [`${check(data.hazards.chemical)} 化學性`, '(例: 有機溶劑、特化物質)', `${check(data.hazards.chemicalSDS)}SDS標示  ${check(data.hazards.chemicalVent)}通風設備`, check(data.hazards.chemicalPriority)],
        [`${check(data.hazards.ergo)} 人因性`, data.hazards.ergoNote || '(例: 重複性動作、負重)', `${check(data.hazards.ergoTool)}輔助機具`, check(data.hazards.ergoPriority)],
        [`${check(data.hazards.bio)} 生物性`, data.hazards.bioNote || '(例: 血液體液、傳染病)', '', check(data.hazards.bioPriority)],
        [`${check(data.hazards.special)} 特殊作業`, data.hazards.specialNote || '(例: 高架、缺氧)', '', check(data.hazards.specialPriority)],
      ],
      styles: styles,
      headStyles: headStyles,
      columnStyles: { 0: { cellWidth: 30 }, 1: { cellWidth: 60 }, 3: { cellWidth: 20, halign: 'center' } }
    });

    doc.text("B. 急救與應變資源", 14, doc.lastAutoTable.finalY + 5);
    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 7,
      head: [['檢核項目', '現況確認', '改善建議']],
      body: [
        ['急救人員', `${check(data.firstAid.personnel)} 每班次至少1人  ${check(data.firstAid.license)} 證照在效期內`, ''],
        ['急救器材/AED', `${check(data.firstAid.drugs)} 藥品未過期  ${check(data.firstAid.aed)} AED功能正常\n${check(data.firstAid.location)} 配置位置適當`, '針對化學危害是否備有對應解毒/沖淋設備？'],
        ['哺乳室/母性保護', `${textCheck(data.firstAid.nursingRoom, 'yes')}有設置  ${textCheck(data.firstAid.nursingRoom, 'no')}無 (未達標準)`, '']
      ],
      styles: styles,
      headStyles: headStyles,
      columnStyles: { 0: { cellWidth: 30 } }
    });

    if (doc.lastAutoTable.finalY > 250) { doc.addPage(); finalY = 20; } else { finalY = doc.lastAutoTable.finalY + 5; }

    // Part 3: PDCA
    doc.setFont(undefined, 'bold');
    doc.text("第三部分：四大計畫落實度深查 (PDCA Check)", 14, finalY);
    
    const pdcaLabels = {
      overwork: { p: '有書面計畫', d: '已發放問卷', c: '已篩出高風險群', a: '已安排醫師面談' },
      ergo: { p: '有書面計畫', d: '已做檢核表', c: '已篩出危害點', a: '已做改善/諮詢' },
      violence: { p: '有書面計畫', d: '風險評估表', c: '書面聲明公告', a: '教育訓練/通報' },
      maternal: { p: '有書面計畫', d: '作業場所評估', c: '懷孕/產後名單', a: '適性配工/分級' }
    };

    const pdcaCell = (planKey, stage) => `${check(data.plans[planKey][stage])}${pdcaLabels[planKey][stage]}`;

    autoTable(doc, {
      startY: finalY + 2,
      head: [['法規計畫項目', 'P (計畫制定)', 'D (危害評估)', 'C (分級/篩選)', 'A (面談/改善)', '年度優先序']],
      body: [
        ['1. 異常工作負荷 (過勞)', pdcaCell('overwork','p'), pdcaCell('overwork','d'), pdcaCell('overwork','c'), pdcaCell('overwork','a'), `${data.plans.overwork.priority==='high'?'■':'□'}高 ${data.plans.overwork.priority==='mid'?'■':'□'}中 ${data.plans.overwork.priority==='low'?'■':'□'}低`],
        ['2. 肌肉骨骼 (人因)', pdcaCell('ergo','p'), pdcaCell('ergo','d'), pdcaCell('ergo','c'), pdcaCell('ergo','a'), `${data.plans.ergo.priority==='high'?'■':'□'}高 ${data.plans.ergo.priority==='mid'?'■':'□'}中 ${data.plans.ergo.priority==='low'?'■':'□'}低`],
        ['3. 不法侵害 (霸凌)', pdcaCell('violence','p'), pdcaCell('violence','d'), pdcaCell('violence','c'), pdcaCell('violence','a'), `${data.plans.violence.priority==='high'?'■':'□'}高 ${data.plans.violence.priority==='mid'?'■':'□'}中 ${data.plans.violence.priority==='low'?'■':'□'}低`],
        ['4. 母性健康保護', pdcaCell('maternal','p'), pdcaCell('maternal','d'), pdcaCell('maternal','c'), pdcaCell('maternal','a'), `${data.plans.maternal.priority==='high'?'■':'□'}高 ${data.plans.maternal.priority==='mid'?'■':'□'}中 ${data.plans.maternal.priority==='low'?'■':'□'}低`],
        [{ content: `顧問備註: ${data.plans.note || ''}`, colSpan: 6, styles: { cellPadding: 3 } }]
      ],
      styles: styles,
      headStyles: headStyles,
      columnStyles: { 0: { cellWidth: 35 }, 5: { cellWidth: 25, fontSize: 8 } }
    });

    finalY = doc.lastAutoTable.finalY + 5;
    
    // Part 4: 健康管理
    doc.setFont(undefined, 'bold');
    doc.text("第四部分：健康管理現況評估", 14, finalY);

    const generalCheck = `${check(data.health.generalSave)} 報告保存7年\n${check(data.health.generalAnalysis)} 有電子檔分析`;
    const generalAdvise = `目前管理分級完成度：\n${check(data.health.generalGrade==='none')} 未分級  ${check(data.health.generalGrade==='partial')} 僅分級  ${check(data.health.generalGrade==='done')} 已分級且有追蹤`;
    
    autoTable(doc, {
      startY: finalY + 2,
      head: [['檢核維度', '現況勾選', '顧問評估與建議']],
      body: [
        ['一般健檢管理', generalCheck, generalAdvise],
        ['特殊健檢管理', `${check(data.health.specialSave)} 報告保存10/30年\n${check(data.health.specialLevel)} 分級管理(1-4級)`, `是否有「第四級(管理級)」人員？\n${check(!data.health.hasLevel4)} 無  ${check(data.health.hasLevel4)} 有 (需優先安排訪談)`],
        ['配工與復工', `${check(data.health.fitAssess)} 適性配工評估\n${check(data.health.returnAssess)} 復工評估機制`, `去年是否有職災/長病假復工案例？\n${check(data.health.returnCases!=='')} 是 (${data.health.returnCases||'__'}件)  ${check(data.health.returnCases==='')} 否`],
        ['健康促進活動', `${check(data.health.promoLecture)} 辦理講座\n${check(data.health.promoSport)} 減重/運動競賽`, `規劃依據： ${check(data.health.promoBasis==='checkup')} 健檢結果  ${check(data.health.promoBasis==='questionnaire')} 問卷需求`]
      ],
      styles: { ...styles, fontSize: 9, cellPadding: 2 },
      headStyles: headStyles,
      columnStyles: { 0: { cellWidth: 25, fontStyle: 'bold' }, 1: { cellWidth: 70 }, 2: { cellWidth: 90 } }
    });

    finalY = doc.lastAutoTable.finalY + 10;

    // Part 5: 策略規劃
    doc.setFont(undefined, 'bold');
    doc.setFontSize(11);
    doc.text("第五部分：年度服務策略規劃 (Action Plan)", 14, finalY);
    doc.setFont(undefined, 'normal');
    doc.setFontSize(10);
    doc.text("1. 本年度三大重點目標 (依優先順序)：", 14, finalY + 6);
    doc.text(`● 目標一 (最急迫/法規缺失): ${data.strategy.goal1 || '________________________'}`, 18, finalY + 12);
    doc.text(`● 目標二 (風險控制): ${data.strategy.goal2 || '________________________'}`, 18, finalY + 18);
    doc.text(`● 目標三 (健康促進): ${data.strategy.goal3 || '________________________'}`, 18, finalY + 24);
    
    doc.text("2. 臨場服務頻率建議：", 14, finalY + 34);
    doc.text(`● 預計頻率: 每月 ${data.strategy.freqMonth||'__'} 次 / 每季 ${data.strategy.freqQuarter||'__'} 次`, 18, finalY + 40);
    doc.text(`● 下次訪視預定日期: ${data.strategy.nextDate || '____年__月__日'}`, 18, finalY + 46);

    doc.text("● 待辦事項 (To-do List)：", 18, finalY + 52);
    doc.text(`   ○ 顧問方需提供: ${data.strategy.todoConsultant || '_________________________________'}`, 18, finalY + 58);
    doc.text(`   ○ 企業方需準備: ${data.strategy.todoEnterprise || '_________________________________'}`, 18, finalY + 64);

    doc.text("顧問護理師簽名: __________________", 14, finalY + 75);
    doc.text("企業窗口簽名: __________________", 110, finalY + 75);

    doc.save(`${data.companyName}_完整訪視報告.pdf`);

  } catch (error) {
    console.error("PDF 生成錯誤:", error);
    alert(`PDF 生成失敗: ${error.message}\n請確認 public 資料夾下有 NotoSansTC-Regular.ttf 檔案`);
  }
};