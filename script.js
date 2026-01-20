/**
 * 宅建学習アプリ - メインスクリプト
 * 機能: レーダーチャート描画、学習履歴管理、チャットボット連携
 */

// ============ グローバル変数 ============
let selectedCategories = ['権利関係', '宅建業法', '法令上の制限', '税・統計', '5問免除'];
let selectedCount = 50;
let quizData = [];
let currentIdx = 0;
let score = 0;
let startTime = null;
let timerInterval = null;
let currentQuestionStartTime = null;
let radarChart = null;

// Google Gemini API設定（APIキーは後で置き換える）
const API_KEY = 'YOUR_API_KEY_HERE';
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';

// LocalStorage キー
const STORAGE_KEY = 'takkenAppData';
const HISTORY_KEY = 'takkenHistory';

// ============ データ構造の初期化 ============
function initializeData() {
    if (!localStorage.getItem(STORAGE_KEY)) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({
            totalAnswered: 0,
            totalCorrect: 0,
            totalTime: 0,
            categoryStats: {
                '権利関係': { answered: 0, correct: 0 },
                '宅建業法': { answered: 0, correct: 0 },
                '法令上の制限': { answered: 0, correct: 0 },
                '税・統計': { answered: 0, correct: 0 },
                '5問免除': { answered: 0, correct: 0 }
            }
        }));
    }
    if (!localStorage.getItem(HISTORY_KEY)) {
        localStorage.setItem(HISTORY_KEY, JSON.stringify([]));
    }
}

// ============ ダッシュボード初期化 ============
function initializeDashboard() {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY));
    document.getElementById('total-answered').innerText = data.totalAnswered;
    document.getElementById('total-correct').innerText = data.totalCorrect;
    document.getElementById('total-time').innerText = formatTime(data.totalTime);

    renderRadarChart();
}

// ============ レーダーチャート描画 ============
function renderRadarChart() {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY));
    const categories = ['権利関係', '宅建業法', '法令上の制限', '税・統計', '5問免除'];
    const correctRates = categories.map(cat => {
        const stat = data.categoryStats[cat];
        return stat.answered > 0 ? Math.round((stat.correct / stat.answered) * 100) : 0;
    });

    const ctx = document.getElementById('radarChart').getContext('2d');
    
    if (radarChart) {
        radarChart.destroy();
    }

    radarChart = new Chart(ctx, {
        type: 'radar',
        data: {
            labels: categories,
            datasets: [{
                label: '正答率（%）',
                data: correctRates,
                borderColor: '#667eea',
                backgroundColor: 'rgba(102, 126, 234, 0.1)',
                borderWidth: 2,
                pointBackgroundColor: '#667eea',
                pointBorderColor: '#fff',
                pointHoverBackgroundColor: '#5568d3',
                pointRadius: 5,
                pointHoverRadius: 7,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            scales: {
                r: {
                    beginAtZero: true,
                    max: 100,
                    ticks: {
                        stepSize: 20,
                        font: { size: 12 }
                    },
                    grid: {
                        color: 'rgba(0, 0, 0, 0.1)'
                    }
                }
            },
            plugins: {
                legend: {
                    display: true,
                    position: 'top',
                    labels: {
                        font: { size: 13 },
                        padding: 20
                    }
                }
            }
        }
    });
}

// ============ Fisher-Yatesシャッフル ============
function shuffleArray(arr) {
    const result = [...arr];
    for (let i = result.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
}

// ============ 画面遷移関数 ============
function goToQuizStart() {
    document.getElementById('dashboard-screen').style.display = 'none';
    document.getElementById('start-screen').style.display = 'flex';
}

function backToDashboard() {
    document.getElementById('history-screen').style.display = 'none';
    document.getElementById('result-screen').style.display = 'none';
    document.getElementById('start-screen').style.display = 'none';
    document.getElementById('quiz-screen').style.display = 'none';
    document.getElementById('dashboard-screen').style.display = 'flex';
    initializeDashboard();
}

// ============ スタート処理 ============
function startQuiz() {
    // 分野選択を取得
    selectedCategories = Array.from(document.querySelectorAll('#category-checkboxes input:checked'))
        .map(el => el.value);

    // 問題数を取得
    const countSelected = document.querySelector('#question-count-radios input:checked').value;
    selectedCount = countSelected === 'all' ? 50 : parseInt(countSelected);

    if (selectedCategories.length === 0) {
        alert('最低1つの分野を選択してください');
        return;
    }

    // 選択された分野のみフィルター
    let filtered = allQuizData.filter(q => selectedCategories.includes(q.category));

    // シャッフルして問題数に合わせる
    quizData = shuffleArray(filtered).slice(0, selectedCount);

    // 画面遷移
    document.getElementById('start-screen').style.display = 'none';
    document.getElementById('quiz-screen').style.display = 'flex';

    document.getElementById('total-q').innerText = quizData.length;
    document.getElementById('total-score').innerText = quizData.length;

    currentIdx = 0;
    score = 0;
    startTime = Date.now();

    renderQuestion();
    startTimer();
}

// ============ タイマー ============
function startTimer() {
    const timerEl = document.getElementById('timer');
    timerInterval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        const m = Math.floor(elapsed / 60).toString().padStart(2, '0');
        const s = (elapsed % 60).toString().padStart(2, '0');
        timerEl.innerText = `${m}:${s}`;
    }, 100);
}

// ============ 問題レンダリング ============
function renderQuestion() {
    const q = quizData[currentIdx];
    const content = document.getElementById('quiz-content');

    document.getElementById('current-q').innerText = currentIdx + 1;

    const progress = ((currentIdx + 1) / quizData.length) * 100;
    document.getElementById('progress-bar').style.width = progress + '%';

    currentQuestionStartTime = Date.now();

    let choicesHtml = q.choices.map((choice, i) => `
        <div class="option-wrapper">
            <button class="eliminate-btn" onclick="toggleEliminate(this)">×</button>
            <button class="option-btn" onclick="selectAnswer(${i}, this)" data-question-id="${q.id}">${choice}</button>
        </div>
    `).join('');

    content.innerHTML = `
        <div class="question-card active">
            <div class="category-badge">${q.category}</div>
            <div class="question-text">${q.q}</div>
            <div class="options" id="options-container">${choicesHtml}</div>
            <div class="explanation-box" id="explanation-box">
                <div class="explanation-title">解説</div>
                <div class="explanation-content">${q.exp}</div>
            </div>
        </div>
    `;

    updateNavButtons();
}

// ============ 選択肢選択 ============
function selectAnswer(idx, btn) {
    const card = btn.closest('.question-card');
    if (card.classList.contains('answered')) return;

    const q = quizData[currentIdx];
    const optionsContainer = document.getElementById('options-container');
    const allBtns = optionsContainer.querySelectorAll('.option-btn');
    const timeSpent = Math.floor((Date.now() - currentQuestionStartTime) / 1000);

    const isCorrect = idx === q.correct;
    if (isCorrect) {
        btn.classList.add('correct');
        score++;
    } else {
        btn.classList.add('wrong');
        allBtns[q.correct].classList.add('correct');
    }

    // 履歴に記録
    saveToHistory({
        timestamp: Date.now(),
        questionId: q.id,
        question: q.q,
        category: q.category,
        correct: isCorrect,
        userAnswer: idx,
        correctAnswer: q.correct,
        choices: q.choices,
        explanation: q.exp,
        timeSpent: timeSpent
    });

    card.classList.add('answered');
    document.getElementById('explanation-box').classList.add('show');
    updateNavButtons();
}

// ============ 消去法 ============
function toggleEliminate(btn) {
    btn.classList.toggle('active');
    btn.nextElementSibling.classList.toggle('eliminated');
}

// ============ ナビゲーション ============
function updateNavButtons() {
    const card = document.querySelector('.question-card');
    const isAnswered = card?.classList.contains('answered');

    document.getElementById('prev-btn').disabled = currentIdx === 0;
    document.getElementById('next-btn').disabled = !isAnswered;
    document.getElementById('next-btn').innerText = currentIdx === quizData.length - 1 ? '結果を表示' : '次へ →';
}

function prevQuestion() {
    if (currentIdx > 0) {
        currentIdx--;
        renderQuestion();
    }
}

function nextQuestion() {
    if (currentIdx < quizData.length - 1) {
        currentIdx++;
        renderQuestion();
    } else {
        showResult();
    }
}

// ============ リザルト表示と統計保存 ============
function showResult() {
    clearInterval(timerInterval);
    const elapsed = Math.floor((Date.now() - startTime) / 1000);
    const m = Math.floor(elapsed / 60).toString().padStart(2, '0');
    const s = (elapsed % 60).toString().padStart(2, '0');

    const accuracy = Math.round((score / quizData.length) * 100);

    // 統計を更新
    updateStats(score, quizData, elapsed);

    document.getElementById('quiz-screen').style.display = 'none';
    document.getElementById('result-screen').style.display = 'flex';

    document.getElementById('final-score').innerText = score;
    document.getElementById('accuracy').innerText = accuracy + '%';
    document.getElementById('result-time').innerText = `${m}:${s}`;

    let message = '';
    if (accuracy >= 80) {
        message = '🌟 素晴らしい！確実に合格圏内です！';
    } else if (accuracy >= 70) {
        message = '👍 優秀です！もう少しの努力で合格できます！';
    } else if (accuracy >= 60) {
        message = '📚 良好です。もう少し学習を深めましょう。';
    } else if (accuracy >= 50) {
        message = '💡 50%達成です。基本を深めて頑張りましょう！';
    } else {
        message = '💪 基礎から丁寧に復習して頑張りましょう！';
    }

    document.getElementById('result-message').innerText = message;
}

// ============ 統計更新 ============
function updateStats(correct, questions, timeSpent) {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY));
    data.totalAnswered += questions.length;
    data.totalCorrect += correct;
    data.totalTime += timeSpent;

    questions.forEach(q => {
        const history = JSON.parse(localStorage.getItem(HISTORY_KEY));
        const lastEntry = history[history.length - 1];
        if (lastEntry && lastEntry.questionId === q.id) {
            data.categoryStats[q.category].answered++;
            if (lastEntry.correct) {
                data.categoryStats[q.category].correct++;
            }
        }
    });

    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

// ============ 学習履歴管理 ============
function saveToHistory(entry) {
    const history = JSON.parse(localStorage.getItem(HISTORY_KEY));
    history.push(entry);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
}

function showHistory() {
    document.getElementById('dashboard-screen').style.display = 'none';
    document.getElementById('history-screen').style.display = 'flex';

    const history = JSON.parse(localStorage.getItem(HISTORY_KEY));
    const historyContent = document.getElementById('history-content');

    if (history.length === 0) {
        historyContent.innerHTML = '<div class="history-empty">学習履歴がまだありません。問題を解いて記録を残しましょう！</div>';
        return;
    }

    let html = '';
    const sortedHistory = [...history].reverse();
    sortedHistory.forEach((item, idx) => {
        const date = new Date(item.timestamp);
        const dateStr = date.toLocaleString('ja-JP', { 
            year: 'numeric', 
            month: '2-digit', 
            day: '2-digit', 
            hour: '2-digit', 
            minute: '2-digit' 
        });
        const statusIcon = item.correct ? '✅' : '❌';

        html += `
            <div class="history-item">
                <div class="history-item-header">
                    <div class="history-item-title">${statusIcon} ${item.category}</div>
                    <div class="history-item-date">${dateStr}</div>
                </div>
                <div class="history-item-details">
                    <div class="history-item-detail">
                        <span>所要時間:</span>
                        <strong>${item.timeSpent}秒</strong>
                    </div>
                    <div class="history-item-detail">
                        <span>正誤:</span>
                        <strong>${item.correct ? '正解' : '不正解'}</strong>
                    </div>
                </div>
                <div style="font-size: 13px; color: #333; margin-bottom: 10px;">
                    <strong>Q:</strong> ${item.question}
                </div>
                <div class="history-item-actions">
                    <button class="history-item-btn" onclick="showHistoryDetail('${item.questionId}')">解説を確認</button>
                </div>
            </div>
        `;
    });

    historyContent.innerHTML = html;
}

function showHistoryDetail(questionId) {
    const history = JSON.parse(localStorage.getItem(HISTORY_KEY));
    const item = history.find(h => h.questionId === questionId);
    
    if (item) {
        alert(`Q: ${item.question}\n\n解説:\n${item.explanation}\n\n正解: ${item.choices[item.correctAnswer]}`);
    }
}

// ============ チャットボット機能 ============
function toggleChatWindow() {
    const chatWindow = document.getElementById('chatWindow');
    if (chatWindow.style.display === 'none') {
        chatWindow.style.display = 'flex';
        document.getElementById('chatInput').focus();
    } else {
        chatWindow.style.display = 'none';
    }
}

async function sendChatMessage() {
    const input = document.getElementById('chatInput');
    const message = input.value.trim();

    if (!message) return;

    // ユーザーメッセージを表示
    appendChatMessage(message, 'user');
    input.value = '';

    // 現在の問題コンテキストを取得
    let context = '';
    if (currentIdx < quizData.length) {
        const currentQ = quizData[currentIdx];
        context = `現在表示中の問題:\nQ: ${currentQ.q}\nA: ${currentQ.choices[currentQ.correct]}\n解説: ${currentQ.exp}\n\n`;
    }

    // Gemini APIに送信
    try {
        const response = await callGeminiAPI(context + message);
        appendChatMessage(response, 'bot');
    } catch (error) {
        console.error('Chat API Error:', error);
        appendChatMessage(
            'すみません、今は応答できません。APIキーが設定されていることを確認してください。',
            'bot'
        );
    }
}

function appendChatMessage(text, sender) {
    const messagesContainer = document.getElementById('chatMessages');
    const messageDiv = document.createElement('div');
    messageDiv.className = `chat-message ${sender}`;
    
    const bubbleDiv = document.createElement('div');
    bubbleDiv.className = 'chat-bubble';
    bubbleDiv.textContent = text;
    
    messageDiv.appendChild(bubbleDiv);
    messagesContainer.appendChild(messageDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

async function callGeminiAPI(prompt) {
    if (API_KEY === 'YOUR_API_KEY_HERE') {
        return '🏠 よんなな先輩屋さんです！\n\nAPIキーが設定されていないようです。\nscript.jsの `API_KEY` にGoogle Gemini APIキーを設定してくださいね。\n\nそれまでは、基本知識の説明や問題の解き方についてのアドバイスもできますよ！何か宅建試験について質問がありますか？';
    }

    const response = await fetch(`${GEMINI_API_URL}?key=${API_KEY}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            contents: [{
                parts: [{
                    text: `あなたは親しみやすい宅建試験の学習サポートキャラクター「よんなな先輩屋さん」です。以下のルールを守って応答してください：
1. 口調は「〜だよ」「頑張ろう！」など親しみやすいものを使う
2. 宅建試験の学習に関する質問に対して、分かりやすく丁寧に説明する
3. 励ましやモチベーション維持のサポートを心がける
4. 回答は150文字以内で簡潔に

ユーザーの質問: ${prompt}`
                }]
            }]
        })
    });

    const data = await response.json();
    if (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts && data.candidates[0].content.parts[0]) {
        return data.candidates[0].content.parts[0].text;
    }
    throw new Error('Invalid response from API');
}

// ============ ユーティリティ関数 ============
function formatTime(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
        return `${hours}h ${minutes}m`;
    } else if (minutes > 0) {
        return `${minutes}m`;
    } else {
        return `${seconds}s`;
    }
}

// ============ 設定画面 ============
function openSettings() {
    document.getElementById('dashboard-screen').style.display = 'none';
    document.getElementById('history-screen').style.display = 'none';
    document.getElementById('settings-screen').style.display = 'flex';
}

// ============ データリセット機能 ============
function openDataResetDialog() {
    document.getElementById('reset-modal').style.display = 'flex';
    document.getElementById('reset-modal-overlay').style.display = 'block';
}

function closeDataResetDialog() {
    document.getElementById('reset-modal').style.display = 'none';
    document.getElementById('reset-modal-overlay').style.display = 'none';
}

function confirmDataReset() {
    // LocalStorage をクリア
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(HISTORY_KEY);
    
    // ダイアログを閉じる
    closeDataResetDialog();
    
    // ページをリロードして初期状態に戻す
    setTimeout(() => {
        location.reload();
    }, 300);
}

// ============ PWA登録 ============
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js').catch(() => {});
    });
}

// ============ 初期化 ============
document.addEventListener('DOMContentLoaded', () => {
    initializeData();
    initializeDashboard();

    // Enter キーでチャット送信
    document.getElementById('chatInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendChatMessage();
        }
    });
});
