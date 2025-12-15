import React, { useState } from 'react';
import { Save, FileText, Download, ChevronDown, ChevronUp, Plus, Trash2 } from 'lucide-react';
import { saveStage1AndGenerateStage2 } from '../services/projectService';
import { exportAnnualPlanExcel } from '../utils/excelGenerator';
import { generateChecklistPDF } from '../utils/pdfGenerator';

const Section = ({ title, isOpen, toggle, children }) => (
  <div className="mb-4 bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
    <div className="flex justify-between items-center p-4 bg-gray-50 cursor-pointer hover:bg-gray-100" onClick={toggle}>
      <h3 className="font-bold text-lg text-gray-800">{title}</h3>
      {isOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
    </div>
    {isOpen && <div className="p-4 border-t">{children}</div>}
  </div>
);

const VisitChecklistForm = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [openSections, setOpenSections] = useState({ basic: true, part1: true, part2: true, part3: true, part4: true, part5: true });

  const [formData, setFormData] = useState({
    // 基本資料
    companyName: '', visitDate: new Date().toISOString().split('T')[0],
    nurseName: '', accompanyingName: '', accompanyingRole: 'labor', accompanyingRoleNote: '', 
    empMale: '', empFemale: '', empTotal: '', shiftType: 'normal', shiftNote: '',

    // Part 1
    admin: { hasAnnualPlan: 'no', hasCheckupAnalysis: 'no', abnormalCount: '', abnormalRate: '', hasEnvMonitor: 'no', envMonitorYear: '', envMonitorItems: '', hasSDS: 'no', sdsList: [], hasEmpList: 'no' },

    // Part 2
    hazards: {
      physical: false, physicalNote: '', physicalPriority: false,
      chemical: false, chemicalSDS: false, chemicalVent: false, chemicalPriority: false,
      ergo: false, ergoNote: '', ergoTool: false, ergoPriority: false,
      bio: false, bioNote: '', bioPriority: false,
      special: false, specialNote: '', specialPriority: false
    },
    // 修正：移除了多餘的 locationAppropriate 狀態 (雖然留著不影響，但為了整潔建議對應)
    firstAid: { personnel: false, license: false, drugs: false, aed: false, location: false, nursingRoom: '', note: '' },

    // Part 3
    plans: { note: '', overwork: { p: false, d: false, c: false, a: false, priority: 'low' }, ergo: { p: false, d: false, c: false, a: false, priority: 'low' }, violence: { p: false, d: false, c: false, a: false, priority: 'low' }, maternal: { p: false, d: false, c: false, a: false, priority: 'low' } },

    // Part 4 & 5
    health: { generalSave: false, generalAnalysis: false, generalGrade: '', specialSave: false, specialLevel: false, hasLevel4: false, fitAssess: false, returnAssess: false, returnCases: '', promoLecture: false, promoSport: false, promoBasis: '' },
    strategy: { goal1: '', goal2: '', goal3: '', freqMonth: '', freqQuarter: '', nextDate: '', todoConsultant: '', todoEnterprise: '' }
  });

  const pdcaLabels = {
    overwork: { name: '1. 異常工作負荷 (過勞)', p: '有書面計畫', d: '已發放問卷', c: '已篩出高風險群', a: '已安排醫師面談' },
    ergo: { name: '2. 肌肉骨骼 (人因)', p: '有書面計畫', d: '已做檢核表', c: '已篩出危害點', a: '已做改善/諮詢' },
    violence: { name: '3. 不法侵害 (霸凌)', p: '有書面計畫', d: '風險評估表', c: '書面聲明公告', a: '教育訓練/通報' },
    maternal: { name: '4. 母性健康保護', p: '有書面計畫', d: '作業場所評估', c: '懷孕/產後名單', a: '適性配工/分級' }
  };

  const update = (section, field, value) => setFormData(prev => ({ ...prev, [section]: { ...prev[section], [field]: value } }));
  const updatePlan = (plan, field, value) => setFormData(prev => ({ ...prev, plans: { ...prev.plans, [plan]: { ...prev.plans[plan], [field]: value } } }));
  const addSDS = () => setFormData(prev => ({ ...prev, admin: { ...prev.admin, sdsList: [...prev.admin.sdsList, ''] } }));
  const updateSDS = (i, v) => { const l = [...formData.admin.sdsList]; l[i] = v; setFormData(prev => ({ ...prev, admin: { ...prev.admin, sdsList: l } })); };
  const removeSDS = (i) => setFormData(prev => ({ ...prev, admin: { ...prev.admin, sdsList: formData.admin.sdsList.filter((_, idx) => idx !== i) } }));
  const toggle = (sec) => setOpenSections(prev => ({ ...prev, [sec]: !prev[sec] }));

  const handleSave = async () => {
    if (!formData.companyName) return alert("請填寫事業單位名稱");
    setIsSubmitting(true);
    await saveStage1AndGenerateStage2("demo", "2025_01", formData);
    setIsSubmitting(false);
    alert("儲存成功！");
  };

  return (
    <div className="max-w-4xl mx-auto bg-gray-50 min-h-screen pb-24 font-sans text-gray-800">
      <div className="bg-blue-800 text-white p-4 shadow sticky top-0 z-20">
        <h1 className="text-xl font-bold flex items-center gap-2"><FileText /> 首次臨場服務工作檢核表 (v2.0)</h1>
      </div>

      <div className="p-4">
        {/* 基本資料 & Part 1 (省略以節省篇幅, 請保持原樣) */}
        <Section title="基本資料" isOpen={openSections.basic} toggle={() => toggle('basic')}>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2"><label className="text-sm font-bold">事業單位名稱</label><input className="w-full border p-2 rounded" value={formData.companyName} onChange={e=>setFormData({...formData, companyName: e.target.value})} /></div>
            <div><label className="text-sm font-bold">訪視日期</label><input type="date" className="w-full border p-2 rounded" value={formData.visitDate} onChange={e=>setFormData({...formData, visitDate: e.target.value})} /></div>
            <div><label className="text-sm font-bold">服務護理師</label><input className="w-full border p-2 rounded" value={formData.nurseName} onChange={e=>setFormData({...formData, nurseName: e.target.value})} /></div>
            <div className="col-span-2 border p-3 rounded bg-gray-50"><label className="text-sm font-bold block mb-1">陪同人員</label><div className="flex gap-4 items-center mb-2"><input placeholder="姓名" className="border p-1 w-32" value={formData.accompanyingName} onChange={e=>setFormData({...formData, accompanyingName: e.target.value})} /><label><input type="radio" checked={formData.accompanyingRole==='labor'} onChange={()=>setFormData({...formData, accompanyingRole: 'labor'})} /> 勞安</label><label><input type="radio" checked={formData.accompanyingRole==='hr'} onChange={()=>setFormData({...formData, accompanyingRole: 'hr'})} /> 人資</label><label><input type="radio" checked={formData.accompanyingRole==='other'} onChange={()=>setFormData({...formData, accompanyingRole: 'other'})} /> 其他</label></div>{formData.accompanyingRole === 'other' && <input placeholder="請輸入身分" className="w-full border p-1 rounded bg-white" value={formData.accompanyingRoleNote} onChange={e=>setFormData({...formData, accompanyingRoleNote: e.target.value})} />}</div>
            <div className="col-span-2 flex gap-2 items-center"><span className="text-sm font-bold">員工人數:</span><input placeholder="男" className="w-20 border p-1" value={formData.empMale} onChange={e=>setFormData({...formData, empMale: e.target.value})} /><input placeholder="女" className="w-20 border p-1" value={formData.empFemale} onChange={e=>setFormData({...formData, empFemale: e.target.value})} /><input placeholder="總計" className="w-20 border p-1" value={formData.empTotal} onChange={e=>setFormData({...formData, empTotal: e.target.value})} /></div>
            <div className="col-span-2 border p-3 rounded bg-gray-50"><label className="text-sm font-bold block mb-1">輪班狀況</label><div className="flex gap-4 items-center"><label><input type="radio" checked={formData.shiftType==='normal'} onChange={()=>setFormData({...formData, shiftType: 'normal'})} /> 常日班</label><label><input type="radio" checked={formData.shiftType==='shift'} onChange={()=>setFormData({...formData, shiftType: 'shift'})} /> 輪班</label></div>{formData.shiftType === 'shift' && <input placeholder="請註明班別" className="w-full border p-1 rounded mt-2 bg-white" value={formData.shiftNote} onChange={e=>setFormData({...formData, shiftNote: e.target.value})} />}</div>
          </div>
        </Section>

        <Section title="第一部分：行政/法規準備" isOpen={openSections.part1} toggle={() => toggle('part1')}>
          <div className="space-y-6">
            <div className="flex flex-col gap-1 border-b pb-4"><span className="font-bold text-blue-800">1. 勞工健康服務年度計畫</span><div className="flex gap-4"><label><input type="radio" checked={formData.admin.hasAnnualPlan==='paper'} onChange={()=>update('admin','hasAnnualPlan','paper')} /> 有(紙本)</label><label><input type="radio" checked={formData.admin.hasAnnualPlan==='electronic'} onChange={()=>update('admin','hasAnnualPlan','electronic')} /> 有(電子)</label><label className="text-red-600 font-bold"><input type="radio" checked={formData.admin.hasAnnualPlan==='no'} onChange={()=>update('admin','hasAnnualPlan','no')} /> 無 (會協助建置)</label></div></div>
            <div className="flex flex-col gap-1 border-b pb-4"><span className="font-bold text-blue-800">2. 上年度健檢報告分析</span><div className="flex gap-4 items-center mb-2"><label><input type="radio" checked={formData.admin.hasCheckupAnalysis==='yes'} onChange={()=>update('admin','hasCheckupAnalysis','yes')} /> 有</label><label><input type="radio" checked={formData.admin.hasCheckupAnalysis==='no'} onChange={()=>update('admin','hasCheckupAnalysis','no')} /> 無</label></div>{formData.admin.hasCheckupAnalysis === 'yes' && <div className="flex gap-2 items-center bg-gray-50 p-2 rounded"><input placeholder="異常人數" className="border p-1 w-24" value={formData.admin.abnormalCount} onChange={e=>update('admin','abnormalCount',e.target.value)} /><input placeholder="佔比%" className="border p-1 w-16" value={formData.admin.abnormalRate} onChange={e=>update('admin','abnormalRate',e.target.value)} /></div>}</div>
            <div className="flex flex-col gap-1 border-b pb-4"><span className="font-bold text-blue-800">3. 作業環境監測報告</span><div className="flex gap-4 items-center mb-2"><label><input type="radio" checked={formData.admin.hasEnvMonitor==='yes'} onChange={()=>update('admin','hasEnvMonitor','yes')} /> 有</label><label><input type="radio" checked={formData.admin.hasEnvMonitor==='no'} onChange={()=>update('admin','hasEnvMonitor','no')} /> 無</label><label><input type="radio" checked={formData.admin.hasEnvMonitor==='na'} onChange={()=>update('admin','hasEnvMonitor','na')} /> 不適用</label></div>{formData.admin.hasEnvMonitor === 'yes' && <div className="flex gap-2 items-center bg-gray-50 p-2 rounded"><input placeholder="監測年度 (例如 2024)" className="border p-1 w-32" value={formData.admin.envMonitorYear} onChange={e=>update('admin','envMonitorYear',e.target.value)} /><input placeholder="監測項目 (如 噪音、粉塵)" className="border p-1 flex-1" value={formData.admin.envMonitorItems} onChange={e=>update('admin','envMonitorItems',e.target.value)} /></div>}</div>
            <div className="flex flex-col gap-1 border-b pb-4"><span className="font-bold text-blue-800">4. 安全資料表 (SDS)</span><div className="flex gap-4 items-center mb-2"><label><input type="radio" checked={formData.admin.hasSDS==='yes'} onChange={()=>update('admin','hasSDS','yes')} /> 有</label><label><input type="radio" checked={formData.admin.hasSDS==='no'} onChange={()=>update('admin','hasSDS','no')} /> 無</label><label><input type="radio" checked={formData.admin.hasSDS==='na'} onChange={()=>update('admin','hasSDS','na')} /> 不適用</label></div>{formData.admin.hasSDS === 'yes' && <div className="bg-gray-50 p-3 rounded"><p className="text-sm mb-2 text-gray-500">請輸入化學品名稱 (可新增多項):</p>{formData.admin.sdsList.map((item, idx) => (<div key={idx} className="flex gap-2 mb-2"><input className="border p-1 flex-1 rounded" value={item} onChange={(e) => updateSDS(idx, e.target.value)} placeholder={`化學品 ${idx + 1}`} /><button onClick={() => removeSDS(idx)} className="text-red-500 p-1"><Trash2 size={16} /></button></div>))}<button onClick={addSDS} className="flex items-center gap-1 text-blue-600 text-sm font-bold mt-1"><Plus size={16} /> 新增化學品</button></div>}</div>
            <div className="flex flex-col gap-1"><span className="font-bold text-blue-800">5. 員工名冊 (含年齡/部門)</span><div className="flex gap-4 items-center"><label><input type="radio" checked={formData.admin.hasEmpList==='yes'} onChange={()=>update('admin','hasEmpList','yes')} /> 有 (已取得電子檔)</label><label><input type="radio" checked={formData.admin.hasEmpList==='no'} onChange={()=>update('admin','hasEmpList','no')} /> 無</label></div></div>
          </div>
        </Section>

        <Section title="第二部分：現場危害與資源" isOpen={openSections.part2} toggle={() => toggle('part2')}>
          <h4 className="font-bold text-lg mb-2 text-blue-800">A. 危害辨識 (依現場觀察勾選)</h4>
          <table className="w-full text-sm mb-6">
            <thead className="bg-gray-100">
              <tr><th className="p-2 text-left">危害類別</th><th className="p-2 text-left">具體因子/控制</th><th className="p-2">優先</th></tr>
            </thead>
            <tbody>
              <tr className="border-b"><td className="p-2 align-top"><label><input type="checkbox" checked={formData.hazards.physical} onChange={e=>update('hazards','physical',e.target.checked)} /> 物理性</label></td><td className="p-2"><span className="text-gray-500 block mb-1">例如: 噪音、高溫、游離輻射</span>{formData.hazards.physical && <input className="w-full border p-1 rounded" placeholder="請填寫具體危害因子..." value={formData.hazards.physicalNote} onChange={e=>update('hazards','physicalNote',e.target.value)} />}</td><td className="p-2 text-center align-top"><input type="checkbox" checked={formData.hazards.physicalPriority} onChange={e=>update('hazards','physicalPriority',e.target.checked)} /></td></tr>
              <tr className="border-b"><td className="p-2 align-top"><label><input type="checkbox" checked={formData.hazards.chemical} onChange={e=>update('hazards','chemical',e.target.checked)} /> 化學性</label></td><td className="p-2"><span className="text-gray-500 block mb-1">例如: 有機溶劑、特化物質</span>{formData.hazards.chemical && (<div className="flex gap-4 mt-1 bg-blue-50 p-2 rounded"><label className="mr-2"><input type="checkbox" checked={formData.hazards.chemicalSDS} onChange={e=>update('hazards','chemicalSDS',e.target.checked)} /> SDS標示</label><label><input type="checkbox" checked={formData.hazards.chemicalVent} onChange={e=>update('hazards','chemicalVent',e.target.checked)} /> 通風設備</label></div>)}</td><td className="p-2 text-center align-top"><input type="checkbox" checked={formData.hazards.chemicalPriority} onChange={e=>update('hazards','chemicalPriority',e.target.checked)} /></td></tr>
              <tr className="border-b"><td className="p-2 align-top"><label><input type="checkbox" checked={formData.hazards.ergo} onChange={e=>update('hazards','ergo',e.target.checked)} /> 人因性</label></td><td className="p-2"><span className="text-gray-500 block mb-1">例如: 重複性動作、負重</span>{formData.hazards.ergo && (<div className="space-y-2"><input className="w-full border p-1 rounded" placeholder="請填寫具體危害..." value={formData.hazards.ergoNote} onChange={e=>update('hazards','ergoNote',e.target.value)} /><label className="block"><input type="checkbox" checked={formData.hazards.ergoTool} onChange={e=>update('hazards','ergoTool',e.target.checked)} /> 輔助機具</label></div>)}</td><td className="p-2 text-center align-top"><input type="checkbox" checked={formData.hazards.ergoPriority} onChange={e=>update('hazards','ergoPriority',e.target.checked)} /></td></tr>
              <tr className="border-b"><td className="p-2 align-top"><label><input type="checkbox" checked={formData.hazards.bio} onChange={e=>update('hazards','bio',e.target.checked)} /> 生物性</label></td><td className="p-2"><span className="text-gray-500 block mb-1">例如: 血液體液、傳染病</span>{formData.hazards.bio && <input className="w-full border p-1 rounded" placeholder="請填寫具體危害..." value={formData.hazards.bioNote} onChange={e=>update('hazards','bioNote',e.target.value)} />}</td><td className="p-2 text-center align-top"><input type="checkbox" checked={formData.hazards.bioPriority} onChange={e=>update('hazards','bioPriority',e.target.checked)} /></td></tr>
              <tr className="border-b"><td className="p-2 align-top"><label><input type="checkbox" checked={formData.hazards.special} onChange={e=>update('hazards','special',e.target.checked)} /> 特殊作業</label></td><td className="p-2"><span className="text-gray-500 block mb-1">例如: 高架、缺氧</span>{formData.hazards.special && <input className="w-full border p-1 rounded" placeholder="請填寫具體危害..." value={formData.hazards.specialNote} onChange={e=>update('hazards','specialNote',e.target.value)} />}</td><td className="p-2 text-center align-top"><input type="checkbox" checked={formData.hazards.specialPriority} onChange={e=>update('hazards','specialPriority',e.target.checked)} /></td></tr>
            </tbody>
          </table>
          <h4 className="font-bold text-lg mb-2 text-blue-800">B. 急救與應變資源</h4>
          <div className="space-y-3 text-sm border p-4 rounded bg-gray-50">
             <div className="flex gap-4 items-center border-b pb-2"><span className="w-24 font-bold">急救人員:</span><label><input type="checkbox" checked={formData.firstAid.personnel} onChange={e=>update('firstAid','personnel',e.target.checked)} /> 每班次至少1人</label><label><input type="checkbox" checked={formData.firstAid.license} onChange={e=>update('firstAid','license',e.target.checked)} /> 證照在效期內</label></div>
             <div className="flex gap-4 items-start border-b pb-2"><span className="w-24 font-bold mt-1">急救器材/AED:</span>
                {/* 修正處：移除重複的 checkbo */}
                <div className="grid grid-cols-2 gap-2">
                    <label><input type="checkbox" checked={formData.firstAid.drugs} onChange={e=>update('firstAid','drugs',e.target.checked)} /> 藥品未過期</label>
                    <label><input type="checkbox" checked={formData.firstAid.aed} onChange={e=>update('firstAid','aed',e.target.checked)} /> AED功能正常</label>
                    <label><input type="checkbox" checked={formData.firstAid.location} onChange={e=>update('firstAid','location',e.target.checked)} /> 配置位置適當</label>
                </div>
             </div>
             <div className="text-red-600 text-xs font-bold pl-24 pb-2">* 提醒：針對有化學危害事業單位確認是否備有對應解毒/沖淋設備？</div>
             <div className="flex gap-4 items-center pt-2"><span className="w-32 font-bold">哺乳室/母性保護:</span><label><input type="radio" checked={formData.firstAid.nursingRoom==='yes'} onChange={()=>update('firstAid','nursingRoom','yes')} /> 有設置</label><label><input type="radio" checked={formData.firstAid.nursingRoom==='no'} onChange={()=>update('firstAid','nursingRoom','no')} /> 無 (未達標準)</label></div>
          </div>
        </Section>

        {/* Part 3, 4, 5 (省略以節省篇幅, 請保持原樣) */}
        <Section title="第三部分：四大計畫 PDCA" isOpen={openSections.part3} toggle={() => toggle('part3')}>
          <table className="w-full text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-2 text-left">計畫項目</th>
                <th className="p-2">P (計畫制定)</th>
                <th className="p-2">D (危害評估)</th>
                <th className="p-2">C (分級/篩選)</th>
                <th className="p-2">A (面談/改善)</th>
                <th className="p-2">優先序</th>
              </tr>
            </thead>
            <tbody>
              {['overwork','ergo','violence','maternal'].map(plan => (
                <tr key={plan} className="border-b">
                  <td className="p-2 font-bold">{pdcaLabels[plan].name}</td>
                  <td className="p-2"><label className="flex items-center gap-1 cursor-pointer hover:bg-gray-50 rounded p-1"><input type="checkbox" checked={formData.plans[plan].p} onChange={e=>updatePlan(plan,'p',e.target.checked)} /> {pdcaLabels[plan].p}</label></td>
                  <td className="p-2"><label className="flex items-center gap-1 cursor-pointer hover:bg-gray-50 rounded p-1"><input type="checkbox" checked={formData.plans[plan].d} onChange={e=>updatePlan(plan,'d',e.target.checked)} /> {pdcaLabels[plan].d}</label></td>
                  <td className="p-2"><label className="flex items-center gap-1 cursor-pointer hover:bg-gray-50 rounded p-1"><input type="checkbox" checked={formData.plans[plan].c} onChange={e=>updatePlan(plan,'c',e.target.checked)} /> {pdcaLabels[plan].c}</label></td>
                  <td className="p-2"><label className="flex items-center gap-1 cursor-pointer hover:bg-gray-50 rounded p-1"><input type="checkbox" checked={formData.plans[plan].a} onChange={e=>updatePlan(plan,'a',e.target.checked)} /> {pdcaLabels[plan].a}</label></td>
                  <td className="p-2 text-center">
                    <select value={formData.plans[plan].priority} onChange={e=>updatePlan(plan,'priority',e.target.value)} className="border rounded">
                      <option value="low">低</option><option value="mid">中</option><option value="high">高</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <textarea className="w-full mt-2 border p-2 text-sm" placeholder="顧問備註 (例如: 過勞問卷回收率過低...)" value={formData.plans.note} onChange={e=>update('plans','note',e.target.value)} rows={2} />
        </Section>

        <Section title="第四部分：健康管理現況評估" isOpen={openSections.part4} toggle={() => toggle('part4')}>
          <div className="space-y-4">
            <div className="border-b pb-4"><h4 className="font-bold text-blue-800 mb-2">一般健檢管理</h4><div className="grid grid-cols-2 gap-4 text-sm"><div><p className="font-bold mb-1">現況勾選：</p><label className="block"><input type="checkbox" checked={formData.health.generalSave} onChange={e=>update('health','generalSave',e.target.checked)} /> 報告保存 7 年</label><label className="block"><input type="checkbox" checked={formData.health.generalAnalysis} onChange={e=>update('health','generalAnalysis',e.target.checked)} /> 有電子檔分析</label></div><div><p className="font-bold mb-1">顧問評估與建議 (管理分級)：</p><label className="block"><input type="radio" checked={formData.health.generalGrade==='none'} onChange={()=>update('health','generalGrade','none')} /> 未分級</label><label className="block"><input type="radio" checked={formData.health.generalGrade==='partial'} onChange={()=>update('health','generalGrade','partial')} /> 僅分級</label><label className="block"><input type="radio" checked={formData.health.generalGrade==='done'} onChange={()=>update('health','generalGrade','done')} /> 已分級且有追蹤</label></div></div></div>
            <div className="border-b pb-4"><h4 className="font-bold text-blue-800 mb-2">特殊健檢管理</h4><div className="grid grid-cols-2 gap-4 text-sm"><div><p className="font-bold mb-1">現況勾選：</p><label className="block"><input type="checkbox" checked={formData.health.specialSave} onChange={e=>update('health','specialSave',e.target.checked)} /> 報告保存 10/30 年</label><label className="block"><input type="checkbox" checked={formData.health.specialLevel} onChange={e=>update('health','specialLevel',e.target.checked)} /> 分級管理 (1-4級)</label></div><div><p className="font-bold mb-1">是否有「第四級(管理級)」人員？</p><div className="flex gap-4"><label><input type="radio" checked={!formData.health.hasLevel4} onChange={()=>update('health','hasLevel4',false)} /> 無</label><label><input type="radio" checked={formData.health.hasLevel4} onChange={()=>update('health','hasLevel4',true)} /> 有 (需優先安排訪談)</label></div></div></div></div>
            <div className="border-b pb-4"><h4 className="font-bold text-blue-800 mb-2">配工與復工</h4><div className="grid grid-cols-2 gap-4 text-sm"><div><p className="font-bold mb-1">現況勾選：</p><label className="block"><input type="checkbox" checked={formData.health.fitAssess} onChange={e=>update('health','fitAssess',e.target.checked)} /> 適性配工評估</label><label className="block"><input type="checkbox" checked={formData.health.returnAssess} onChange={e=>update('health','returnAssess',e.target.checked)} /> 復工評估機制</label></div><div><p className="font-bold mb-1">去年是否有職災/長病假復工案例？</p><div className="flex gap-2 items-center"><label><input type="radio" checked={formData.health.returnCases!==''} onChange={()=>update('health','returnCases','0')} /> 是</label>{formData.health.returnCases!=='' && <input className="border p-1 w-16" placeholder="件數" value={formData.health.returnCases} onChange={e=>update('health','returnCases',e.target.value)} />}<label><input type="radio" checked={formData.health.returnCases===''} onChange={()=>update('health','returnCases','')} /> 否</label></div></div></div></div>
            <div><h4 className="font-bold text-blue-800 mb-2">健康促進活動</h4><div className="grid grid-cols-2 gap-4 text-sm"><div><p className="font-bold mb-1">現況勾選：</p><label className="block"><input type="checkbox" checked={formData.health.promoLecture} onChange={e=>update('health','promoLecture',e.target.checked)} /> 辦理講座</label><label className="block"><input type="checkbox" checked={formData.health.promoSport} onChange={e=>update('health','promoSport',e.target.checked)} /> 減重/運動競賽</label></div><div><p className="font-bold mb-1">規劃依據：</p><label className="block"><input type="radio" checked={formData.health.promoBasis==='checkup'} onChange={()=>update('health','promoBasis','checkup')} /> 健檢結果</label><label className="block"><input type="radio" checked={formData.health.promoBasis==='questionnaire'} onChange={()=>update('health','promoBasis','questionnaire')} /> 問卷需求</label></div></div></div>
          </div>
        </Section>

        <Section title="第五部分：年度服務策略" isOpen={openSections.part5} toggle={() => toggle('part5')}>
          <div className="space-y-4">
             <div className="border-b pb-3"><label className="block text-sm font-bold mb-1 text-blue-800">目標一 (最急迫/法規缺失)</label><input className="w-full border p-2 rounded" placeholder="請輸入目標..." value={formData.strategy.goal1} onChange={e=>update('strategy','goal1',e.target.value)} /><p className="text-xs text-gray-500 mt-1">例：補齊四大計畫書面程序</p></div>
             <div className="border-b pb-3"><label className="block text-sm font-bold mb-1 text-blue-800">目標二 (風險控制)</label><input className="w-full border p-2 rounded" placeholder="請輸入目標..." value={formData.strategy.goal2} onChange={e=>update('strategy','goal2',e.target.value)} /><p className="text-xs text-gray-500 mt-1">例：完成噪音作業人員特殊健檢追蹤</p></div>
             <div className="border-b pb-3"><label className="block text-sm font-bold mb-1 text-blue-800">目標三 (健康促進)</label><input className="w-full border p-2 rounded" placeholder="請輸入目標..." value={formData.strategy.goal3} onChange={e=>update('strategy','goal3',e.target.value)} /><p className="text-xs text-gray-500 mt-1">例：針對代謝症候群高風險群辦理減重班</p></div>
             <div className="flex gap-4 mt-2 bg-gray-50 p-2 rounded"><div className="flex items-center gap-2">頻率: 每月 <input className="w-12 border p-1" value={formData.strategy.freqMonth} onChange={e=>update('strategy','freqMonth',e.target.value)} /> 次</div><div className="flex items-center gap-2">下次訪視: <input type="date" className="border p-1" value={formData.strategy.nextDate} onChange={e=>update('strategy','nextDate',e.target.value)} /></div></div>
             <div className="pt-2"><label className="block text-sm font-bold mb-1 text-red-700">待辦事項 (顧問需提供)</label><input className="w-full border p-2 rounded" placeholder="請輸入顧問待辦..." value={formData.strategy.todoConsultant} onChange={e=>update('strategy','todoConsultant',e.target.value)} /><p className="text-xs text-gray-500 mt-1">例：母性保護計畫範本、過勞問卷電子檔</p></div>
             <div><label className="block text-sm font-bold mb-1 text-red-700">待辦事項 (企業需準備)</label><input className="w-full border p-2 rounded" placeholder="請輸入企業待辦..." value={formData.strategy.todoEnterprise} onChange={e=>update('strategy','todoEnterprise',e.target.value)} /><p className="text-xs text-gray-500 mt-1">例：補提供上年度健檢光碟、確認職安委員會名單</p></div>
          </div>
        </Section>
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-3 flex gap-2 shadow-lg max-w-4xl mx-auto z-30">
        <button onClick={() => generateChecklistPDF(formData)} className="flex-1 bg-gray-600 text-white py-3 rounded font-bold flex justify-center items-center gap-2 hover:bg-gray-700"><Download size={20} /> 產出 PDF 報告</button>
        <button onClick={() => exportAnnualPlanExcel(formData, {shortTerm: formData.strategy.goal1}, 'DRAFT')} className="flex-1 bg-green-600 text-white py-3 rounded font-bold flex justify-center items-center gap-2 hover:bg-green-700"><FileText size={20} /> 生成 Excel 計畫</button>
        <button onClick={handleSave} disabled={isSubmitting} className="flex-1 bg-blue-600 text-white py-3 rounded font-bold flex justify-center items-center gap-2 hover:bg-blue-700"><Save size={20} /> {isSubmitting ? '儲存中...' : '儲存資料'}</button>
      </div>
    </div>
  );
};

export default VisitChecklistForm;