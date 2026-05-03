const YiJing = window.YiJingCore;

const els = {
    userName: document.getElementById("userName"),
    userQuestion: document.getElementById("userQuestion"),
    btnExplain: document.getElementById("btnExplain"),
    btnCloseDialog: document.getElementById("btnCloseDialog"),
    btnAsk: document.getElementById("btnAsk"),
    btnStart: document.getElementById("btnStart"),
    btnShot: document.getElementById("btnShot"),
    resultText: document.getElementById("resultText"),
    hGuaName: document.getElementById("hGuaName"),
    gGuaName: document.getElementById("gGuaName"),
    hGuaImages: document.getElementById("hGuaImages"),
    gGuaImages: document.getElementById("gGuaImages"),
    guaExplanation: document.getElementById("guaExplanation"),
    interpretationTitle: document.getElementById("interpretationTitle"),
    castTime: document.getElementById("castTime"),
    explanationDialog: document.getElementById("explanationDialog")
};

let guaDictionary = {};
let hasCast = false;

function showExplanation() {
    if (typeof els.explanationDialog.showModal === "function") {
        els.explanationDialog.showModal();
        return;
    }

    alert("本程式模擬蓍草占卦。請守「不誠不占，不義不占，不疑不占」。一次詢問一個問題。");
}

function closeExplanation() {
    els.explanationDialog.close();
}

function getInvocationText() {
    const userName = els.userName.value.trim() || "某";
    const userQuestion = els.userQuestion.value.trim();
    const questionText = userQuestion ? `${userQuestion}，` : "";

    return `假爾泰筮有常，${userName}${questionText}未知可否。爰質所疑於神之靈，吉凶、得失、悔吝、憂虞，惟爾有神，尚明告之。`;
}

function generatePrediction() {
    els.resultText.textContent = getInvocationText();
}

function lineLabel(index, base, isChanging) {
    const position = ["初", "二", "三", "四", "五", "上"][index];
    const nature = base === "yin" ? "陰" : "陽";
    const change = isChanging ? "，變爻" : "";
    return `${position}爻，${nature}${change}`;
}

function renderLines(container, logical, changingFlags, markChanges) {
    const fragment = document.createDocumentFragment();

    for (let pos = 5; pos >= 0; pos--) {
        const base = logical[pos];
        const isChanging = Boolean(changingFlags[pos]);
        const div = document.createElement("div");
        div.className = markChanges && isChanging
            ? `yao-line ${base === "yin" ? "yin6" : "yang9"}`
            : `yao-line ${base}`;
        div.setAttribute("role", "img");
        div.setAttribute("aria-label", lineLabel(pos, base, markChanges && isChanging));
        fragment.appendChild(div);
    }

    container.replaceChildren(fragment);
}

function renderExplanation(parts) {
    const cleanParts = parts.map(text => text.trim()).filter(Boolean);
    const wrapper = document.createElement("div");
    wrapper.className = "interpretation-text";

    cleanParts.forEach(text => {
        const paragraph = document.createElement("p");
        paragraph.textContent = text;
        wrapper.appendChild(paragraph);
    });

    els.guaExplanation.replaceChildren(wrapper);
}

function startCasting() {
    generatePrediction();

    const sixLines = YiJing.castSixLines();
    const result = YiJing.createReadingResult(guaDictionary, sixLines);

    els.hGuaName.textContent = result.hData.name || "";
    els.gGuaName.textContent = result.gData.name || "";
    els.interpretationTitle.textContent = `${result.changes} 變`;

    renderLines(els.hGuaImages, result.hLogical, result.isChanging, true);
    renderLines(els.gGuaImages, result.gLogical, result.isChanging, false);
    renderExplanation(result.explanation);

    els.castTime.textContent = `起卦時間：${new Date().toLocaleString("zh-Hant-TW")}`;
    hasCast = true;
}

function saveReading() {
    if (!hasCast) {
        els.resultText.textContent = "請先起卦，再存檔。";
        return;
    }

    window.print();
}

function validateGuaData(data) {
    const entries = Object.entries(data);
    return entries.length === 64 && entries.every(([, value]) => (
        value
        && typeof value.name === "string"
        && typeof value.guaExplanation === "string"
        && Array.isArray(value.yaoExplanations)
        && value.yaoExplanations.length === 6
    ));
}

async function loadGuaData() {
    const response = await fetch("gua-data.json");
    if (!response.ok) {
        throw new Error(`Failed to load gua-data.json: ${response.status}`);
    }

    const data = await response.json();
    if (!validateGuaData(data)) {
        throw new Error("gua-data.json format is invalid.");
    }

    guaDictionary = data;
}

function bindUI() {
    els.btnExplain.addEventListener("click", showExplanation);
    els.btnCloseDialog.addEventListener("click", closeExplanation);
    els.explanationDialog.addEventListener("click", event => {
        if (event.target === els.explanationDialog) {
            closeExplanation();
        }
    });
    els.btnAsk.addEventListener("click", generatePrediction);
    els.btnStart.addEventListener("click", startCasting);
    els.btnShot.addEventListener("click", saveReading);
}

async function initializeApp() {
    bindUI();

    try {
        await loadGuaData();
        els.btnStart.disabled = false;
        els.btnStart.textContent = "起卦";
    } catch (error) {
        console.error(error);
        els.resultText.textContent = "卦資料載入失敗，請稍後再試。";
    }
}

initializeApp();
