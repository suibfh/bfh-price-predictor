function calculatePricePrediction() {
    const startDateStr = document.getElementById('startDate').value;
    const startPrice = parseFloat(document.getElementById('startPrice').value);
    const endPrice = parseFloat(document.getElementById('endPrice').value);
    const currentPrice = parseFloat(document.getElementById('currentPrice').value);
    const targetPrice = parseFloat(document.getElementById('targetPrice').value);

    const messageElement = document.getElementById('message');
    messageElement.textContent = ''; // Clear previous messages

    // --- 入力値の検証 ---
    if (!startDateStr || isNaN(startPrice) || isNaN(endPrice) || isNaN(currentPrice) || isNaN(targetPrice)) {
        messageElement.textContent = '全ての項目を正しく入力してください。';
        return;
    }

    if (startPrice < endPrice) {
        messageElement.textContent = '開始価格は終了価格以上である必要があります。';
        return;
    }

    if (currentPrice < targetPrice) {
        messageElement.textContent = '現在の価格が目標価格より低い場合、既に目標価格に到達しています。';
        document.getElementById('predictedEndTime').textContent = '—';
        document.getElementById('targetReachTime').textContent = '既に到達済み';
        return;
    }

    if (currentPrice > startPrice) {
        messageElement.textContent = '現在の価格が開始価格より高い値になっています。入力をご確認ください。';
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

    // --- 価格予測計算 ---
    const totalDurationMs = endDate.getTime() - startDate.getTime(); // 総取引期間（ミリ秒）
    const totalDurationHours = totalDurationMs / (1000 * 60 * 60); // 総取引期間（時間）

    const priceDropPerUnitTime = (startPrice - endPrice) / totalDurationHours; // 1時間あたりの価格下落幅

    // 価格下落がない場合（開始価格 == 終了価格）
    if (priceDropPerUnitTime === 0) {
        if (currentPrice === targetPrice) {
            document.getElementById('targetReachTime').textContent = '現在と同じ価格です';
        } else {
            document.getElementById('targetReachTime').textContent = '価格は変動しません。目標価格には到達しません。';
        }
        return;
    }

    // 目標価格までの下落に必要な時間
    const priceToDrop = currentPrice - targetPrice;
    const timeToReachTargetHours = priceToDrop / priceDropPerUnitTime;

    // 目標価格到達予測日時
    const currentTime = new Date();
    // 現在の価格時点がいつだったかの推定
    // currentPriceはユーザーが入力した「今」の価格なので、それを基準に未来を予測する
    // priceDropPerUnitTimeは過去から未来への均一な変化率なので、現在の価格から目標価格までにかかる時間を計算する
    const predictedTargetReachTime = new Date(currentTime.getTime() + (timeToReachTargetHours * 1000 * 60 * 60));

    // 目標価格到達日時が取引終了日時を超えていないかチェック
    if (predictedTargetReachTime.getTime() > endDate.getTime()) {
        document.getElementById('targetReachTime').textContent = '取引終了までに目標価格には到達しません。';
    } else {
        document.getElementById('targetReachTime').textContent = formatDate(predictedTargetReachTime);
    }
}

// 日付フォーマット関数
function formatDate(date) {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');

    return `${year}/${month}/${day} ${hours}:${minutes}`;
}
