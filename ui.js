const YiJing = window.YiJingCore;

const els = {
    userName: document.getElementById("userName"),
    userQuestion: document.getElementById("userQuestion"),
    btnExplain: document.getElementById("btnExplain"),
    btnCloseDialog: document.getElementById("btnCloseDialog"),
    btnStart: document.getElementById("btnStart"),
    btnShot: document.getElementById("btnShot"),
    captureArea: document.getElementById("captureArea"),
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
let currentReading = null;

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

function renderInvocation() {
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
    renderInvocation();

    const sixLines = YiJing.castSixLines();
    const result = YiJing.createReadingResult(guaDictionary, sixLines);

    els.hGuaName.textContent = result.hData.name || "";
    els.gGuaName.textContent = result.gData.name || "";
    els.interpretationTitle.textContent = `${result.changes} 變`;

    renderLines(els.hGuaImages, result.hLogical, result.isChanging, true);
    renderLines(els.gGuaImages, result.gLogical, result.isChanging, false);
    renderExplanation(result.explanation);

    const castTime = new Date().toLocaleString("zh-Hant-TW");
    els.castTime.textContent = `起卦時間：${castTime}`;
    currentReading = {
        invocation: els.resultText.textContent,
        castTime,
        result
    };
    hasCast = true;
}

function roundRect(context, x, y, width, height, radius) {
    context.beginPath();
    context.moveTo(x + radius, y);
    context.arcTo(x + width, y, x + width, y + height, radius);
    context.arcTo(x + width, y + height, x, y + height, radius);
    context.arcTo(x, y + height, x, y, radius);
    context.arcTo(x, y, x + width, y, radius);
    context.closePath();
}

function drawWrappedText(context, text, x, y, maxWidth, lineHeight) {
    const chars = Array.from(text);
    let line = "";
    let currentY = y;

    chars.forEach(char => {
        const testLine = line + char;
        if (context.measureText(testLine).width > maxWidth && line) {
            context.fillText(line, x, currentY);
            line = char;
            currentY += lineHeight;
        } else {
            line = testLine;
        }
    });

    if (line) {
        context.fillText(line, x, currentY);
        currentY += lineHeight;
    }

    return currentY;
}

function drawTaichiMark(context, x, y, radius) {
    context.save();
    context.fillStyle = "#fffaf0";
    context.strokeStyle = "rgba(23, 19, 15, 0.16)";
    context.lineWidth = 3;
    context.beginPath();
    context.arc(x, y, radius, 0, Math.PI * 2);
    context.fill();
    context.stroke();
    context.clip();

    context.fillStyle = "#0f0c09";
    context.beginPath();
    context.arc(x, y - radius / 2, radius / 2, Math.PI / 2, Math.PI * 1.5, true);
    context.arc(x, y + radius / 2, radius / 2, Math.PI * 1.5, Math.PI / 2, false);
    context.arc(x, y, radius, Math.PI / 2, Math.PI * 1.5, false);
    context.fill();

    context.fillStyle = "#fffaf0";
    context.beginPath();
    context.arc(x, y - radius / 2, radius / 7, 0, Math.PI * 2);
    context.fill();

    context.fillStyle = "#0f0c09";
    context.beginPath();
    context.arc(x, y + radius / 2, radius / 7, 0, Math.PI * 2);
    context.fill();
    context.restore();
}

function drawHexagramLines(context, logical, changingFlags, markChanges, x, y, width) {
    const lineHeight = 18;
    const gap = 22;
    const split = width * 0.14;
    const segment = (width - split) / 2;

    for (let pos = 5; pos >= 0; pos--) {
        const lineY = y + (5 - pos) * (lineHeight + gap);
        const changing = markChanges && Boolean(changingFlags[pos]);
        const color = changing ? "#a93624" : "#17130f";

        context.fillStyle = color;
        if (logical[pos] === "yin") {
            roundRect(context, x, lineY, segment, lineHeight, 9);
            context.fill();
            roundRect(context, x + segment + split, lineY, segment, lineHeight, 9);
            context.fill();
        } else {
            roundRect(context, x, lineY, width, lineHeight, 9);
            context.fill();
        }
    }
}

function drawHexagramCard(context, title, name, logical, changingFlags, markChanges, x, y, width) {
    const height = 360;
    context.fillStyle = "rgba(255, 252, 246, 0.9)";
    roundRect(context, x, y, width, height, 18);
    context.fill();
    context.strokeStyle = "rgba(23, 19, 15, 0.14)";
    context.stroke();

    context.fillStyle = "#4c443a";
    context.font = "700 26px -apple-system, BlinkMacSystemFont, sans-serif";
    context.fillText(title, x + 34, y + 58);

    context.fillStyle = "#17130f";
    context.font = "800 54px Songti TC, Noto Serif TC, serif";
    context.textAlign = "right";
    context.fillText(name, x + width - 34, y + 68);
    context.textAlign = "left";

    drawHexagramLines(context, logical, changingFlags, markChanges, x + 72, y + 130, width - 144);
    return y + height;
}

function createScreenshotBlob() {
    const reading = currentReading;
    const sourceCanvas = document.createElement("canvas");
    const width = 1080;
    const maxHeight = 2400;
    sourceCanvas.width = width;
    sourceCanvas.height = maxHeight;

    const context = sourceCanvas.getContext("2d");
    context.fillStyle = "#f8f5ee";
    context.fillRect(0, 0, width, maxHeight);

    let y = 72;
    const margin = 72;
    const contentWidth = width - margin * 2;

    drawTaichiMark(context, margin + 44, y + 44, 44);
    context.fillStyle = "#a93624";
    context.font = "800 28px -apple-system, BlinkMacSystemFont, sans-serif";
    context.fillText("大衍筮法", margin + 112, y + 28);
    context.fillStyle = "#17130f";
    context.font = "800 92px Songti TC, Noto Serif TC, serif";
    context.fillText("周易", margin + 112, y + 104);
    y += 160;

    context.fillStyle = "rgba(255, 252, 246, 0.9)";
    roundRect(context, margin, y, contentWidth, 210, 18);
    context.fill();
    context.strokeStyle = "rgba(23, 19, 15, 0.14)";
    context.stroke();
    context.fillStyle = "#4c443a";
    context.font = "400 34px Songti TC, Noto Serif TC, serif";
    y = drawWrappedText(context, reading.invocation, margin + 36, y + 64, contentWidth - 72, 48) + 18;
    context.fillStyle = "rgba(76, 68, 58, 0.76)";
    context.font = "500 24px -apple-system, BlinkMacSystemFont, sans-serif";
    context.fillText(`起卦時間：${reading.castTime}`, margin + 36, y + 38);
    y = margin + 160 + 210 + 32;

    const cardGap = 28;
    const cardWidth = (contentWidth - cardGap) / 2;
    drawHexagramCard(context, "本卦", reading.result.hData.name || "", reading.result.hLogical, reading.result.isChanging, true, margin, y, cardWidth);
    drawHexagramCard(context, "之卦", reading.result.gData.name || "", reading.result.gLogical, reading.result.isChanging, false, margin + cardWidth + cardGap, y, cardWidth);
    y += 392;

    context.fillStyle = "rgba(255, 252, 246, 0.9)";
    roundRect(context, margin, y, contentWidth, 120, 18);
    context.fill();
    context.strokeStyle = "rgba(23, 19, 15, 0.14)";
    context.stroke();
    context.fillStyle = "#a93624";
    context.font = "800 24px -apple-system, BlinkMacSystemFont, sans-serif";
    context.fillText("卦辭與爻辭", margin + 36, y + 44);
    context.fillStyle = "#17130f";
    context.font = "800 42px Songti TC, Noto Serif TC, serif";
    context.fillText(`${reading.result.changes} 變`, margin + 36, y + 92);
    y += 148;

    context.font = "400 32px Songti TC, Noto Serif TC, serif";
    reading.result.explanation.map(text => text.trim()).filter(Boolean).forEach(text => {
        const startY = y;
        context.fillStyle = "rgba(255, 252, 246, 0.9)";
        roundRect(context, margin, y, contentWidth, 150, 18);
        context.fill();
        context.strokeStyle = "rgba(23, 19, 15, 0.14)";
        context.stroke();

        context.fillStyle = "#4c443a";
        y = drawWrappedText(context, text, margin + 36, y + 52, contentWidth - 72, 46) + 22;
        if (y < startY + 150) {
            y = startY + 150;
        }
        y += 18;
    });

    context.fillStyle = "rgba(76, 68, 58, 0.78)";
    context.font = "700 24px -apple-system, BlinkMacSystemFont, sans-serif";
    context.textAlign = "center";
    context.fillText("本網站由 Yu-Hsiang Chang 開發", width / 2, y + 32);
    context.fillStyle = "#1f6f61";
    context.fillText("https://mibsteven.github.io", width / 2, y + 68);
    context.textAlign = "left";
    y += 104;

    const finalCanvas = document.createElement("canvas");
    finalCanvas.width = width;
    finalCanvas.height = Math.ceil(y + margin);
    finalCanvas.getContext("2d").drawImage(sourceCanvas, 0, 0);

    return new Promise(resolve => finalCanvas.toBlob(resolve, "image/png", 0.95));
}
async function saveReading() {
    if (!hasCast) {
        els.resultText.textContent = "請先起卦，再截圖。";
        return;
    }

    const originalText = els.btnShot.textContent;
    els.btnShot.disabled = true;
    els.btnShot.textContent = "產生中";

    try {
        const blob = await createScreenshotBlob();
        if (!blob) {
            throw new Error("Screenshot blob was empty.");
        }

        const url = URL.createObjectURL(blob);
        const anchor = document.createElement("a");
        anchor.href = url;
        anchor.download = `yijing-${new Date().toISOString().slice(0, 10)}.png`;
        document.body.appendChild(anchor);
        anchor.click();
        anchor.remove();
        URL.revokeObjectURL(url);
    } catch (error) {
        console.error(error);
        els.resultText.textContent = "截圖產生失敗，請改用瀏覽器截圖功能。";
    } finally {
        els.btnShot.disabled = false;
        els.btnShot.textContent = originalText;
    }
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
