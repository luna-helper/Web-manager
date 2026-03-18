let activeTab = 'farm';
const CONFIG = {
    farm: { order: ["상추", "옥수수", "양배추", "무", "토마토", "딸기", "포도", "레몬", "오렌지", "파인애플", "바나나", "석류"], icons: {"상추":"🥬","옥수수":"🌽","양배추":"🥗","무":"🥕","토마토":"🍅","딸기":"🍓","포도":"🍇","레몬":"🍋","오렌지":"🍊","파인애플":"🍍","바나나":"🍌","석류":"🍎"} },
    fish: { order: ["뱀장어","농어","습지 개구리","문어","다랑어","숭어","강꼬치고기","연어","랍스터","아귀","철갑상어","금붕어","만타 가오리","적색퉁돔","줄돔","흰동가리","블루탱","푸른 해파리","잉어","개복치","잡어","메기","정어리"], icons: {"뱀장어":"🐍","농어":"🐟","습지 개구리":"🐸","문어":"🐙","다랑어":"🐟","숭어":"🐟","강꼬치고기":"🐟","연어":"🍣","랍스터":"🦞","아귀":"🐟","철갑상어":"🦈","금붕어":"🐠","만타 가오리":"🐟","적색퉁돔":"🐟","줄돔":"🐟","흰동가리":"🐠","블루탱":"🐠","푸른 해파리":"🪼","잉어":"🎏","개복치":"🐟","잡어":"🐟","메기":"🐟","정어리":"🐟"}, bases: {"커먼":7, "언커먼":10, "레어":24} },
    cook: { order: ["상추쌈밥","옥수수전","전골","무조림","가스파초","부야베스","치오피노","파에야","세비체","해물플래터","데리야끼","에스카베체","양장피","페페스"], tiers: {"상추쌈밥":1,"옥수수전":1,"전골":1,"무조림":1,"가스파초":1,"부야베스":2,"치오피노":2,"파에야":2,"세비체":2,"해물플래터":2,"데리야끼":2,"에스카베체":2,"양장피":2,"페페스":3}, icons: {"상추쌈밥":"🥬","옥수수전":"🌽","전골":"🍲","무조림":"🥕","가스파초":"🥣","부야베스":"🍲","치오피노":"🥘","파에야":"🥘","세비체":"🥗","해물플래터":"🍱","데리야끼":"🍖","에스카베체":"🐟","양장피":"🥗","페페스":"🍛"}, bases: { t1: {"일반":51,"일품":54}, t2: {"일반":85,"일품":90}, t3: {"일반":100,"일품":106} } }
};

let myItems = JSON.parse(localStorage.getItem('myItems')) || [];
let globalPrices = JSON.parse(localStorage.getItem('globalPrices')) || { farm: {"커먼":4, "언커먼":7, "레어":11}, fish: {"커먼":8, "언커먼":11, "레어":25}, cook: { t1: {"일반":52, "일품":55}, t2: {"일반":86, "일품":91}, t3: {"일반":101, "일품":107} } };
let currentFilters = { farm: "전체", fish: "전체", cook: "전체" };

window.onload = function() { initSelects(); loadPricesToUI(); renderAll(); };

function limitDigits(el) { if (el.value.length > 6) el.value = el.value.slice(0, 6); }

function switchTab(tabName) {
    activeTab = tabName;
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    if(event) event.currentTarget.classList.add('active');
    document.getElementById(`${tabName}-content`).classList.add('active');
    if(document.getElementById('analysisResult').innerText.indexOf('분석 결과') !== -1) analyzeMarketFull();
}

function initSelects() {
    ['farm', 'fish', 'cook'].forEach(type => {
        const select = document.getElementById(`${type}Select`);
        select.innerHTML = CONFIG[type].order.map(name => `<option value="${name}">${CONFIG[type].icons[name] || ''} ${name}</option>`).join('');
    });
}

function saveItem(type) {
    const name = document.getElementById(`${type}Select`).value;
    const grade = document.getElementById(`${type}Grade`).value;
    const dateInput = document.getElementById(`${type}Expiry`).value;
    if(!dateInput) return alert("유통기한을 선택하세요.");
    myItems.push({ id: Date.now(), type: type, name: name, grade: grade, expiry: `${dateInput}-09:00`, icon: CONFIG[type].icons[name] });
    sortAndSave();
}

function sortAndSave() {
    myItems.sort((a, b) => {
        if (a.type !== b.type) return a.type.localeCompare(b.type);
        const order = CONFIG[a.type].order;
        const idxA = order.indexOf(a.name); const idxB = order.indexOf(b.name);
        if (idxA !== idxB) return idxA - idxB;
        return new Date(a.expiry.split('-09:00')[0]) - new Date(b.expiry.split('-09:00')[0]);
    });
    localStorage.setItem('myItems', JSON.stringify(myItems));
    renderAll();
}

function deleteItem(id) { if(confirm("삭제하시겠습니까?")) { myItems = myItems.filter(i => i.id !== id); sortAndSave(); } }

function renderAll() {
    ['farm', 'fish', 'cook'].forEach(type => {
        const filterCont = document.getElementById(`${type}Filters`);
        filterCont.innerHTML = ["전체", ...CONFIG[type].order].map(name => `<button class="filter-btn ${currentFilters[type] === name ? 'active' : ''}" onclick="currentFilters['${type}']='${name}'; renderAll();">${name}</button>`).join('');

        const grid = document.getElementById(`${type}Grid`);
        const now = new Date();
        const filtered = currentFilters[type] === "전체" ? myItems.filter(i => i.type === type) : myItems.filter(i => i.type === type && i.name === currentFilters[type]);

        grid.innerHTML = filtered.map(item => {
            const isExpired = now > new Date(item.expiry.split('-09:00')[0] + 'T09:00:00');
            let gradeClass = (item.type === 'cook') ? (item.grade === '일품' ? 'grade-cook-premium' : 'grade-cook-normal') : (item.grade === '레어' ? 'grade-rare' : (item.grade === '언커먼' ? 'grade-uncommon' : 'grade-common'));
            let target = (item.type === 'cook') ? globalPrices.cook["t" + CONFIG.cook.tiers[item.name]][item.grade] : globalPrices[item.type][item.grade];

            return `
                <div class="crop-card ${gradeClass} ${isExpired ? 'card-expired' : ''}">
                    <button class="delete-btn" onclick="deleteItem(${item.id})">×</button>
                    <span class="crop-icon">${item.icon}</span>
                    <div>
                        <b style="font-size:0.85rem; display:block; margin-bottom:4px;">${item.name}</b>
                        <div style="font-size:0.7rem; color:var(--text-dim)">${item.grade} | ${target}원</div>
                        <div style="font-size:0.75rem; font-weight:700; margin-top:6px; color:${isExpired?'var(--danger)':'var(--accent)'}">${item.expiry.split('-09:00')[0]}</div>
                    </div>
                </div>`;
        }).join('');
    });
}

function loadPricesToUI() {
    const gp = globalPrices;
    document.getElementById('farm-price-common').value = gp.farm["커먼"];
    document.getElementById('farm-price-uncommon').value = gp.farm["언커먼"];
    document.getElementById('farm-price-rare').value = gp.farm["레어"];
    document.getElementById('fish-price-common').value = gp.fish["커먼"];
    document.getElementById('fish-price-uncommon').value = gp.fish["언커먼"];
    document.getElementById('fish-price-rare').value = gp.fish["레어"];
    document.getElementById('cook-price-t1-n').value = gp.cook.t1["일반"];
    document.getElementById('cook-price-t1-s').value = gp.cook.t1["일품"];
    document.getElementById('cook-price-t2-n').value = gp.cook.t2["일반"];
    document.getElementById('cook-price-t2-s').value = gp.cook.t2["일품"];
    document.getElementById('cook-price-t3-n').value = gp.cook.t3["일반"];
    document.getElementById('cook-price-t3-s').value = gp.cook.t3["일품"];
}

function saveGlobalPrices() {
    globalPrices.farm = { "커먼": parseInt(document.getElementById('farm-price-common').value) || 0, "언커먼": parseInt(document.getElementById('farm-price-uncommon').value) || 0, "레어": parseInt(document.getElementById('farm-price-rare').value) || 0 };
    globalPrices.fish = { "커먼": parseInt(document.getElementById('fish-price-common').value) || 0, "언커먼": parseInt(document.getElementById('fish-price-uncommon').value) || 0, "레어": parseInt(document.getElementById('fish-price-rare').value) || 0 };
    globalPrices.cook = {
        t1: {"일반": parseInt(document.getElementById('cook-price-t1-n').value) || 0, "일품": parseInt(document.getElementById('cook-price-t1-s').value) || 0},
        t2: {"일반": parseInt(document.getElementById('cook-price-t2-n').value) || 0, "일품": parseInt(document.getElementById('cook-price-t2-s').value) || 0},
        t3: {"일반": parseInt(document.getElementById('cook-price-t3-n').value) || 0, "일품": parseInt(document.getElementById('cook-price-t3-s').value) || 0}
    };
    localStorage.setItem('globalPrices', JSON.stringify(globalPrices));
    renderAll();
}

function analyzeMarketFull() {
    const dataSources = { farm: document.getElementById('marketDataFarm').value, fish: document.getElementById('marketDataFish').value, cook: document.getElementById('marketDataCook').value };
    const resultDiv = document.getElementById('analysisResult');
    const marketPrices = {};

    Object.values(dataSources).forEach(text => {
        let lastFound = "";
        text.split('\n').forEach(line => {
            const t = line.trim();
            if(t.includes('[') && t.includes(']')) lastFound = t.replace('- ', '').trim();
            if(t.includes('현재 변동가')) {
                const p = parseInt(t.split(':')[1].replace(/[^0-9]/g, ''));
                if(!isNaN(p)) marketPrices[lastFound] = p;
            }
        });
    });

    const categories = { farm: "🌱 농작물 분석 결과", fish: "🎣 수산물 분석 결과", cook: "🍳 요리 분석 결과" };
    const categorizedHTML = { farm: "", fish: "", cook: "" };
    const now = new Date();

    myItems.forEach(mine => {
        if (mine.type !== activeTab) return;

        let fullName = mine.type === 'cook' ? `[${mine.grade}] ${mine.name}` : `[${mine.grade}] ${mine.grade === '레어' ? '최상급 ' : (mine.grade === '언커먼' ? '신선한 ' : '')}${mine.name}`;
        let defaultBase = 0; let target = 0;
        
        if(mine.type === 'cook') { const t = "t" + CONFIG.cook.tiers[mine.name]; defaultBase = CONFIG.cook.bases[t][mine.grade]; target = globalPrices.cook[t][mine.grade]; } 
        else if(mine.type === 'fish') { defaultBase = CONFIG.fish.bases[mine.grade]; target = globalPrices.fish[mine.grade]; } 
        else { defaultBase = mine.grade==='레어'?10:mine.grade==='언커먼'?6:3; target = globalPrices.farm[mine.grade]; }
        
        const currentPrice = marketPrices[fullName] || defaultBase;
        const expiryDate = new Date(mine.expiry.split('-09:00')[0] + 'T09:00:00');
        const diffHours = (expiryDate - now) / 3600000;
        
        let decision = "보관"; let isSell = false;
        if(diffHours < 0) decision = "❌ 만료";
        else if(currentPrice >= target) { decision = `⚡ 즉시 판매 (${currentPrice}원)`; isSell = true; }
        else if(diffHours < 24) { if(mine.type === 'farm' || currentPrice >= defaultBase) { decision = "⏳ 기한 임박 (판매 권장)"; isSell = true; } else decision = "⚠️ 기한 임박 (원가 미달 보관)"; }
        
        // 남은 시간 계산 (D-Day 및 시간)
        let timeLabel = "";
        if (diffHours < 0) timeLabel = "기한 만료";
        else if (diffHours >= 24) timeLabel = `D-${Math.floor(diffHours / 24)}`;
        else timeLabel = `${Math.floor(diffHours)}시간 남음`;

        categorizedHTML[mine.type] += `
            <div class="result-item ${isSell ? 'sell' : ''}">
                <div class="res-info">
                    <b>${mine.icon} ${mine.name} [${mine.grade}]</b>
                    <div class="res-meta">시장: ${currentPrice} / 목표: ${target}</div>
                    <div class="res-meta" style="color:var(--accent)">📅 ${mine.expiry.split('-09:00')[0]} (${timeLabel})</div>
                </div>
                <div style="font-weight:bold; color:${isSell?'var(--success)':'white'}">${decision}</div>
            </div>`;
    });

    let finalHTML = categorizedHTML[activeTab] ? `<div class="result-category-title">${categories[activeTab]}</div>${categorizedHTML[activeTab]}` : "";
    resultDiv.innerHTML = finalHTML || `<div class='result-placeholder'>[${activeTab}] 카테고리에 등록된 아이템이나 시세 정보가 없습니다.</div>`;
}
