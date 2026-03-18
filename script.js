const CROP_ORDER = ["상추", "옥수수", "양배추", "무", "토마토", "딸기", "포도", "레몬", "오렌지", "파인애플", "바나나", "석류"];
const GRADE_ORDER = { "커먼": 1, "언커먼": 2, "레어": 3 };
const CROP_ICONS = { "상추": "🥬", "옥수수": "🌽", "양배추": "🥗", "무": "🥕", "토마토": "🍅", "딸기": "🍓", "포도": "🍇", "레몬": "🍋", "오렌지": "🍊", "파인애플": "🍍", "바나나": "🍌", "석류": "🍎" };

let myCrops = JSON.parse(localStorage.getItem('myCrops')) || [];
let currentFilter = "전체";

function saveCrop() {
    const name = document.getElementById('cropSelect').value;
    const grade = document.getElementById('gradeSelect').value;
    const dateInput = document.getElementById('expiryDate').value;
    
    if(!dateInput) return alert("날짜를 선택해 주세요.");
    
    const year = parseInt(dateInput.split('-')[0]);
    if(year > 2099 || year < 2000) return alert("유효한 날짜를 입력하세요 (2000-2099).");

    const newCrop = {
        id: Date.now(),
        name: name,
        grade: grade,
        expiry: `${dateInput}-09:00`,
        icon: CROP_ICONS[name]
    };

    myCrops.push(newCrop);
    sortAndSave();
}

function sortAndSave() {
    myCrops.sort((a, b) => {
        const orderA = CROP_ORDER.indexOf(a.name);
        const orderB = CROP_ORDER.indexOf(b.name);
        if (orderA !== orderB) return orderA - orderB;
        const dateA = new Date(a.expiry.split('-09:00')[0]);
        const dateB = new Date(b.expiry.split('-09:00')[0]);
        if (dateA - dateB !== 0) return dateA - dateB;
        return GRADE_ORDER[a.grade] - GRADE_ORDER[b.grade];
    });
    localStorage.setItem('myCrops', JSON.stringify(myCrops));
    renderAll();
}

function deleteCrop(id) {
    if(!confirm("삭제하시겠습니까?")) return;
    myCrops = myCrops.filter(c => c.id !== id);
    sortAndSave();
}

function renderFilters() {
    const filterContainer = document.getElementById('categoryFilters');
    const counts = { "전체": myCrops.length };
    CROP_ORDER.forEach(name => {
        counts[name] = myCrops.filter(c => c.name === name).length;
    });

    filterContainer.innerHTML = ["전체", ...CROP_ORDER].map(name => `
        <button class="filter-btn ${currentFilter === name ? 'active' : ''}" onclick="setFilter('${name}')">
            ${name === "전체" ? "전체" : CROP_ICONS[name] + " " + name}
            <span>${counts[name]}</span>
        </button>
    `).join('');
}

function setFilter(name) {
    currentFilter = name;
    renderAll();
}

function renderMyCrops() {
    const container = document.getElementById('myCropsGrid');
    const now = new Date();
    const filteredCrops = currentFilter === "전체" ? myCrops : myCrops.filter(c => c.name === currentFilter);

    if (filteredCrops.length === 0) {
        container.innerHTML = `<p style="grid-column: 1/-1; text-align: center; color: #555; padding: 40px;">해당하는 작물이 없습니다.</p>`;
        return;
    }

    container.innerHTML = filteredCrops.map(c => {
        const expiryDate = new Date(c.expiry.split('-09:00')[0] + 'T09:00:00');
        const isExpired = now > expiryDate;
        const gradeClass = c.grade === '레어' ? 'rare' : (c.grade === '언커먼' ? 'uncommon' : 'common');
        
        return `
            <div class="crop-card ${isExpired ? 'expired' : gradeClass}">
                <button class="delete-btn" onclick="deleteCrop(${c.id})">×</button>
                <span class="crop-icon">${c.icon}</span>
                <div style="text-align:center">
                    <strong style="display:block; margin-bottom:5px;">${c.name}</strong>
                    <span style="font-size:0.75rem; opacity:0.8;">${c.grade} 등급</span>
                    <div style="font-size:0.75rem; color:${isExpired ? 'var(--danger)' : 'var(--accent)'}; font-weight:bold; margin-top:10px;">
                        ${c.expiry.split('-09:00')[0]}
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function analyzeMarket() {
    const text = document.getElementById('marketData').value;
    const resultDiv = document.getElementById('analysisResult');
    if(!text || myCrops.length === 0) return alert("시세 데이터와 등록된 작물이 필요합니다.");

    const marketPrices = {};
    const lines = text.split('\n');
    let currentItemName = "";

    lines.forEach(line => {
        const trimmed = line.trim();
        // 등급과 이름이 포함된 줄 추출 (예: - [레어] 최상급 포도)
        if(trimmed.includes('[') && trimmed.includes(']')) {
            currentItemName = trimmed.replace('- ', '').trim();
        }
        // 가격 추출
        if(trimmed.includes('현재 변동가')) {
            const price = parseInt(trimmed.split(':')[1].replace(/[^0-9]/g, ''));
            if(!isNaN(price)) marketPrices[currentItemName] = price;
        }
    });

    const now = new Date();
    resultDiv.innerHTML = myCrops.map(mine => {
        // 루나월드 표기법에 맞춘 전체 이름 생성
        const fullName = `[${mine.grade}] ${mine.grade === '레어' ? '최상급 ' : (mine.grade === '언커먼' ? '신선한 ' : '')}${mine.name}`;
        
        const basePrice = mine.grade === '레어' ? 10 : (mine.grade === '언커먼' ? 6 : 3);
        const maxPrice = mine.grade === '레어' ? 11 : (mine.grade === '언커먼' ? 7 : 4);
        let currentPrice = marketPrices[fullName] || basePrice;

        const expiryFull = new Date(mine.expiry.split('-09:00')[0] + 'T09:00:00');
        const diffHours = (expiryFull - now) / (1000 * 60 * 60);

        let decision = "보관";
        let isSell = false;

        if(diffHours < 0) decision = "❌ 판매 불가 (만료)";
        else if(currentPrice >= maxPrice) { decision = "⚡ 즉시 판매 (최고가)"; isSell = true; }
        else if(diffHours < 24 && currentPrice >= basePrice) { decision = "⏳ 판매 추천 (기한 임박)"; isSell = true; }

        // 등급별 클래스 (텍스트 색상용)
        const gradeClass = mine.grade === '레어' ? 'rare' : (mine.grade === '언커먼' ? 'uncommon' : 'common');

        return `
            <div class="result-item ${isSell ? 'sell' : ''}">
                <div class="res-info">
                    <div>
                        <span style="font-size:1.1rem;">${mine.icon}</span> 
                        <b style="margin-left:5px;">${mine.name}</b>
                        <span class="res-grade ${gradeClass}" style="margin-left:8px;">[${mine.grade}]</span>
                    </div>
                    <span class="res-expiry">기한: ${mine.expiry.split('-09:00')[0]} (${diffHours > 0 ? Math.floor(diffHours) + '시간 남음' : '만료'})</span>
                </div>
                <div style="text-align:right">
                    <div style="font-size:1.1rem; font-weight:bold; color:var(--rare);">${currentPrice}원</div>
                    <div style="font-weight:bold; font-size:0.9rem; color:${isSell ? 'var(--success)' : (diffHours < 0 ? 'var(--danger)' : 'white')}">${decision}</div>
                </div>
            </div>
        `;
    }).join('');
}

function renderAll() {
    renderFilters();
    renderMyCrops();
}
renderAll();