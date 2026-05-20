// 게임의 전체 상태 모델
let gameState = {
    level: 1,
    exp: 0,
    gold: 0,
    happiness: 0,
    colorIndex: 0, 
    inventory: { '빗': 0, '간식': 0, '산책': 0 },
    quests: [],                
    totalQuestsCompleted: 0,   
    equippedTitle: "",         
    unlockedTitles: []         
};

const puppyColors = ['#a8e6cf', '#b8eaff', '#ffc8c8', '#d1d1d1', '#c1ffc1']; 
const puppySpeeches = ["멍멍! 주인님 힘내라개!", "피버 타임이 되면 보상이 복사된다개!💥", "사진이 생겨서 기분 좋다개🐾", "돌발 미션도 놓치지 말라개!⚡"];

const titleData = [
    { name: "🐣 초보집사", desc: "퀘스트 3개 완료하기", check: (state) => state.totalQuestsCompleted >= 3 },
    { name: "🎖️ 프로집사", desc: "퀘스트 15개 완료하기", check: (state) => state.totalQuestsCompleted >= 15 },
    { name: "🔥 만수르", desc: "보유 골드 500원 이상 달성", check: (state) => state.gold >= 500 },
    { name: "💖 사랑꾼", desc: "행복 지수 120 이상 달성", check: (state) => state.happiness >= 120 },
    { name: "👑 대형견", desc: "강아지 레벨 5 이상 달성", check: (state) => state.level >= 5 }
];

const suddenQuestPool = [
    "시원하게 기지개 쭉 켜기 🧘",
    "따뜻한 물 한 잔 마시기 💧",
    "책상 위 안 쓰는 물건 정리하기 🧹",
    "바른 자세로 허리 펴고 3분 앉기 🪑",
    "가볍게 제자리 걸음 50번 하기 🏃"
];

let toastTimer, speechTimer;

function showToast(message) {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 2200);
}

// 강아지 터치 반응
function tapPuppy() {
    const puppyBox = document.getElementById('puppy-box');
    const speech = document.getElementById('puppy-speech');
    
    puppyBox.classList.remove('bounce');
    void puppyBox.offsetWidth; 
    puppyBox.classList.add('bounce');

    const randomText = puppySpeeches[Math.floor(Math.random() * puppySpeeches.length)];
    speech.textContent = randomText;
    speech.classList.add('show');

    clearTimeout(speechTimer);
    speechTimer = setTimeout(() => speech.classList.remove('show'), 2000);
}

// 메뉴 탭 전환
function openTab(tabName) {
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.bottom-menu .tab-btn').forEach(btn => btn.classList.remove('active'));

    document.getElementById(`${tabName}-tab`).classList.add('active');
    event.currentTarget.classList.add('active');

    if (tabName === 'inventory') updateInventoryUI();
    if (tabName === 'title') updateTitleUI();
}

// 종합 UI 업데이트 및 피버 버프 상태 판별
function updateUI() {
    document.getElementById('level').textContent = gameState.level;
    document.getElementById('exp').textContent = gameState.exp;
    document.getElementById('gold').textContent = gameState.gold;
    document.getElementById('happiness').textContent = gameState.happiness;
    document.getElementById('equipped-title').textContent = gameState.equippedTitle ? gameState.equippedTitle + " " : "";
    document.getElementById('stat-total-quests').textContent = gameState.totalQuestsCompleted;
    
    const puppyBox = document.getElementById('puppy-box');
    puppyBox.style.backgroundColor = puppyColors[gameState.colorIndex];

    // 🔥 행복도가 100 이상이면 피버 모드 클래스 부착
    if (gameState.happiness >= 100) {
        puppyBox.classList.add('fever-active');
    } else {
        puppyBox.classList.remove('fever-active');
    }

    checkAchievements();
    localStorage.setItem('questPuppy_final_save', JSON.stringify(gameState)); // 저장 키 업데이트
}

// 업적 해금 체크
function checkAchievements() {
    titleData.forEach(title => {
        if (!gameState.unlockedTitles.includes(title.name) && title.check(gameState)) {
            gameState.unlockedTitles.push(title.name);
            showToast(`🏆 업적 달성!새로운 칭호 [${title.name}] 해금!`);
        }
    });
}

// 경험치 증가 및 레벨업
function gainExp(amount) {
    gameState.exp += amount;
    while (gameState.exp >= 100) {
        gameState.level += 1;
        gameState.exp -= 100;
        showToast(`🎉 레벨 업! 강아지가 레벨 ${gameState.level}이 되었습니다!`);
    }
}

// 일반 퀘스트 등록
function addQuest() {
    const input = document.getElementById('quest-input');
    const text = input.value.trim();
    if (!text) return;

    gameState.quests.push({ text: text, isSudden: false });
    input.value = '';
    
    renderQuests();
    updateUI();
    showToast("📋 퀘스트가 등록되었습니다.");
}

// ⚡ 돌발 퀘스트 생성
function generateSuddenQuest() {
    const hasSudden = gameState.quests.some(q => q.isSudden);
    if (hasSudden) {
        showToast("⚠️ 아직 돌발 미션이 남아있습니다!");
        return;
    }

    const randomMission = suddenQuestPool[Math.floor(Math.random() * suddenQuestPool.length)];
    gameState.quests.unshift({ text: `[돌발] ${randomMission}`, isSudden: true });
    
    renderQuests();
    updateUI();
    showToast("⚡ 긴급 돌발 미션도착! 보상이 큽니다.");
}

// 퀘스트 화면 렌더링
function renderQuests() {
    const list = document.getElementById('quest-list');
    list.innerHTML = '';
    
    gameState.quests.forEach((quest, index) => {
        const li = document.createElement('li');
        if (quest.isSudden) li.classList.add('sudden-quest-item');

        const isFever = gameState.happiness >= 100;
        let expReward = quest.isSudden ? 60 : 38;
        let goldReward = quest.isSudden ? 88 : 33;

        if (isFever) {
            expReward *= 2;
            goldReward *= 3;
        }

        li.innerHTML = `
            <div class="quest-info">
                <span class="quest-title">${quest.text}</span>
                <span class="quest-reward">${isFever ? '🔥피버버프 적용! ' : ''}보상: EXP ${expReward}, GOLD ${goldReward}원</span>
            </div>
            <div class="quest-btns">
                <button class="comp-btn" onclick="completeQuest(${index})">완료</button>
                <button class="del-btn" onclick="deleteQuest(${index})">X</button>
            </div>
        `;
        list.appendChild(li);
    });
}

// 퀘스트 완료
function completeQuest(index) {
    const targetQuest = gameState.quests[index];
    const isFever = gameState.happiness >= 100;

    let finalExp = targetQuest.isSudden ? 60 : 38;
    let finalGold = targetQuest.isSudden ? 88 : 33;

    if (isFever) {
        finalExp *= 2;
        finalGold *= 3;
        gameState.happiness -= 30; 
        if(gameState.happiness < 0) gameState.happiness = 0;
    }

    gameState.quests.splice(index, 1);
    gameState.gold += finalGold;
    gameState.totalQuestsCompleted += 1;
    gainExp(finalExp);
    
    renderQuests();
    updateUI();

    if (isFever) {
        showToast(`🔥초폭주 보상! 💰+${finalGold}원 / 🌟+${finalExp}EXP`);
    } else {
        showToast(`💰 미션 완료! 골드 +${finalGold}, EXP +${finalExp}`);
    }
}

// 퀘스트 삭제
function deleteQuest(index) {
    gameState.quests.splice(index, 1);
    renderQuests();
    updateUI();
    showToast("🗑️ 미션을 삭제했습니다.");
}

// 상점 아이템 구매
function buyItem(itemName, price) {
    if (gameState.gold >= price) {
        gameState.gold -= price;
        gameState.inventory[itemName] += 1;
        showToast(`🛒 ${itemName} 구매 완료! 가방을 확인하세요.`);
        updateUI();
    } else {
        showToast("❌ 골드가 부족합니다!");
    }
}

// 아이템 사용
function useItem(itemName) {
    if (gameState.inventory[itemName] <= 0) return;

    gameState.inventory[itemName] -= 1;

    if (itemName === '산책') {
        gameState.happiness += 33;
        showToast("🌳 산책 완료! 행복 지수 +33");
    } else if (itemName === '빗') {
        gameState.colorIndex = (gameState.colorIndex + 1) % puppyColors.length; 
        gameState.happiness += 13;
        showToast("✨ 빗질 완료! 사진 배경색 변경 & 행복 지수 +13");
    } else if (itemName === '간식') {
        gameState.happiness += 33;
        gainExp(33);
        showToast("🍖 간식 급여! 행복 지수 +33 & EXP +33");
    }

    renderQuests(); 
    updateUI();
    updateInventoryUI();
}

// 인벤토리 UI 그리기
function updateInventoryUI() {
    const list = document.getElementById('inventory-list');
    list.innerHTML = '';
    let empty = true;

    for (const [item, count] of Object.entries(gameState.inventory)) {
        if (count > 0) {
            empty = false;
            const li = document.createElement('li');
            li.innerHTML = `
                <span><strong>${item}</strong> (${count}개)</span>
                <button class="use-btn" onclick="useItem('${item}')">사용</button>
            `;
            list.appendChild(li);
        }
    }
    if (empty) list.innerHTML = '<li style="justify-content:center; color:#999;">가방이 텅 비어 있습니다.</li>';
}

// 칭호 UI
function updateTitleUI() {
    const list = document.getElementById('title-list');
    list.innerHTML = '';

    titleData.forEach(title => {
        const isUnlocked = gameState.unlockedTitles.includes(title.name);
        const isEquipped = gameState.equippedTitle === title.name;

        const li = document.createElement('li');
        li.classList.add('title-item');
        if (isUnlocked) li.classList.add('unlocked');

        let btnHtml = `<button class="title-btn locked" disabled>잠김</button>`;
        if (isUnlocked) {
            if (isEquipped) {
                btnHtml = `<button class="title-btn equipped" onclick="toggleTitle('${title.name}')">장착됨</button>`;
            } else {
                btnHtml = `<button class="title-btn equip" onclick="toggleTitle('${title.name}')">착용</button>`;
            }
        }

        li.innerHTML = `
            <div class="title-text">
                <span class="title-name">${title.name}</span>
                <span class="title-cond">${title.desc}</span>
            </div>
            ${btnHtml}
        `;
        list.appendChild(li);
    });
}

// 칭호 토글
function toggleTitle(titleName) {
    if (gameState.equippedTitle === titleName) {
        gameState.equippedTitle = ""; 
        showToast("칭호를 해제했습니다.");
    } else {
        gameState.equippedTitle = titleName; 
        showToast(`👑 [${titleName}] 칭호 장착!`);
    }
    updateUI();
    updateTitleUI();
}

function resetGame() {
    if(confirm("정말 초기화하시겠습니까? 데이터가 모두 사라집니다.")) {
        localStorage.removeItem('questPuppy_final_save'); 
        location.reload();
    }
}

// 로컬스토리지 로드
function loadGame() {
    const saved = localStorage.getItem('questPuppy_final_save'); 
    if (saved) {
        const parsed = JSON.parse(saved);
        gameState = { ...gameState, ...parsed };
    }
    renderQuests();
    updateUI();
}

loadGame();