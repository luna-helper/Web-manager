// [1] 데이터 정의 및 초기화
const CONFIG = {
    farm: {
        order: ["상추", "옥수수", "양배추", "무", "토마토", "딸기", "포도", "레몬", "오렌지", "파인애플", "바나나", "석류"],
        icons: {"상추":"🥬","옥수수":"🌽","양배추":"🥗","무":"🥕","토마토":"🍅","딸기":"🍓","포도":"🍇","레몬":"🍋","오렌지":"🍊","파인애플":"🍍","바나나":"🍌","석류":"🍎"},
        bases: {"커먼":3, "언커먼":6, "레어":10}
    },
    fish: {
        order: ["뱀장어","농어","습지 개구리","문어","다랑어","숭어","강꼬치고기","연어","랍스터","아귀","철갑상어","금붕어","만타 가오리","적색퉁돔","줄돔","흰동가리","블루탱","푸른 해파리","잉어","개복치","잡어","메기","정어리"],
        icons: {"뱀장어":"🐍","농어":"🐟","습지 개구리":"🐸","문어":"🐙","다랑어":"🐟","숭어":"🐟","강꼬치고기":"🐟","연어":"🍣","랍스터":"🦞","아귀":"🐟","철갑상어":"🦈","금붕어":"🐠","만타 가오리":"🐟","적색퉁돔":"🐟","줄돔":"🐟","흰동가리":"🐠","블루탱":"🐠","푸른 해파리":"🪼","잉어":"🎏","개복치":"🐟","잡어":"🐟","메기":"🐟","정어리":"🐟"},
        bases: {"커먼":7, "언커먼":10, "레어":24} // 낚시 원가 기준
    },
    cook: {
        order: ["쌈밥","옥수수전","전골","무조림","가스파초","부야베스","치오피노","파에야","세비체","해물플래터","데리야끼","에스카베체","양장피","페페스"],
        tiers: {
            "쌈밥":1, "옥수수전":1, "전골":1, "무조림":1, "가스파초":1,
            "부야베스":2, "치오피노":2, "파에야":2, "세비체":2, "해물플래터":2, "데리야끼":2, "에스카베체":2, "양장피":2,
            "페페스":3
        },
        icons: {"쌈밥":"🥬","옥수수전":"🌽","전골":"🍲","무조림":"🥕","가스파초":"🥣","부야베스":"🍲","치오피노":"🥘","파에야":"🥘","세비체":"🥗","해물플래터":"🍱","데리야끼":"🍖","에스카베체":"🐟","양장피":"🥗","페페스":"🍛"},
        bases: { // 요리 티어별 원가
            t1: {"일반":51, "일품":54},
            t2: {"일반":85, "일품":90},
            t3: {"일반":100, "일품":106}
        }
    }
};

let myItems = JSON.parse(localStorage.getItem('myItems')) || [];
let globalPrices = JSON.parse(localStorage.getItem('globalPrices')) || {
    farm: {"커먼":4, "언커먼":7, "레어":11},
    fish: {"커먼":8, "언커먼":11, "레어":25},
    cook: {
        t1: {"일반":52, "일품":55},
        t2: {"일반":86, "일품":91},
        t3: {"일반":101, "일품":107}
    }
};
let currentFilters = { farm: "전체", fish: "전체", cook: "전체" };

window.onload = function() {
    initSelects();
    loadPricesToUI();
    renderAll();
};

// [2] 설정 기능
function loadPricesToUI() {
    document.getElementById('farm-price-common').value = globalPrices.farm["커먼"];
    document.getElementById('farm-price-uncommon').value = globalPrices.farm["언커먼"];
    document.getElementById('farm-price-rare').value = globalPrices.farm["레어"];
    
    document.getElementById('fish-price-common').value = globalPrices.fish["커먼"];
    document.getElementById('fish-price-uncommon').value = globalPrices.fish["언커먼"];
    document.getElementById('fish-price-rare').value = globalPrices.fish["레어"];

    document.getElementById('cook-price-t1-n').value = globalPrices.cook.t1["일반"];
    document.getElementById('cook-price-t1-s').value = globalPrices.cook.t1["일품"];
    document.getElementById('cook-price-t2-n').value = globalPrices.cook.t2["일반"];
    document.getElementById('cook-price-t2-s').value = globalPrices.cook.t2["일품"];
    document.getElementById('cook-price-t3-n').value = globalPrices.cook.t3["일반"];
    document.getElementById('cook-price-t3-s').value = globalPrices.cook.t3["일품"];
}

function saveGlobalPrices() {
    globalPrices.farm = {
        "커먼": parseInt(document.getElementById('farm-price-common').value),
        "언커먼": parseInt(document.getElementById('farm-price-uncommon').value),
        "레어": parseInt(document.getElementById('farm-price-rare').value)
    };
    globalPrices.fish = {
        "커먼": parseInt(document.getElementById('fish-price-common').value),
        "언커먼": parseInt(document.getElementById('fish-price-uncommon').value),
        "레어": parseInt(document.getElementById('fish-price-rare').value)
    };
    globalPrices.cook = {
        t1: {"일반": parseInt(document.getElementById('cook-price-t1-n').value), "일품": parseInt(document.getElementById('cook-price-t1-s').value)},
        t2: {"일반": parseInt(document.getElementById('cook-price-t2-n').value), "일품": parseInt(document.getElementById('cook-price-t2-s').value)},
        t3: {"일반": parseInt(document.getElementById('cook-price-t3-n').value), "일품": parseInt(document.getElementById('cook-price-t3-s').value)}
    };
    localStorage.setItem('globalPrices', JSON.stringify(globalPrices));
    renderAll();
}

// [3] 공통 기능
function switchTab(tabName) {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    event.currentTarget.classList.add('active');
    document.getElementById(`${tabName}-content`).classList.add('active');
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

    myItems.push({
        id: Date.now(),
        type: type,
        name: name,
        grade: grade,
        expiry: `${dateInput}-09:00`,
        icon: CONFIG[type].icons[name]
    });
    sortAndSave();
}

function sortAndSave() {
    myItems.sort((a, b) => {
        if (a.type !== b.type) return a.type.localeCompare(b.type);
        const order = CONFIG[a.type].order;
        const idxA = order.indexOf(a.name);
        const idxB = order.indexOf(b.name);
        if (idxA !== idxB) return idxA - idxB;
        return new Date(a.expiry.split('-09:00')[0]) - new Date(b.expiry.split('-09:00')[0]);
    });
    localStorage.setItem('myItems', JSON.stringify(myItems));
    renderAll();
}

function deleteItem(id) {
    if(confirm("삭제하시겠습니까?")) {
        myItems = myItems.filter(i => i.id !== id);
        sortAndSave();
    }
}

// [4] 렌더링
function renderAll() {
    ['farm', 'fish', 'cook'].forEach(type => {
        const filterCont = document.getElementById(`${type}Filters`);
        filterCont.innerHTML = ["전체", ...CONFIG[type].order].map(name => `
            <button class="filter-btn ${currentFilters[type] === name ? 'active' : ''}" 
            onclick="currentFilters['${type}']='${name}'; renderAll();">${name}</button>
        `).join('');

        const grid = document.getElementById(`${type}Grid`);
        const now = new Date();
        const filtered = currentFilters[type] === "전체" ? myItems.filter(i => i.type === type) : myItems.filter(i => i.type === type && i.name === currentFilters[type]);

        grid.innerHTML = filtered.map(item => {
            const isExpired = now > new Date(item.expiry.split('-09:00')[0] + 'T09:00:00');
            let target = 0;
            if(type === 'cook') {
                const t = "t" + CONFIG.cook.tiers[item.name];
                target = globalPrices.cook[t][item.grade];
            } else {
                target = globalPrices[type][item.grade];
            }

            return `
                <div class="crop-card ${isExpired ? 'expired' : item.grade}">
                    <button class="delete-btn" onclick="deleteItem(${item.id})">×</button>
                    <span class="crop-icon">${item.icon}</span>
                    <div style="text-align:center">
                        <b>${item.name}</b>
                        <div style="font-size:0.7rem; color:var(--text-dim);">${item.grade} | 목표 ${target}원</div>
                        <div style="font-size:0.7rem; font-weight:bold; margin-top:5px;">${item.expiry.split('-09:00')[0]}</div>
                    </div>
                </div>
            `;
        }).join('');
    });
}

// [5] 시세 분석 (핵심 로직)
function analyzeMarket() {
    const text = document.getElementById('marketData').value;
    const resultDiv = document.getElementById('analysisResult');
    if(!text) return alert("시세 데이터를 입력하세요.");

    const marketPrices = {};
    let lastFound = "";
    text.split('\n').forEach(line => {
        const t = line.trim();
        if(t.includes('[') && t.includes(']')) lastFound = t.replace('- ', '').trim();
        if(t.includes('현재 변동가')) {
            const p = parseInt(t.split(':')[1].replace(/[^0-9]/g, ''));
            if(!isNaN(p)) marketPrices[lastFound] = p;
        }
    });

    const now = new Date();
    resultDiv.innerHTML = myItems.map(mine => {
        // 루나월드 표기법 변환
        let fullName = "";
        if(mine.type === 'cook') {
            fullName = `[${mine.grade}] ${mine.name}`;
        } else {
            fullName = `[${mine.grade}] ${mine.grade === '레어' ? '최상급 ' : (mine.grade === '언커먼' ? '신선한 ' : '')}${mine.name}`;
        }

        // 1. 시장가 결정
        let defaultBase = 0;
        let target = 0;
        if(mine.type === 'cook') {
            const t = "t" + CONFIG.cook.tiers[mine.name];
            defaultBase = CONFIG.cook.bases[t][mine.grade];
            target = globalPrices.cook[t][mine.grade];
        } else {
            defaultBase = CONFIG.fish.type === 'fish' ? CONFIG.fish.bases[mine.grade] : (mine.grade==='레어'?10:mine.grade==='언커먼'?6:3);
            target = globalPrices[mine.type][mine.grade];
        }
        
        const currentPrice = marketPrices[fullName] || defaultBase;
        const diffHours = (new Date(mine.expiry.split('-09:00')[0] + 'T09:00:00') - now) / 3600000;

        let decision = "보관"; let isSell = false;

        if(diffHours < 0) decision = "❌ 만료";
        else if(currentPrice >= target) {
            decision = `⚡ 즉시 판매 (${currentPrice}원)`;
            isSell = true;
        } else if(diffHours < 24) {
            // 낚시/요리 로직: 기한 임박 시 원가 '이상'일 때만 판매 추천
            if(currentPrice >= defaultBase) {
                decision = "⏳ 기한 임박 (원가 이상 판매)";
                isSell = true;
            } else {
                decision = "⚠️ 기한 임박 (원가 미달 보관)";
            }
        }

        return `
            <div class="result-item ${isSell ? 'sell' : ''}">
                <div class="res-info">
                    <b>${mine.icon} ${mine.name} [${mine.grade}]</b>
                    <div class="res-expiry">시장: ${currentPrice} / 목표: ${target} / 원가: ${defaultBase}</div>
                </div>
                <div style="font-weight:bold; color:${isSell?'var(--success)':'white'}">${decision}</div>
            </div>
        `;
    }).join('');
}
