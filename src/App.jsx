import React, { useState } from 'react';
import VisitChecklistForm from './components/VisitChecklistForm';

function App() {
  // 1. 設定登入狀態，預設為 false (未登入)
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [password, setPassword] = useState('');

  // 2. 處理登入邏輯
  const handleLogin = (e) => {
    e.preventDefault();
    // ⚠️ 設定您的通關密碼，例如 "anze888"
    if (password === 'anze888') {
      setIsLoggedIn(true);
    } else {
      alert('密碼錯誤，請重新輸入！');
    }
  };

  // 3. 如果還沒登入，顯示登入畫面
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
        <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-sm">
          <h2 className="text-2xl font-bold text-center mb-6 text-blue-900">安澤健康顧問系統</h2>
          <p className="text-gray-500 text-center mb-4 text-sm">請輸入顧問通行碼以進入系統</p>
          
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <input
                type="password"
                className="w-full border p-3 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="請輸入密碼"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <button
              type="submit"
              className="w-full bg-blue-800 text-white p-3 rounded font-bold hover:bg-blue-900 transition"
            >
              登入系統
            </button>
          </form>
          <p className="text-xs text-gray-400 text-center mt-4">Authorized Access Only</p>
        </div>
      </div>
    );
  }

  // 4. 如果已登入，顯示原本的檢核表
  return (
    <div>
      <VisitChecklistForm />
    </div>
  );
}

export default App;