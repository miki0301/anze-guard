// src/services/projectService.js
import { db } from "../firebaseConfig";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";

const generateId = () => Math.random().toString(36).substr(2, 9);

export const saveStage1AndGenerateStage2 = async (companyId, projectId, stage1Data) => {
  const projectRef = doc(db, "companies", companyId, "projects", projectId);
  const autoTasks = [];

  // 邏輯 A: 四大計畫缺失 -> 自動轉任務
  if (stage1Data.planOverwork !== 'done') {
    autoTasks.push({
      id: generateId(),
      category: '重點計畫',
      name: '異常工作負荷(過勞)預防計畫建置與高風險篩選',
      schedule: [1, 2, 3], // Q1
      status: 'pending',
      origin: 'auto'
    });
  }
  // ... (請依據檔案補完人因、不法侵害、母性保護的 if 判斷 [cite: 427-454])

  // 邏輯 B: 危害辨識 -> 自動轉任務
  if (stage1Data.hazards?.noise) {
    autoTasks.push({
      id: generateId(),
      category: '危害管理',
      name: '噪音作業聽力保護計畫與特殊健檢分級',
      schedule: [5, 6],
      status: 'pending',
      origin: 'auto'
    });
  }

  // 準備寫入 Payload [cite: 488]
  const payload = {
    "meta": { status: "stage1_done", updatedAt: serverTimestamp() },
    "stage1_assessment": { ...stage1Data, completedAt: new Date().toISOString() },
    "stage2_planning": {
      approvalStatus: "DRAFT",
      tasks: autoTasks
    }
  };

  await setDoc(projectRef, payload, { merge: true });
  return { success: true, tasksGenerated: autoTasks.length };
};