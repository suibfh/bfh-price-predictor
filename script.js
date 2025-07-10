// 日付フォーマット関数 (共通)
function formatDate(date) {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');

    return `${year}/${month}/${day} ${hours}:${minutes}`;
}

// 日付入力フィールドと「現在の価格」の初期値を設定する関数
function setInitialValues() {
    const now = new Date();
    // datetime-local の形式に合わせる (YYYY-MM-DDTHH:MM)
    const year = now.getFullYear();
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const day = now.getDate().toString().padStart(2, '0');
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const dateTimeLocal = `${year}-${month}-${day}T${hours}:${minutes}`;

    document.getElementById('startDate').value = dateTimeLocal;
    document.getElementById('predictDateTime').value = dateTimeLocal;

    // 現在の価格を自動算出
    calculateCurrentPriceAuto();
}

// ページ読み込み時に初期値を設定
document.addEventListener('DOMContentLoaded', setInitialValues);

// 「取引開始日時」「開始価格」「終了価格」の変更時にも現在の価格を再計算
document.getElementById('startDate').addEventListener('change', calculateCurrentPriceAuto);
document.getElementById('startPrice').addEventListener('input', calculateCurrentPriceAuto);
document.getElementById('endPrice').addEventListener('input', calculateCurrentPriceAuto);


// 現在の価格を自動で計算して設定する関数
function calculateCurrentPriceAuto() {
    const startDateStr = document.getElementById('startDate').value;
    const startPrice = parseFloat(document.getElementById('startPrice').value);
    const endPrice = parseFloat(document.getElementById('endPrice').value);

    // 必須入力が揃っていない場合は計算しない
    if (!startDateStr || isNaN(startPrice) || isNaN(endPrice)) {
        document.getElementById('currentPriceTime').value = ''; // 値をクリア
        return;
    }

    const startDate = new Date(startDateStr);
    const now = new Date(); // 現在のシステム時刻
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 5); // 取引終了日時

    // 開始日時が不正、または現在時刻が開始日時より前、または終了日時より後の場合
    if (isNaN(startDate.getTime()) || now.getTime() < startDate.getTime() || now.getTime() > endDate.getTime()) {
        document.getElementById('currentPriceTime').value = ''; // 値をクリア
        // メッセージを表示することも可能だが、今回はシンプルにクリア
        return;
    }

    const totalDurationMs = endDate.getTime() - startDate.getTime(); // 総取引期間（ミリ秒）
    const totalDurationHours = totalDurationMs / (1000 * 60 * 60); // 総取引期間（時間）

    // 価格下落がない場合
    if (totalDurationHours === 0 || startPrice === endPrice) {
        document.getElementById('currentPriceTime').value = startPrice.toFixed(0);
        return;
    }

    const priceDropPerUnitTime = (startPrice - endPrice) / totalDurationHours; // 1時間あたりの価格下落幅

    // 開始日時から現在時刻までの経過時間
    const timeElapsedMs = now.getTime() - startDate.getTime();
    const timeElapsedHours = timeElapsedMs / (1000 * 60 * 60);

    // 現在時刻での予測価格
    let calculatedCurrentPrice = startPrice - (timeElapsedHours * priceDropPerUnitTime);

    // 価格が終了価格を下回らないように調整
    if (calculatedCurrentPrice < endPrice) {
        calculatedCurrentPrice = endPrice;
    }

    document.getElementById('currentPriceTime').value = calculatedCurrentPrice.toFixed(0);
}


// 価格から時間を予測する機能 (既存)
function calculateTimeToPrice() {
    // 共通の入力値は各セクションから取得する
    const startDateStr = document.getElementById('startDate').value;
    const startPrice = parseFloat(document.getElementById('startPrice').value);
    const endPrice = parseFloat(document.getElementById('endPrice').value);

    // このセクション独自の入力値
    const currentPrice = parseFloat(document.getElementById('currentPriceTime').value); // 自動算出された値を使用
    const targetPrice = parseFloat(document.getElementById('targetPriceTime').value);

    const messageElement = document.getElementById('messageTime');
    messageElement.textContent = ''; // Clear previous messages
    document.getElementById('predictedEndTime').textContent = '';
    document.getElementById('targetReachTime').textContent = '';

    // --- 全ての入力値の検証 ---
    if (!startDateStr || isNaN(startPrice) || isNaN(endPrice) || isNaN(currentPrice) || isNaN(targetPrice)) {
        messageElement.textContent = '「価格から時間を予測」と「基本情報」の全ての項目を正しく入力してください。';
        return;
    }

    if (startPrice < endPrice) {
        messageElement.textContent = '開始価格は終了価格以上である必要があります。';
        return;
    }

    // --- 日時計算 ---
    const startDate = new Date(startDateStr);
    if (isNaN(startDate.getTime())) {
        messageElement.textContent = '有効な取引開始日時を入力してください。';
        return;
    }

    // 取引終了日時は開始日時から5日後
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 5);
    document.getElementById('predictedEndTime').textContent = formatDate(endDate);

    // --- 個別の検証 ---
    if (currentPrice < targetPrice) {
        messageElement.textContent = '現在の価格が目標価格より低い場合、既に目標価格に到達しています。';
        document.getElementById('targetReachTime').textContent = '既に到達済み';
        return;
    }

    if (currentPrice > startPrice) {
        messageElement.textContent = '現在の価格が開始価格より高い値になっています。入力をご確認ください。';
        return;
    }

    // --- 価格予測計算 ---
    const totalDurationMs = endDate.getTime() - startDate.getTime(); // 総取引期間（ミリ秒）
    const totalDurationHours = totalDurationMs / (1000 * 60 * 60); // 総取引期間（時間）

    const priceDropPerUnitTime = (startPrice - endPrice) / totalDurationHours; // 1時間あたりの価格下落幅

    // 価格下落がない場合（開始価格 == 終了価格）
    if (priceDropPerUnitTime === 0) {
        if (currentPrice === targetPrice) {
            document.getElementById('targetReachTime').textContent = '現在と同じ価格です';
        } else {
            messageElement.textContent = '価格は変動しません。目標価格には到達しません。';
        }
        return;
    }

    // 目標価格までの下落に必要な時間
    const priceToDrop = currentPrice - targetPrice;
    const timeToReachTargetHours = priceToDrop / priceDropPerUnitTime;

    // 目標価格到達予測日時 (現在のツール起動時刻を基準にする)
    const predictedTargetReachTime = new Date(new Date().getTime() + (timeToReachTargetHours * 1000 * 60 * 60));

    // 目標価格到達日時が取引終了日時を超えていないかチェック
    if (predictedTargetReachTime.getTime() > endDate.getTime()) {
        document.getElementById('targetReachTime').textContent = '取引終了までに目標価格には到達しません。';
    } else if (predictedTargetReachTime.getTime() < new Date().getTime()) {
         // 目標価格到達日時が現在時刻より過去の場合（既に到達済みのケースも含む）
        document.getElementById('targetReachTime').textContent = '既に到達済み';
    }
    else {
        document.getElementById('targetReachTime').textContent = formatDate(predictedTargetReachTime);
    }
}

// 時間を指定して価格を予測する機能 (既存)
function calculatePriceAtTime() {
    // 共通の入力値は各セクションから取得する
    const startDateStr = document.getElementById('startDate').value;
    const startPrice = parseFloat(document.getElementById('startPrice').value);
    const endPrice = parseFloat(document.getElementById('endPrice').value);
    
    // このセクション独自の入力値
    const predictDateTimeStr = document.getElementById('predictDateTime').value;

    const messageElement = document.getElementById('messagePrice');
    messageElement.textContent = ''; // Clear previous messages
    document.getElementById('predictedPriceAtTime').textContent = '';

    // --- 全ての入力値の検証 ---
    if (!startDateStr || isNaN(startPrice) || isNaN(endPrice) || !predictDateTimeStr) {
        messageElement.textContent = '「時間を指定して価格を予測」と「基本情報」の全ての項目を正しく入力してください。';
        return;
    }

    if (startPrice < endPrice) {
        messageElement.textContent = '開始価格は終了価格以上である必要があります。';
        return;
    }

    // --- 日時計算 ---
    const startDate = new Date(startDateStr);
    const predictDateTime = new Date(predictDateTimeStr);

    if (isNaN(startDate.getTime()) || isNaN(predictDateTime.getTime())) {
        messageElement.textContent = '有効な日時を入力してください。';
        return;
    }

    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 5);

    // --- 個別の検証 ---
    if (predictDateTime.getTime() < startDate.getTime()) {
        messageElement.textContent = '予測したい日時は取引開始日時以降にしてください。';
        return;
    }
    if (predictDateTime.getTime() > endDate.getTime()) {
        messageElement.textContent = '予測したい日時は取引終了日時を超えています。取引終了時の価格を予測します。';
        document.getElementById('predictedPriceAtTime').textContent = `${endPrice.toFixed(0)} BPC`; // 終了価格を表示
        return;
    }

    // --- 価格予測計算 ---
    const totalDurationMs = endDate.getTime() - startDate.getTime(); // 総取引期間（ミリ秒）
    const totalDurationHours = totalDurationMs / (1000 * 60 * 60); // 総取引期間（時間）

    const priceDropPerUnitTime = (startPrice - endPrice) / totalDurationHours; // 1時間あたりの価格下落幅

    // 価格下落がない場合
    if (priceDropPerUnitTime === 0) {
        document.getElementById('predictedPriceAtTime').textContent = `${startPrice.toFixed(0)} BPC`;
        return;
    }

    // 開始日時から予測日時までの経過時間
    const timeElapsedMs = predictDateTime.getTime() - startDate.getTime();
    const timeElapsedHours = timeElapsedMs / (1000 * 60 * 60);

    // 予測日時での価格
    const predictedPrice = startPrice - (timeElapsedHours * priceDropPerUnitTime);

    document.getElementById('predictedPriceAtTime').textContent = `${predictedPrice.toFixed(0)} BPC`;
}
