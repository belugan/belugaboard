(function() {
    'use strict';

    // DOM 元素
    const pinnedScroll = document.getElementById('pinnedScroll');
    const timeline = document.getElementById('timeline');
    const updateBadge = document.getElementById('updateBadge');

    let allItems = [];

    // ========== 辅助函数 ==========
    function formatDate(dateStr) {
        if (!dateStr) return '';
        try {
            const d = new Date(dateStr);
            if (isNaN(d.getTime())) return dateStr;
            const month = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            return `${month}.${day}`;
        } catch {
            return dateStr;
        }
    }

    function timeAgo(dateStr) {
        if (!dateStr) return '刚刚';
        try {
            const d = new Date(dateStr);
            const now = new Date();
            const diff = Math.floor((now - d) / 1000);
            if (diff < 60) return '刚刚';
            if (diff < 3600) return `${Math.floor(diff / 60)}分钟前`;
            if (diff < 86400) return `${Math.floor(diff / 3600)}小时前`;
            return formatDate(dateStr);
        } catch {
            return dateStr;
        }
    }

    // ========== 渲染置顶区域 ==========
    function renderPinned(pinnedItems) {
        if (!pinnedItems || pinnedItems.length === 0) {
            pinnedScroll.innerHTML = '<div class="pinned-placeholder">✨ 暂无置顶信息</div>';
            return;
        }

        let html = '';
        pinnedItems.slice(0, 6).forEach(item => {
            html += `
                <div class="pinned-card">
                    <div class="pin-icon">📌 置顶</div>
                    <h4>${escapeHtml(item.title || '无标题')}</h4>
                    <p>${escapeHtml(item.content || item.desc || '')}</p>
                </div>
            `;
        });
        pinnedScroll.innerHTML = html;
    }

    // ========== 渲染时间线 ==========
    function renderTimeline(items) {
        if (!items || items.length === 0) {
            timeline.innerHTML = `
                <div class="empty-timeline">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2">
                        <path d="M12 3v18M3 12h18"/>
                    </svg>
                    <p>暂无动态，白鲸在深潜中...</p>
                </div>
            `;
            return;
        }

        let html = '<div class="timeline">';
        
        items.forEach(item => {
            const hasImage = item.image && item.image.trim() !== '';
            const imageClass = hasImage ? 'has-full-image' : '';
            const dateDisplay = formatDate(item.date);
            
            // 视觉区域
            let visualHtml = '';
            if (hasImage) {
                visualHtml = `
                    <div class="card-visual">
                        <img src="${escapeHtml(item.image)}" alt="" loading="lazy" onerror="this.parentElement.innerHTML='<div class=\\'card-visual-placeholder\\'>🐋</div>'">
                    </div>
                `;
            } else {
                visualHtml = `
                    <div class="card-visual">
                        <div class="card-visual-placeholder">🐋</div>
                    </div>
                `;
            }

            html += `
                <div class="timeline-card ${imageClass}">
                    <div class="card-layout">
                        ${visualHtml}
                        <div class="card-body">
                            <h3 class="card-title">${escapeHtml(item.title || '无标题')}</h3>
                            <p class="card-desc">${escapeHtml(item.content || item.desc || '')}</p>
                            <div class="card-meta">
                                <span class="card-date">
                                    <span>🕐</span> ${escapeHtml(dateDisplay)}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        });
        
        html += '</div>';
        timeline.innerHTML = html;
    }

    // ========== 简单转义 ==========
    function escapeHtml(str) {
        if (!str) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    // ========== 数据处理与渲染 ==========
    function processData(data) {
        const notices = data.notices || [];
        
        // 分离置顶和普通
        const pinned = notices.filter(item => item.pinned === true);
        const normal = notices.filter(item => !item.pinned);
        
        // 按日期排序（新的在前）
        const sortByDate = (a, b) => {
            const dateA = new Date(a.date || 0);
            const dateB = new Date(b.date || 0);
            return dateB - dateA;
        };
        
        pinned.sort(sortByDate);
        normal.sort(sortByDate);
        
        allItems = notices;
        
        renderPinned(pinned);
        renderTimeline(normal);
        
        // 更新徽章
        if (data.lastUpdate) {
            updateBadge.textContent = timeAgo(data.lastUpdate);
        } else {
            updateBadge.textContent = '已同步';
        }
    }

    // ========== 加载数据 ==========
    async function loadData() {
        try {
            const response = await fetch('./data.json');
            if (!response.ok) throw new Error('加载失败');
            
            const data = await response.json();
            processData(data);
            
        } catch (error) {
            console.warn('数据加载失败:', error);
            pinnedScroll.innerHTML = '<div class="pinned-placeholder">🌊 数据加载失败</div>';
            timeline.innerHTML = `
                <div class="empty-timeline">
                    <p>🐋 白鲸迷路了，请检查 data.json</p>
                </div>
            `;
            updateBadge.textContent = '离线';
        }
    }

    // ========== 初始化 ==========
    function init() {
        loadData();
        
        // 可选：定时刷新
        // setInterval(loadData, 60000);
    }

    init();

})();