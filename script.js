function debugLog(...args) {
    const debugEnabled = document.getElementById('debugSwitch')?.checked;
    if (debugEnabled) {
        console.log('[DEBUG]', ...args);
    }
}

function saveSettings() {
    const settings = {
        diceCount: document.getElementById('diceCount').value,
        repeatCount: document.getElementById('repeatCount').value,
        soundSwitch: document.getElementById('soundSwitch').checked,
        vibrationSwitch: document.getElementById('vibrationSwitch').checked,
        showNumberSwitch: document.getElementById('showNumberSwitch').checked,
        shakeSwitch: document.getElementById('shakeSwitch').checked,
        historySwitch: document.getElementById('historySwitch').checked,
        debugSwitch: document.getElementById('debugSwitch')?.checked,
        diceSize: document.getElementById('diceSize').value
    };
    localStorage.setItem('diceSettings', JSON.stringify(settings));
    debugLog('Settings saved:', settings);
}

function loadSettings() {
    const savedSettings = localStorage.getItem('diceSettings');
    if (savedSettings) {
        const settings = JSON.parse(savedSettings);
        document.getElementById('diceCount').value = settings.diceCount || 2;
        document.getElementById('repeatCount').value = settings.repeatCount || 1;
        document.getElementById('soundSwitch').checked = settings.soundSwitch !== false; // 默认为true
        document.getElementById('vibrationSwitch').checked = settings.vibrationSwitch !== false; // 默认为true
        document.getElementById('showNumberSwitch').checked = settings.showNumberSwitch || false;
        document.getElementById('shakeSwitch').checked = settings.shakeSwitch !== false; // 默认为true
        document.getElementById('historySwitch').checked = settings.historySwitch !== false; // 默认为true
        if (document.getElementById('debugSwitch') && settings.debugSwitch !== undefined) {
            document.getElementById('debugSwitch').checked = settings.debugSwitch;
            document.getElementById('debugSwitchWrapper').style.display = settings.debugSwitch ? 'flex' : 'none';
        }

        const diceSize = settings.diceSize || 200;
        document.getElementById('diceSize').value = diceSize;
        document.getElementById('diceSizeValue').textContent = diceSize;
        updateSlider(diceSize);
        updateDiceSize(diceSize);
        debugLog('Settings loaded:', settings);
    }
}

let historyRecords = [];

const soundUrl = 'https://cdn.pixabay.com/download/audio/2023/03/14/audio_7763cd5c8a.mp3?filename=dice-142528.mp3';
let diceSound = null;

function preloadSound() {
    debugLog("preloadSound");
    if (!diceSound) {
        // 检查是否支持 CacheStorage
        if ('caches' in window) {
            caches.open('dice-sounds').then(cache => {
                cache.match(soundUrl).then(response => {
                    if (response) {
                        // 音频文件已在缓存中
                        debugLog("Sound loaded from cache");
                        response.blob().then(blob => {
                            diceSound = new Audio(URL.createObjectURL(blob));
                        });
                    } else {
                        // 音频文件不在缓存中，需要缓存
                        debugLog("Sound not in cache, caching now");
                        fetch(soundUrl).then(response => {
                            cache.put(soundUrl, response.clone());
                            response.blob().then(blob => {
                                debugLog("Sound cached");
                                diceSound = new Audio(URL.createObjectURL(blob));
                            });
                        }).catch(err => {
                            debugLog("Failed to fetch and cache sound", err);
                            // 如果缓存失败，直接创建音频对象
                            diceSound = new Audio(soundUrl);
                        });
                    }
                }).catch(err => {
                    debugLog("Cache match error", err);
                    // 如果缓存检查失败，直接创建音频对象
                    diceSound = new Audio(soundUrl);
                });
            }).catch(err => {
                debugLog("Failed to open cache", err);
                // 如果无法打开缓存，直接创建音频对象
                diceSound = new Audio(soundUrl);
            });
        } else {
            // 浏览器不支持 CacheStorage，使用传统方式
            diceSound = new Audio(soundUrl);
            diceSound.load();
        }
    }
}

function toggleFullScreen() {
    if (!document.fullscreenElement && !document.webkitFullscreenElement && !document.mozFullScreenElement) {
        if (document.documentElement.requestFullscreen) {
            document.documentElement.requestFullscreen();
        } else if (document.documentElement.webkitRequestFullscreen) {
            document.documentElement.webkitRequestFullscreen();
            } else if (document.documentElement.mozRequestFullScreen) {
            document.documentElement.mozRequestFullScreen();
        }
    } else {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        } else if (document.webkitExitFullscreen) {
            document.webkitExitFullscreen();
        } else if (document.mozCancelFullScreen) {
            document.mozCancelFullScreen();
        }
    }
}

function handleFullScreenChange() {
    const enterIcon = document.getElementById('enterFullscreen');
    const exitIcon = document.getElementById('exitFullscreen');
    const mainTitle = document.getElementById('mainTitle');
    const history = document.getElementById('history');
    const rollButton = document.getElementById('rollButton');
    const mainMenu = document.getElementById('mainMenu');
    debugLog('handleFullScreenChange: '+document.fullscreenElement);
    if (document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement) {
        // 已进入全屏模式
        enterIcon.style.display = 'none';
        exitIcon.style.display = 'block';
        mainTitle.style.display = 'none';
        history.style.display = 'none';
        rollButton.style.display = 'none';
        mainMenu.style.display = 'none';
    } else {
        // 已退出全屏模式
        enterIcon.style.display = 'block';
        exitIcon.style.display = 'none';
        mainTitle.style.display = 'block';
        history.style.display = 'block';
        rollButton.style.display = 'block';
        mainMenu.style.display = 'block';
    }
}

// 监听全屏状态变化
document.addEventListener('fullscreenchange', handleFullScreenChange);
document.addEventListener('webkitfullscreenchange', handleFullScreenChange);
document.addEventListener('mozfullscreenchange', handleFullScreenChange);
document.addEventListener('MSFullscreenChange', handleFullScreenChange);

// 添加键盘事件监听器，处理F11按键
document.addEventListener('keydown', function(event) {
    // 检测是否按下了F11键
    if (event.key === 'F11') {
        // 注意：由于浏览器安全限制，我们无法阻止F11默认行为
        // 但我们可以在下一个事件循环中检查全屏状态并更新图标
        setTimeout(handleFullScreenChange, 100);
    }
});

function initFullscreenFeature() { 
    // 检查是否支持全屏API，如果不支持则隐藏全屏按钮
    const fullscreenBtn = document.getElementById('fullscreenBtn');
    if (!document.documentElement.requestFullscreen && 
        !document.documentElement.webkitRequestFullscreen && 
        !document.documentElement.mozRequestFullScreen) {
        fullscreenBtn.style.display = 'none';
    }
}

function initVibrateFeature() {
    // 检查是否支持振动API，如果不支持则隐藏振动开关
    const vibrationSwitchWrapper = document.getElementById('vibrationSwitch').closest('.switch-wrapper');
    if (!('vibrate' in navigator)) {
        debugLog('Vibration API not supported');
        vibrationSwitchWrapper.style.display = 'none';
        // 默认关闭振动功能
        document.getElementById('vibrationSwitch').checked = false;
    }
}

function createDice() {
    const dice = document.createElement('div');
    dice.className = 'dice';
    
    const diceSize = document.getElementById('diceSize').value || 200;
    dice.style.setProperty('--dice-size', diceSize + 'px');
    
    const showNumbers = document.getElementById('showNumberSwitch').checked;
    
    for (let i = 1; i <= 6; i++) {
        const face = document.createElement('div');
        face.className = `face face-${i}`;
        
        if (showNumbers) {
            face.textContent = i;
        } else {
            // 创建骰子点数
            createDots(face, i);
        }
        
        dice.appendChild(face);
    }
    
    return dice;
}

// 创建点数的辅助函数
function createDots(face, value) {
    const positions = getDotPositions(value);
    positions.forEach(pos => {
        const dot = document.createElement('div');
        dot.className = 'dot';
        dot.style.top = pos.top;
        dot.style.left = pos.left;
        dot.style.transform = 'translate(-50%, -50%)';
        face.appendChild(dot);
    });
}

// 获取点数位置的辅助函数
function getDotPositions(value) {
    const positions = {
        1: [{top: '50%', left: '50%'}],
        2: [
            {top: '25%', left: '25%'},
            {top: '75%', left: '75%'}
        ],
        3: [
            {top: '25%', left: '25%'},
            {top: '50%', left: '50%'},
            {top: '75%', left: '75%'}
        ],
        4: [
            {top: '25%', left: '25%'},
            {top: '25%', left: '75%'},
            {top: '75%', left: '25%'},
            {top: '75%', left: '75%'}
        ],
        5: [
            {top: '25%', left: '25%'},
            {top: '25%', left: '75%'},
            {top: '50%', left: '50%'},
            {top: '75%', left: '25%'},
            {top: '75%', left: '75%'}
        ],
        6: [
            {top: '25%', left: '20%'},
            {top: '25%', left: '50%'},
            {top: '25%', left: '80%'},
            {top: '75%', left: '20%'},
            {top: '75%', left: '50%'},
            {top: '75%', left: '80%'}
        ]
    };
    return positions[value] || [];
}

function initDices() {
    const diceContainer = document.getElementById('diceContainer');
    diceContainer.innerHTML = '';
    const diceCount = parseInt(document.getElementById('diceCount').value);

    for(let i = 0; i < diceCount; i++) {
        const dice = createDice();
        dice.style.transform = 'rotateX(90deg) rotateY(0deg)'; // 6
        diceContainer.appendChild(dice);
    }
}

let currentRollTimeout = null;
let isContinuousRolling = false;

function rollDice() {
    debugLog("rollDice");
    const diceContainer = document.getElementById('diceContainer');
    const totalElement = document.getElementById('total');
    
    if (isContinuousRolling) {
        clearTimeout(currentRollTimeout);
        isContinuousRolling = false;
        updateRollButtonText(isContinuousRolling);
        return;
    }
    
    diceContainer.innerHTML = '';
    
    let currentRepeat = 0;
    const repeatCount = parseInt(document.getElementById('repeatCount').value);
    
    if(repeatCount >1 ) {
        isContinuousRolling = true;
        updateRollButtonText(isContinuousRolling);
    }

    function mayPlaySound(){
        const soundEnabled = document.getElementById('soundSwitch').checked;
        if (soundEnabled) {
            if (diceSound) {
                debugLog("Using diceSound"); 
            } else {
                debugLog("Creating new sound");
                diceSound = new Audio(soundUrl);
            }
            debugLog("Playing sound");
            diceSound.play().catch(err => {
                debugLog("Sound play error", err);
            });
        }
    }

    function mayVibrate(){                                
        const vibrationEnabled = document.getElementById('vibrationSwitch').checked;
        if (vibrationEnabled && 'vibrate' in navigator) {
            const pattern = [];
            let delay = 30;
            for (let i = 0; i < 5; i++) { // 5 段震动
                pattern.push(50 + Math.random() * 30); // 震动时长
                pattern.push(delay);                   // 停顿
                delay += Math.random() * 40;           // 停顿逐渐变长
            }
            navigator.vibrate(pattern);
        }
    }

    function performRoll() {
        debugLog("进入performRoll函数，当前重复次数:", currentRepeat + 1);
        const diceCount = parseInt(document.getElementById('diceCount').value);
        // 创建行容器
        const rowContainer = document.createElement('div');
        rowContainer.setAttribute('dice-row', ''); 
        rowContainer.style.display = 'flex';
        rowContainer.style.flexWrap = 'wrap';
        rowContainer.style.justifyContent = 'center';
        rowContainer.style.margin = "0 15px 30px 15px"
        diceContainer.appendChild(rowContainer);

        let total = 0;
        const results = [];
        const rollDelay = 100;

        mayPlaySound();
        mayVibrate();

        for (let i = 0; i < diceCount; i++) {
            const dice = createDice();
            const result = Math.floor(Math.random() * 6) + 1;
            
            const rotations = {
                1: {x: 0, y: 0},
                2: {x: 0, y: 180},
                3: {x: 0, y: -90},
                4: {x: 0, y: 90},
                5: {x: -90, y: 0},
                6: {x: 90, y: 0}
            };
            
            const randomMultiplier = 5 + Math.random() * 5;
            const initialXRot = rotations[result].x + Math.floor(Math.random() * 360) * randomMultiplier;
            const initialYRot = rotations[result].y + Math.floor(Math.random() * 360) * randomMultiplier;
            const initialZRot = Math.floor(Math.random() * 360) * randomMultiplier;
            dice.style.transform = `rotateX(${initialXRot}deg) rotateY(${initialYRot}deg) rotateZ(${initialZRot}deg)`;
            dice.style.transition = 'transform 1.5s cubic-bezier(0.2, 0.6, 0.1, 1)';
            
            setTimeout(() => {
                const finalX = rotations[result].x;
                const finalY = rotations[result].y;
                dice.style.transform = `rotateX(${finalX}deg) rotateY(${finalY}deg)`;
            }, rollDelay);
            
            rowContainer.appendChild(dice);
            results.push(result);
            total += result;
            
            if (i === diceCount - 1) {
                currentRollTimeout = setTimeout(() => {
                    totalElement.textContent = total;
                    
                    const historyEnabled = document.getElementById('historySwitch').checked;
                    if (historyEnabled) {
                        const record = {
                            time: new Date().toLocaleTimeString(),
                            diceCount: diceCount,
                            results: results,
                            total: total
                        };
                        historyRecords.push(record);
                        updateHistoryDisplay();
                    }
                    
                    currentRepeat++;
                    
                    if (currentRepeat < repeatCount && isContinuousRolling) {
                        currentRollTimeout = setTimeout(performRoll, 1000);
                    } else {
                        // 连续投掷结束
                        isContinuousRolling = false;
                        updateRollButtonText(isContinuousRolling);
                    }
                }, 1500);
            }
        }
    }
    
    performRoll();
}

function updateDiceSize(size) {
    const diceElements = document.querySelectorAll('.dice');
    diceElements.forEach(dice => {
        dice.style.setProperty('--dice-size', size + 'px');
    });
}

function updateSlider(value) {
    const diceSizeSlider = document.getElementById('diceSize');
    const diceSizeFloating = document.getElementById('diceSizeFloating');
    const floatingValue = document.getElementById('floatingSliderValue');
    const diceSizeWrapper = document.querySelector('.dice-size-wrapper');

    const diceSizeFloatingRect = diceSizeFloating.getBoundingClientRect();
    
    const min = diceSizeSlider.min || 0;
    const max = diceSizeSlider.max || 100;
    const percent = ((value - min) / (max - min)) * 100;

    // 应用渐变：红色为已滑过，灰色为未滑过
    diceSizeSlider.style.background = `linear-gradient(to right, #4CAF50 0%, #4CAF50 ${percent}%, #ccc ${percent}%, #ccc 100%)`;
    diceSizeFloating.style.background = `linear-gradient(to right, #4CAF50 0%, #4CAF50 ${percent}%, #ccc ${percent}%, #ccc 100%)`;

    // 设置浮动数值显示的位置和内容
    const sliderWidth = diceSizeFloatingRect.width;
    const thumbWidth = 20; // 与CSS中 thumb 宽度保持一致
    const x = diceSizeFloatingRect.left + (sliderWidth - thumbWidth) * percent / 100 + thumbWidth / 2;
    floatingValue.style.left = x + 'px';
    floatingValue.style.top = (diceSizeFloatingRect.top - 30) + 'px';
    floatingValue.textContent = diceSizeSlider.value + '%';
}

function initDiceSizeControl() { 
    document.getElementById('diceSize').addEventListener('input', function(e) {
        const size = e.target.value;
        document.getElementById('diceSizeValue').textContent = size;
        updateDiceSize(size);
    });
    document.getElementById('diceSizeValue').addEventListener('blur', function(e) {
        let value = parseInt(e.target.textContent) || 200;
        value = Math.max(50, Math.min(300, value));
        e.target.textContent = value;
        document.getElementById('diceSize').value = value;
        updateSlider(value);
        updateDiceSize(value);
        saveSettings();
    });
    document.getElementById('diceSizeValue').addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            e.target.blur();
        }
    });

    const diceSizeSlider = document.getElementById('diceSize');
    const diceSizeFloating = document.getElementById('diceSizeFloating');
    const menuContainer = document.getElementById('menuContainer');
    const diceSizeWrapper = document.querySelector('.dice-size-wrapper');
    const floatingValue = document.getElementById('floatingSliderValue');
    
    // 同步两个滑块的值
    diceSizeSlider.addEventListener('input', function() {
        diceSizeFloating.value = this.value;
        document.getElementById('diceSizeValue').textContent = this.value;
        updateSlider(diceSizeFloating.value);
    });
    
    diceSizeFloating.addEventListener('input', function() {
        diceSizeSlider.value = this.value;
        document.getElementById('diceSizeValue').textContent = this.value;
        updateDiceSize(this.value);
        updateSlider(diceSizeFloating.value);
    });
    
    let isSliderDragging = false;
    const opacity = 0;
    
    diceSizeSlider.addEventListener('mousedown', function(e) {
        isSliderDragging = true;
        showFloatingSlider(e);
        menuContainer.style.opacity = opacity;
    });
    
    diceSizeSlider.addEventListener('touchstart', function(e) {
        isSliderDragging = true;
        showFloatingSlider(e.touches[0]);
        menuContainer.style.opacity = opacity;
    });
    
    function showFloatingSlider(e) {
        // 获取滑块在页面中的位置
        const rect = diceSizeSlider.getBoundingClientRect();
        const wrapperRect = diceSizeWrapper.getBoundingClientRect();
        
        // 设置浮动滑块的位置
        diceSizeFloating.style.left = wrapperRect.left + 'px';
        diceSizeFloating.style.top = wrapperRect.top + 'px';
        diceSizeFloating.style.display = 'block';
        
        floatingValue.style.display = 'block';
        
        // 同步值
        diceSizeFloating.value = diceSizeSlider.value;
        updateSlider(diceSizeFloating.value);
    }
    
    function hideFloatingSlider() {
        diceSizeFloating.style.display = 'none';
        floatingValue.style.display = 'none';
    }
    
    document.addEventListener('mousemove', function(e) {
        if (isSliderDragging) {
            updateDiceSize(diceSizeFloating.value);
        }
    });
    
    document.addEventListener('mouseup', function() {
        if (isSliderDragging) {
            isSliderDragging = false;
            hideFloatingSlider();
            menuContainer.style.opacity = '1';
        }
    });
    
    document.addEventListener('touchmove', function(e) {
        if (isSliderDragging) {
            updateDiceSize(diceSizeFloating.value);
        }
    });
    
    document.addEventListener('touchend', function() {
        if (isSliderDragging) {
            isSliderDragging = false;
            hideFloatingSlider();
            menuContainer.style.opacity = '1';
        }
    });
}

function initSettingsControl() { 
    document.getElementById('menuContainer').addEventListener('change', function(e) {
        debugLog("setting change: " + e.target.id);
        if(e.target.id === 'diceCount' || e.target.id === 'showNumberSwitch') {
            redrawDice();
        }
        if(e.target.id === 'repeatCount') {
            updateRollButtonText(isContinuousRolling);
        }
        if(e.target.id === 'shakeSwitch') {
            // handle in initShakeFeature
            return
        }
        if(e.target.id === 'debugSwitch') {
            debugSwitchWrapper.style.display = this.checked ? 'flex' : 'none';
        }
        saveSettings();
    });
}

function updateHistoryDisplay() {
    const historyList = document.getElementById('historyList');
    const historyContainer = document.getElementById('history');
    const historyIcon = document.querySelector('.history-icon');
    const clearBtn = document.querySelector('.clear-history');
    const historyCount = document.getElementById('historyCount');
    const historyRightGroup = document.querySelector('.history-right-group');
    historyList.innerHTML = '';
    
    if(historyRecords.length === 0) {
        historyContainer.classList.remove('visible', 'visible-more','expanded');
        historyIcon.classList.remove('prompt');
        historyIcon.style.display = 'none';
        clearBtn.style.display = 'none';
        historyCount.style.display = 'none';
        historyRightGroup.style.display = 'none';
        return;
    }

    const history = document.getElementById('history');
    if(historyRecords.length > 1) {
        history.classList.add('visible-more');
        history.classList.remove('visible');
    }else{
        history.classList.add('visible');
        history.classList.remove('visible-more');
    }

    historyIcon.style.display = 'block';
    historyIcon.classList.add('prompt');
    clearBtn.style.display = 'inline-block';
    historyCount.style.display = 'inline-block';
    historyRightGroup.style.display = 'inline-block';
    historyCount.textContent = `${historyRecords.length}次`;
    const displayLimit = 100;
    const recordsToShow = historyRecords.slice(-displayLimit); // 负值代表从数组尾部开始截取
    
    recordsToShow.forEach((record, index) => {
        const recordElement = document.createElement('div');
        recordElement.className = 'history-item';
        if (index === recordsToShow.length - 1) {
            recordElement.classList.add('insert-animation');
        }

        const actualIndex = historyRecords.length - recordsToShow.length + index + 1;
        recordElement.innerHTML = `
            <div style="display:flex; justify-content:space-between">
                <span><strong>${actualIndex}. 点数：<span style="color:#4CAF50">${record.total}</span></strong></span>
                <span style="color:#666">${record.time}</span>
            </div>
            <div style="font-size:0.9em; color:#666">
                ${record.diceCount}个骰子: ${record.results.join(', ')}
            </div>
        `;
        historyList.insertBefore(recordElement, historyList.firstChild);
    });
    if(historyRecords.length > displayLimit) {
        const infoElement = document.createElement('div');
        infoElement.className = 'history-info';
        infoElement.textContent = `仅显示最近 ${displayLimit} 条记录，共 ${historyRecords.length} 条`;
        historyList.appendChild(infoElement);
    }
}

function toggleHistory(e) {
    if (e && e.type === 'click') {
        if (isHistoryDragging) return;
    }
    debugLog('toggleHistory');
    if(e) e.stopPropagation();
    const historyContainer = document.getElementById('history');
    const historyIcon = document.querySelector('.history-icon');
    
    if(historyRecords.length > 0) {
        debugLog('toggleHistory: has history');
        historyContainer.classList.toggle('expanded');
        historyIcon.classList.toggle('up');
        historyIcon.classList.remove('prompt');
    }
}

let isHistoryDragging = false;

function initHistoryDragFeature() {
    const historyHeader = document.getElementById('historyHeader');
    const historyContainer = document.getElementById('history');
    let startY, startHeight, containerHeight; // 新增变量声明

    historyHeader.addEventListener('mousedown', startDrag);
    historyHeader.addEventListener('touchstart', startDrag);

    function startDrag(e) {
        if (e.touches && e.touches.length > 1) return; // 忽略多点触控

        if (historyRecords.length === 0) return;
        debugLog("startDrag");
        isHistoryDragging = true;
        startY = e.clientY || (e.touches ? e.touches[0].clientY : 0);
        startHeight = historyContainer.offsetHeight;
        containerHeight = window.innerHeight;
        
        historyContainer.classList.add('no-transition');
        
        document.addEventListener('mousemove', drag);
        document.addEventListener('touchmove', drag);
        document.addEventListener('mouseup', endDrag);
        document.addEventListener('touchend', endDrag);
        
        e.preventDefault();
    }

    function drag(e) {
        if (!isHistoryDragging) return;
        debugLog('drag');
        
        const currentY = e.clientY || (e.touches ? e.touches[0].clientY : 0);
        const deltaY = currentY - startY;
        const newHeight = startHeight - deltaY;
        debugLog(`newHeight: ${newHeight}`);
        // 计算最大最小高度
        const maxHeight = containerHeight * 0.6;
        const minHeight = containerHeight * 0.1;
        debugLog(`newHeight: ${newHeight}, maxHeight: ${maxHeight}, minHeight: ${minHeight}`);
        
        // 设置限制并更新样式
        if (newHeight >= minHeight && newHeight <= maxHeight) {
            historyContainer.style.height = `${newHeight}px`;
        } else if (newHeight < minHeight) {
            historyContainer.style.height = `${minHeight}px`;
        } else {
            historyContainer.style.height = `${maxHeight}px`;
        }
        
        updateHeightConstraints();
        e.preventDefault();
    }

    function endDrag(e) {
        if (!isHistoryDragging) return;
        debugLog('endDrag');
        
        const currentY = e.clientY || 
            (e.changedTouches && e.changedTouches[0] ? e.changedTouches[0].clientY : 
                e.touches && e.touches[0] ? e.touches[0].clientY : 0);

        const deltaY = currentY - startY;

        if (Math.abs(deltaY) < 5) {
            debugLog("点击判断: "+e.target.id);
            if (e.target.id === "clear-history") {
                clearHistory(e);
            } else {
                toggleHistory(); // 触发点击事件
            }
        } else {
            const maxHeight = containerHeight * 0.6;
            const minHeight = containerHeight * 0.2;
            let finalHeight;
            
            if (deltaY < -5) { // 向上拖拽
                finalHeight = Math.min(startHeight + Math.abs(deltaY), maxHeight);
            } else if (deltaY > 5) { // 向下拖拽
                finalHeight = Math.max(startHeight - Math.abs(deltaY), minHeight);
            }
            historyContainer.classList.toggle('expanded', finalHeight > containerHeight * 0.4);
        }
        
        historyContainer.style.height = '';
        
        // 恢复过渡效果
        historyContainer.classList.remove('no-transition');
        
        // 移除事件监听
        document.removeEventListener('mousemove', drag);
        document.removeEventListener('touchmove', drag);
        document.removeEventListener('mouseup', endDrag);
        document.removeEventListener('touchend', endDrag);
        
        //延时200ms避免触发body的click事件
        setTimeout(() => { isHistoryDragging = false; }, 200);
    }
}

function updateHeightConstraints() {
    const historyContainer = document.getElementById('history');
    const historyIcon = document.querySelector('.history-icon');
    const currentHeight = parseInt(historyContainer.style.height) || historyContainer.offsetHeight;
    
    if (currentHeight > window.innerHeight * 0.4) {
        historyIcon.classList.add('up');
    } else {
        historyIcon.classList.remove('up');
    }
}

function clearHistory(e) {
    e.stopPropagation();
    if(confirm("确定要清空所有历史记录吗？")) {
        historyRecords = [];
        updateHistoryDisplay();
    }
}

function updateRollButtonText(running) {
    const rollButton = document.getElementById('rollButton');
    if(running){
        rollButton.textContent = '停止';
    } else {
        const repeatCount = parseInt(document.getElementById('repeatCount').value);
        rollButton.textContent = repeatCount > 1 ? '连续掷' : '掷骰子';
    }
}

// 重绘骰子时保留原骰子值
function redrawDice() {
    const diceContainer = document.getElementById('diceContainer');
    const diceCount = parseInt(document.getElementById('diceCount').value);
    
    // 获取所有骰子行容器
    const rows = diceContainer.querySelectorAll('div[dice-row]');
    
    if(rows.length === 0) return;
    
    // 清空容器但保留行结构
    rows.forEach(row => {
        // 获取该行所有骰子的当前值
        let diceValues = Array.from(row.querySelectorAll('.dice')).map(dice => {
            return getDiceValueFromRotation(dice.style.transform);
        });
        
        // 根据新配置的骰子数量调整diceValues数组
        if(diceValues.length > diceCount) {
            diceValues = diceValues.slice(0, diceCount);
        } else if(diceValues.length < diceCount) {
            const diff = diceCount - diceValues.length;
            for(let i = 0; i < diff; i++) {
                diceValues.push(Math.floor(Math.random() * 6) + 1);
            }
        }
        
        row.innerHTML = '';
        
        // 重新创建骰子并保持原值或新增骰子
        diceValues.forEach(value => {
            const dice = createDice();
            const rotations = {
                1: {x: 0, y: 0},
                2: {x: 0, y: 180},
                3: {x: 0, y: -90},
                4: {x: 0, y: 90},
                5: {x: -90, y: 0},
                6: {x: 90, y: 0}
            };
            
            if(value >= 1 && value <= 6) {
                dice.style.transform = `rotateX(${rotations[value].x}deg) rotateY(${rotations[value].y}deg)`;
            } else {
                // 如果无法确定原值，则随机生成
                const randomValue = Math.floor(Math.random() * 6) + 1;
                dice.style.transform = `rotateX(${rotations[randomValue].x}deg) rotateY(${rotations[randomValue].y}deg)`;
            }
            
            row.appendChild(dice);
        });
    });
}

// 从旋转角度获取骰子值
function getDiceValueFromRotation(transform) {
    if(!transform) return null;
    
    const matches = transform.match(/rotateX\(([-0-9.]+)deg\)\s+rotateY\(([-0-9.]+)deg\)/);
    if(!matches) return null;
    
    const xRot = parseFloat(matches[1]) % 360;
    const yRot = parseFloat(matches[2]) % 360;
    
    if(Math.abs(xRot) < 45 && Math.abs(yRot) < 45) return 1;
    if(Math.abs(yRot - 180) < 45) return 2;
    if(Math.abs(yRot + 90) < 45) return 3;
    if(Math.abs(yRot - 90) < 45) return 4;
    if(Math.abs(xRot + 90) < 45) return 5;
    if(Math.abs(xRot - 90) < 45) return 6;
    
    return null;
}

function adjustNumber(id, delta) {
    const input = document.getElementById(id);
    if (!input) return;

    let value = parseInt(input.value) || 0;
    value += delta;
    
    if (input.hasAttribute('min')) {
        value = Math.max(value, parseInt(input.min));
    }
    if (input.hasAttribute('max')) {
        value = Math.min(value, parseInt(input.max));
    }
    
    input.value = value;

    redrawDice();

    if (!isContinuousRolling) {
        updateRollButtonText(isContinuousRolling);
    }

    saveSettings();
}

function toggleMenu() {
    const menu = document.getElementById('menuContainer');
    const btn = document.querySelector('.menu-btn');
    const isClosing = menu.classList.contains('active');
    menu.classList.toggle('active');
    btn.classList.toggle('active');
}

function handleBodyClick(e) {
    //debugLog("body clicked");
    // 如果正在拖拽，则直接返回
    if (isHistoryDragging) {
        isHistoryDragging = false; // 重置拖拽状态
        return;
    }
    // 如果点击的是菜单按钮或菜单容器内的元素，不处理
    if (e.target.closest('.menu-btn') || e.target.closest('#menuContainer')) {
        return;
    }
    // 如果点击的是全屏按钮，不处理
    if (e.target.closest('.fullscreen-btn') || e.target.closest('#fullscreenIcon')) {
        return;
    }
    // 如果点击的是历史记录区域或历史记录图标，不处理
    if (e.target.closest('#history') || e.target.closest('.history-icon')) {
        return;
    }
    if (e.target.closest('button') || e.target.closest('a')) {
        return;
    }
    
    debugLog("body clicked, need process");
    const menu = document.getElementById('menuContainer');
    const historyContainer = document.getElementById('history');

    // 如果菜单展开，则关闭菜单
    if (menu.classList.contains('active')) {
        toggleMenu();
        return;
    }

    // 如果历史记录展开，则关闭历史记录
    if (historyContainer.classList.contains('expanded')) {
        toggleHistory();
        return;
    }

    // 如果既没有菜单也没有历史记录展开，则掷骰子
    rollDice();
}

function showRequestDeviceMotionPermission(isShow) {
    const requestDeviceMotionPermission = document.getElementById('requestDeviceMotionPermission');
    requestDeviceMotionPermission.style.visibility = isShow ? 'visible' : 'hidden';
}

let lastAcceleration = { x: null, y: null, z: null };
let lastShakeTime = 0;
function handleDeviceMotion(event) {
    const shakeThreshold = 12; // 阈值
    const shakeCooldown = 1000; // 1 秒冷却
    const shakeEnabled = document.getElementById('shakeSwitch').checked;
    if (!shakeEnabled) return;

    const acceleration = event.acceleration || event.accelerationIncludingGravity;
    if (!acceleration) return;

    showRequestDeviceMotionPermission(false);

    // 第一次获取数据
    if (lastAcceleration.x === null) {
        lastAcceleration = {
            x: acceleration.x,
            y: acceleration.y,
            z: acceleration.z
        };
        return;
    }

    // 计算加速度变化
    const deltaX = Math.abs(acceleration.x - lastAcceleration.x);
    const deltaY = Math.abs(acceleration.y - lastAcceleration.y);
    const deltaZ = Math.abs(acceleration.z - lastAcceleration.z);
    
    if (deltaX > 5 || deltaY > 5 || deltaZ > 5) {
        debugLog(`加速度变化: x=${deltaX}, y=${deltaY}, z=${deltaZ}`); 
    }

    // 更新上一次的加速度
    lastAcceleration = {
        x: acceleration.x,
        y: acceleration.y,
        z: acceleration.z
    };
    // 摇动检测 + 冷却时间
    if (
        ((deltaX > shakeThreshold && deltaY > shakeThreshold) || 
        (deltaX > shakeThreshold && deltaZ > shakeThreshold) || 
        (deltaY > shakeThreshold && deltaZ > shakeThreshold)) &&
        Date.now() - lastShakeTime > shakeCooldown) {
        rollDice();
        lastShakeTime = Date.now();
    }
}

function isDeviceMotionSupported() {
    return 'DeviceMotionEvent' in window;
}

// 请求设备方向权限 (iOS 13+)
function requestDeviceMotionPermission() {
    if (typeof DeviceMotionEvent.requestPermission === 'function') {
        return DeviceMotionEvent.requestPermission()
            .then(permissionState => {
                if (permissionState === 'granted') {
                    debugLog('Device motion permission granted');
                    return true;
                } else {
                    debugLog('Device motion permission denied');
                    return false;
                }
            })
            .catch(error => {
                debugLog('Device motion permission error:', error);
                return false;
            });
    } else {
        // 非 iOS 13+ 设备不需要特殊权限
        return Promise.resolve(true);
    }
}

function initShakeFeature() {
    const shakeSwitch = document.getElementById('shakeSwitch');
    const shakeSwitchWrapper = shakeSwitch.closest('.switch-wrapper');

    if (!isDeviceMotionSupported()) {
        debugLog('Device motion not supported');
        shakeSwitchWrapper.style.display = 'none';
        shakeSwitch.checked = false;
        return;
    }

    if (shakeSwitch.checked) {
        window.addEventListener('devicemotion', handleDeviceMotion);
        setTimeout(() => {
            if (lastAcceleration.x === null && typeof DeviceMotionEvent.requestPermission === 'function') {
                showRequestDeviceMotionPermission(true);
            }
        }, 500);
    }
    
    shakeSwitch.addEventListener('change', async function() {
        if (this.checked) {
            const permissionGranted = await requestDeviceMotionPermission();
            if (!permissionGranted) {
                this.checked = false;
                alert('需要设备运动权限才能使用“摇一摇”功能');
            } else {
                window.addEventListener('devicemotion', handleDeviceMotion);  
                saveSettings();
            }
        } else {
            window.removeEventListener('devicemotion', handleDeviceMotion);
            showRequestDeviceMotionPermission(false);
            saveSettings();
        }
    });
}

function initDebugFeature() {
    // about区域点击事件监听器
    const about = document.getElementById('about');
    const debugSwitch = document.getElementById('debugSwitch');
    let aboutClickCount = 0;

    function enableDebugMode(enable) {
        const debugSwitchWrapper = document.getElementById('debugSwitchWrapper');
        if (!debugSwitchWrapper || !debugSwitch) return;

        debugSwitchWrapper.style.display = enable ? 'flex' : 'none';
        debugSwitch.checked = enable;
        saveSettings();
    }

    function handleAboutClick() {
        if (debugSwitch.checked) return;
        aboutClickCount++;
        debugLog(`aboutClickCount: ${aboutClickCount}`);
        if (aboutClickCount >= 5) {
            const confirmEnable = confirm('是否开启调试模式？');
            if (confirmEnable) {
                enableDebugMode(true);
            }
            aboutClickCount = 0;
        }
        setTimeout(() => {
            aboutClickCount = 0;
        }, 5000);
    }

    if (about) {
        about.addEventListener('click', handleAboutClick);
    }
}

window.onload = function() {
    debugLog("页面加载完成");
    loadSettings();
    preloadSound();
    initFullscreenFeature();
    initVibrateFeature();
    initShakeFeature();

    initDices();
    //rollDice(); // 未产生用户交互前不能播放音频和震动

    initDiceSizeControl();
    initSettingsControl();
    initHistoryDragFeature();
    initDebugFeature();
};