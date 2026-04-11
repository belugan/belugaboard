(function() {
    'use strict';

    // DOM 元素
    const pinnedScroll = document.getElementById('pinnedScroll');
    const timeline = document.getElementById('timeline');
    const updateBadge = document.getElementById('updateBadge');

    // 赞助相关 DOM
    const sponsorCard = document.getElementById('sponsorCard');
    const sponsorModal = document.getElementById('sponsorModal');
    const closeModal = document.getElementById('closeModal');
    const copyQunBtn = document.getElementById('copyQunBtn');
    const rankPreview = document.getElementById('rankPreview');
    const rankListPreview = document.getElementById('rankListPreview');
    const showRankBtn = document.getElementById('showRankBtn');
    const rankModal = document.getElementById('rankModal');
    const closeRankModal = document.getElementById('closeRankModal');
    const rankFullList = document.getElementById('rankFullList');
    const toast = document.getElementById('toast');

    let allItems = [];
    let sponsorData = { sponsors: [] };

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

    function escapeHtml(str) {
        if (!str) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    function showToast(message) {
        toast.textContent = message;
        toast.classList.add('show');
        setTimeout(() => {
            toast.classList.remove('show');
        }, 2000);
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

    // ========== 渲染排行榜 ==========
    function renderRankList(container, sponsors, limit = 5) {
        if (!sponsors || sponsors.length === 0) {
            container.innerHTML = '<div class="rank-loading">暂无赞助记录，来做第一个支持者吧 🐋</div>';
            return;
        }

        // 按金额排序
        const sorted = [...sponsors].sort((a, b) => b.amount - a.amount);
        const displayList = limit ? sorted.slice(0, limit) : sorted;

        let html = '';
        displayList.forEach((sponsor, index) => {
            const rank = index + 1;
            let medalClass = '';
            let medalIcon = `#${rank}`;
            
            if (rank === 1) {
                medalClass = 'gold';
                medalIcon = '🥇';
            } else if (rank === 2) {
                medalClass = 'silver';
                medalIcon = '🥈';
            } else if (rank === 3) {
                medalClass = 'bronze';
                medalIcon = '🥉';
            }

            html += `
                <div class="rank-item">
                    <div class="rank-medal ${medalClass}">${medalIcon}</div>
                    <div class="rank-info">
                        <span class="rank-name">${escapeHtml(sponsor.name || '匿名')}</span>
                        <span class="rank-amount">${sponsor.amount}</span>
                    </div>
                </div>
            `;
            if (sponsor.message) {
                html += `<div class="rank-message">“${escapeHtml(sponsor.message)}”</div>`;
            }
        });

        container.innerHTML = html;
    }

    // ========== 加载赞助数据 ==========
    async function loadSponsorData() {
        try {
            const response = await fetch('./sponsor.json');
            if (!response.ok) throw new Error('加载失败');
            sponsorData = await response.json();
            renderRankList(rankListPreview, sponsorData.sponsors, 5);
        } catch (error) {
            console.warn('赞助数据加载失败:', error);
            rankListPreview.innerHTML = '<div class="rank-loading">🌊 排行榜加载中...</div>';
            sponsorData = { sponsors: [] };
        }
    }

    // ========== 渲染完整排行榜 ==========
    function renderFullRankList() {
        if (!sponsorData.sponsors || sponsorData.sponsors.length === 0) {
            rankFullList.innerHTML = '<div class="rank-loading">暂无赞助记录</div>';
            return;
        }

        const sorted = [...sponsorData.sponsors].sort((a, b) => b.amount - a.amount);
        let html = '';
        
        sorted.forEach((sponsor, index) => {
            const rank = index + 1;
            let medalClass = '';
            let medalIcon = `${rank}`;
            
            if (rank === 1) {
                medalClass = 'gold';
                medalIcon = '🥇';
            } else if (rank === 2) {
                medalClass = 'silver';
                medalIcon = '🥈';
            } else if (rank === 3) {
                medalClass = 'bronze';
                medalIcon = '🥉';
            }

            html += `
                <div class="rank-item">
                    <div class="rank-medal ${medalClass}">${medalIcon}</div>
                    <div class="rank-info">
                        <span class="rank-name">${escapeHtml(sponsor.name || '匿名')}</span>
                        <span class="rank-amount">${sponsor.amount}</span>
                    </div>
                </div>
            `;
            if (sponsor.message) {
                html += `<div class="rank-message">“${escapeHtml(sponsor.message)}”</div>`;
            }
        });

        rankFullList.innerHTML = html;
    }

    // ========== 数据处理与渲染 ==========
    function processData(data) {
        const notices = data.notices || [];
        
        const pinned = notices.filter(item => item.pinned === true);
        const normal = notices.filter(item => !item.pinned);
        
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

    // ========== 初始化事件监听 ==========
    function initEvents() {
        // 赞助弹窗
        sponsorCard.addEventListener('click', () => {
            sponsorModal.classList.add('show');
        });

        closeModal.addEventListener('click', () => {
            sponsorModal.classList.remove('show');
        });

        sponsorModal.addEventListener('click', (e) => {
            if (e.target === sponsorModal) {
                sponsorModal.classList.remove('show');
            }
        });

        // 复制群号
        copyQunBtn.addEventListener('click', () => {
            navigator.clipboard?.writeText('1098521061').then(() => {
                showToast('✅ 群号已复制');
            }).catch(() => {
                showToast('📋 1098521061');
            });
        });

        // 排行榜弹窗
        showRankBtn.addEventListener('click', () => {
            renderFullRankList();
            rankModal.classList.add('show');
        });

        rankPreview.addEventListener('click', (e) => {
            if (e.target.closest('.rank-more')) {
                renderFullRankList();
                rankModal.classList.add('show');
            }
        });

        closeRankModal.addEventListener('click', () => {
            rankModal.classList.remove('show');
        });

        rankModal.addEventListener('click', (e) => {
            if (e.target === rankModal) {
                rankModal.classList.remove('show');
            }
        });

        // ESC 关闭弹窗
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                sponsorModal.classList.remove('show');
                rankModal.classList.remove('show');
            }
        });
    }

    // ========== 初始化 ==========
    async function init() {
        await Promise.all([
            loadData(),
            loadSponsorData()
        ]);
        initEvents();
    }

    init();

})();