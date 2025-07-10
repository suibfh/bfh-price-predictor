// 日付フォーマット関数 (共通)
function formatDate(date) {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');

    return `${year}/${month}/${day} ${hours}:${minutes}`;
}

// 価格から時間を予測する機能
function calculateTimeToPrice() {
    const startDateStr = document.getElementById('startDate').value;
    const startPrice = parseFloat(document.getElementById('startPrice').value);
    const endPrice = parseFloat(document.getElementById('endPrice').value);
    const currentPrice = parseFloat(document.getElementById('currentPriceTime').value); // ID変更
    const targetPrice = parseFloat(document.getElementById('targetPriceTime').value); // ID変更

    const messageElement = document.getElementById('messageTime'); // ID変更
    messageElement.textContent = ''; // Clear previous messages
    document.getElementById('predictedEndTime').textContent = '';
    document.getElementById('targetReachTime').textContent = '';

    // --- 共通入力値の検証 ---
    if (!startDateStr || isNaN(startPrice) || isNaN(endPrice) || isNaN(currentPrice) || isNaN(targetPrice)) {
        messageElement.textContent = '「価格から時間を予測」の全ての項目を正しく入力してください。';
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

    // 目標価格到達予測日時 (現在時刻を基準にする)
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

// 時間を指定して価格を予測する機能
function calculatePriceAtTime() {
    const startDateStr = document.getElementById('startDate').value;
    const startPrice = parseFloat(document.getElementById('startPrice').value);
    const endPrice = parseFloat(document.getElementById('endPrice').value);
    const predictDateTimeStr = document.getElementById('predictDateTime').value;

    const messageElement = document.getElementById('messagePrice'); // ID変更
    messageElement.textContent = ''; // Clear previous messages
    document.getElementById('predictedPriceAtTime').textContent = '';

    // --- 共通入力値の検証 ---
    if (!startDateStr || isNaN(startPrice) || isNaN(endPrice) || !predictDateTimeStr) {
        messageElement.textContent = '「時間を指定して価格を予測」の全ての項目（取引開始日時、開始価格、終了価格、予測したい日時）を正しく入力してください。';
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

    // 価格はBPCなので小数点以下を丸める（または切り捨てる、ゲーム仕様による）
    // 今回は小数点以下なしと仮定してtoFixed(0)を使用
    document.getElementById('predictedPriceAtTime').textContent = `${predictedPrice.toFixed(0)} BPC`;
}
