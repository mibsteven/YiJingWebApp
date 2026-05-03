function calculateYao() {
    function randomInt(maxExclusive) {
        if (window.crypto && window.crypto.getRandomValues) {
            const values = new Uint32Array(1);
            const limit = Math.floor(0x100000000 / maxExclusive) * maxExclusive;
            let value;

            do {
                window.crypto.getRandomValues(values);
                value = values[0];
            } while (value >= limit);

            return value % maxExclusive;
        }

        return Math.floor(Math.random() * maxExclusive);
    }

    function oneOperation(sticks) {
        const left = randomInt(sticks - 1) + 1;
        const right = sticks - left;
        let rL = (left - 1) % 4;
        let rR = right % 4;

        if (rL === 0) {
            rL = 4;
        }

        if (rR === 0) {
            rR = 4;
        }

        return 1 + rL + rR;
    }

    let total = 49;
    for (let i = 0; i < 3; i++) {
        total -= oneOperation(total);
    }

    return Math.floor(total / 4);
}

function castSixLines() {
    const six = [];
    for (let i = 0; i < 6; i++) {
        six.push(calculateYao());
    }
    return six;
}

function toLogicalAndImages(six) {
    const hLogical = Array(6);
    const gLogical = Array(6);
    const isChanging = Array(6).fill(false);

    for (let i = 0; i < 6; i++) {
        const value = six[i];
        switch (value) {
        case 6:
            hLogical[i] = "yin";
            gLogical[i] = "yang";
            isChanging[i] = true;
            break;
        case 7:
            hLogical[i] = "yang";
            gLogical[i] = "yang";
            break;
        case 8:
            hLogical[i] = "yin";
            gLogical[i] = "yin";
            break;
        case 9:
            hLogical[i] = "yang";
            gLogical[i] = "yin";
            isChanging[i] = true;
            break;
        default:
            hLogical[i] = "yin";
            gLogical[i] = "yin";
        }
    }

    return { hLogical, gLogical, isChanging };
}

function keyFromLogical(logical) {
    return logical.join(" ");
}

function composeReading({ changes, hData, gData, isChanging, guaDictionary, hKey }) {
    const parts = [];

    switch (changes) {
    case 0:
        parts.push(`本卦：${hData.guaExplanation || ""}`);
        break;
    case 1:
    case 2:
        for (let i = 0; i < 6; i++) {
            if (isChanging[i]) {
                const yao = (hData.yaoExplanations && hData.yaoExplanations[i]) || "";
                parts.push(`本卦 ${yao}`);
            }
        }
        break;
    case 3:
        parts.push(`本卦：${hData.guaExplanation || ""}`);
        parts.push(`之卦：${gData.guaExplanation || ""}`);
        break;
    case 4: {
        const unchanging = [];
        for (let i = 0; i < 6; i++) {
            if (!isChanging[i]) {
                unchanging.push(i);
            }
        }

        if (unchanging.length === 2) {
            const [iLower, iUpper] = unchanging.slice().sort((a, b) => a - b);
            const y1 = (gData.yaoExplanations && gData.yaoExplanations[iLower]) || "";
            const y2 = (gData.yaoExplanations && gData.yaoExplanations[iUpper]) || "";
            parts.push(`之卦 ${y1}`);
            parts.push(`之卦 ${y2}`);
        } else {
            parts.push(`之卦：${gData.guaExplanation || ""}`);
        }
        break;
    }
    case 5: {
        const idx = isChanging.findIndex(value => !value);
        if (idx >= 0) {
            const yao = (gData.yaoExplanations && gData.yaoExplanations[idx]) || "";
            parts.push(`之卦 ${yao}`);
        } else {
            parts.push(`之卦：${gData.guaExplanation || ""}`);
        }
        break;
    }
    case 6: {
        parts.push(`之卦：${gData.guaExplanation || ""}`);
        const qian = guaDictionary["yang yang yang yang yang yang"];
        const kun = guaDictionary["yin yin yin yin yin yin"];

        if (qian && hKey === "yang yang yang yang yang yang") {
            parts.push(`乾卦用九 ${qian.guaExplanation || ""}`);
        }

        if (kun && hKey === "yin yin yin yin yin yin") {
            parts.push(`坤卦用六 ${kun.guaExplanation || ""}`);
        }
        break;
    }
    default:
        parts.push(`${changes} 變：本卦/之卦參看爻辭與卦辭。`);
    }

    return parts;
}

function createReadingResult(dictionary, sixLines) {
    const { hLogical, gLogical, isChanging } = toLogicalAndImages(sixLines);
    const hKey = keyFromLogical(hLogical);
    const gKey = keyFromLogical(gLogical);
    const hData = dictionary[hKey] || dictionary.example || { name: "（未建資料）", guaExplanation: "" };
    const gData = dictionary[gKey] || dictionary.example2 || { name: "（未建資料）", guaExplanation: "" };
    const changes = isChanging.filter(Boolean).length;
    const explanation = composeReading({
        changes,
        hData,
        gData,
        isChanging,
        guaDictionary: dictionary,
        hKey
    });

    return {
        hData,
        gData,
        hLogical,
        gLogical,
        isChanging,
        changes,
        explanation
    };
}

window.YiJingCore = {
    calculateYao,
    castSixLines,
    toLogicalAndImages,
    keyFromLogical,
    composeReading,
    createReadingResult
};
