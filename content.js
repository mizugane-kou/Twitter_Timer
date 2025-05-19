// メモ chrome://extensions/



const STORAGE_KEY = "twitter_daily_time";

let intervalId = null;
let isTabVisible = true;
let isWindowFocused = true;
let todayDate = getTodayDate();

// タイマー表示用の要素を作成
const timerDiv = document.createElement('div');
timerDiv.style.position = 'fixed';
timerDiv.style.bottom = '20px';
timerDiv.style.right = '20px';
timerDiv.style.background = 'rgba(0,0,0,0.7)';
timerDiv.style.color = 'white';
timerDiv.style.padding = '8px 12px';
timerDiv.style.borderRadius = '8px';
timerDiv.style.zIndex = '10000';
timerDiv.style.fontSize = '14px';
timerDiv.style.fontFamily = 'Arial, sans-serif';
timerDiv.style.pointerEvents = 'none';
timerDiv.innerText = `滞在時間: 0時間 0分 0秒`;
document.body.appendChild(timerDiv);

// 現在日付を"YYYY-MM-DD"形式で取得
function getTodayDate() {
  const now = new Date();
  return `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')}`;
}

// 秒を "○時間 ○分 ○秒" 形式に変換
function formatTime(seconds) {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  return `${hrs}時間 ${mins}分 ${secs}秒`;
}

// ストレージからデータ取得（コールバック形式で安全に）
async function getStoredTime() {
  return new Promise((resolve) => {
    try {
      chrome.storage.local.get([STORAGE_KEY], (result) => {
        resolve(result[STORAGE_KEY] || { date: getTodayDate(), time: 0 });
      });
    } catch (e) {
      console.error("Storage access failed:", e);
      resolve({ date: getTodayDate(), time: 0 });
    }
  });
}

// ストレージに保存
async function setStoredTime(date, time) {
  try {
    chrome.storage.local.set({ [STORAGE_KEY]: { date, time } });
  } catch (e) {
    console.error("Storage write failed:", e);
  }
}

// 1秒ごとの処理
async function tick() {
  const data = await getStoredTime();
  const nowDate = getTodayDate();

  if (data.date !== nowDate) {
    todayDate = nowDate;
    await setStoredTime(nowDate, 1);
    timerDiv.innerText = `滞在時間: ${formatTime(1)}`;
  } else {
    const newTime = data.time + 1;
    await setStoredTime(nowDate, newTime);
    timerDiv.innerText = `滞在時間: ${formatTime(newTime)}`;
  }
}

// タイマー開始
function startTimer() {
  if (!intervalId) {
    intervalId = setInterval(tick, 1000);
  }
}

// タイマー停止
function stopTimer() {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
}

// 状態によって開始・停止を切り替える
function updateTimerState() {
  if (isTabVisible && isWindowFocused) {
    startTimer();
  } else {
    stopTimer();
  }
}

// タブ表示状態監視
document.addEventListener('visibilitychange', () => {
  isTabVisible = (document.visibilityState === 'visible');
  updateTimerState();
});

// ウィンドウフォーカス監視
window.addEventListener('focus', () => {
  isWindowFocused = true;
  updateTimerState();
});

window.addEventListener('blur', () => {
  isWindowFocused = false;
  updateTimerState();
});

// 初期化処理（安全のため window.onload 後に呼ぶ）
window.addEventListener('load', async () => {
  const data = await getStoredTime();
  const nowDate = getTodayDate();
  todayDate = nowDate;

  if (data.date === nowDate) {
    timerDiv.innerText = `滞在時間: ${formatTime(data.time)}`;
  } else {
    await setStoredTime(nowDate, 0);
    timerDiv.innerText = `滞在時間: 0時間 0分 0秒`;
  }

  updateTimerState();
});


