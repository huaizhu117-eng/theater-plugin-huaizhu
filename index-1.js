// 槐序戏台 - 第二十八版：扩展设置区域的"槐序戏台"折叠区块，改用酒馆原生inline-drawer组件结构（而非自定义样式），使其外观和交互与其他原生扩展（如TTS、记忆等）保持一致，不再显得突兀
// 功能：开关控制悬浮球显示/隐藏（每次开启都重置回默认左侧位置） -> 悬浮球常驻所有界面，可拖动，拖动时若面板打开会实时跟随 -> 点击悬浮球弹出标签页面板（先隐藏定位完成后再显示，无闪烁），顶部为版本/作者/碎碎念说明（右上角×关闭），下方为生成/仓库/模板/预设/独立API五个标签 -> 生成时可设置"是否独立剧场"和"美化样式"，拼接角色卡/世界书/聊天记录+预设标签页中勾选的内容 -> 调用AI生成（可选独立API，支持多平台） -> 结果窗口展示，提供保存到仓库/续写/修改三个操作按钮 -> 仓库页可查看历史记录（可删除）和手动收藏的内容

jQuery(async () => {

  // ===== 自动获取当前插件所在文件夹路径，不再依赖固定文件夹名（如"HuaiZhu"）=====
  // 原理：遍历页面里所有<script>标签，找到src属性里包含"huaizhu"且路径在third-party下的那个，
  // 反推出它所在的文件夹路径。这样无论别人把插件装到什么文件夹名下
  // （比如从GitHub装的文件夹名是仓库名"theater-plugin-huaizhu"，而不是本地的"HuaiZhu"），
  // 都能正确找到图标等资源，不会因为文件夹名不一致而加载失败。
  let huaizhuExtensionFolder = 'scripts/extensions/third-party/HuaiZhu'; // 兜底默认值，找不到时才会用到
  const allScriptTags = document.getElementsByTagName('script');
  for (let i = 0; i < allScriptTags.length; i++) {
    const srcAttr = allScriptTags[i].getAttribute('src') || '';
    if (srcAttr.includes('/third-party/') && srcAttr.toLowerCase().includes('huaizhu') && srcAttr.endsWith('/index.js')) {
      huaizhuExtensionFolder = srcAttr.substring(0, srcAttr.lastIndexOf('/'));
      break;
    }
  }

  // ===== 在扩展设置区域插入：开关 + 各个弹窗的HTML结构 =====
  const settingsHtml = `
    <div class="inline-drawer">
      <div class="inline-drawer-toggle inline-drawer-header">
        <b>槐序戏台</b>
        <div class="inline-drawer-icon fa-solid fa-circle-chevron-down down"></div>
      </div>
      <div class="inline-drawer-content">
        <div class="huaizhu-switch-row">
          <span>是否开启槐序戏台小剧场</span>
          <label class="huaizhu-switch">
            <input type="checkbox" id="huaizhu_enable_checkbox">
            <span class="huaizhu-switch-slider"></span>
          </label>
        </div>
      </div>
    </div>
  `;
  $('#extensions_settings').append(settingsHtml);

  // 注：顶层"槐序戏台"区块现在使用酒馆原生inline-drawer组件，折叠展开由酒馆自带逻辑处理，这里不需要额外绑定

  // "仓库"区块标题（最近生成/我的收藏）的折叠/展开
  $(document).on('click', '.huaizhu-warehouse-section-title', function () {
    $(this).next('.huaizhu-collapsible-content').slideToggle(150);
    $(this).find('.huaizhu-collapse-arrow').toggleClass('huaizhu-collapsed');
    setTimeout(() => positionPanelNearBall(modalBox), 160);
  });

  // "🕷️的碎碎念"折叠/展开
  $(document).on('click', '.huaizhu-meta-toggle', function () {
    $(this).closest('.huaizhu-meta-row').next('.huaizhu-meta-detail').slideToggle(150);
    $(this).find('.huaizhu-collapse-arrow').toggleClass('huaizhu-collapsed');
    setTimeout(() => positionPanelNearBall(modalBox), 160);
  });

  // ===== 悬浮球 + 输入面板 + 结果面板，直接挂在body上，保证所有界面都常驻显示 =====
  const floatingHtml = `
    <div id="huaizhu_float_ball" style="display:none;">
      <img src="${huaizhuExtensionFolder}/huaizhu-icon.png" alt="槐序戏台" draggable="false">
    </div>

    <div id="huaizhu_modal_overlay" class="huaizhu-modal-overlay" style="display:none;">
      <div class="huaizhu-modal-box">

        <div class="huaizhu-meta-row">
          <span class="huaizhu-meta-text">版本：1.0</span>
          <span class="huaizhu-meta-text">作者：槐蛛</span>
          <span class="huaizhu-meta-toggle huaizhu-collapsible-title">
            🕷️的碎碎念
            <span class="huaizhu-collapse-arrow huaizhu-collapsed">▾</span>
          </span>
          <button id="huaizhu_modal_close_x" class="huaizhu-close-btn huaizhu-close-btn-meta">×</button>
        </div>
        <div class="huaizhu-meta-detail huaizhu-collapsible-content" style="display:none;">
          ✍🏻作者：槐🕷️/q2766593698（小红书同号）<br>
          ⚠️重要事项⚠️<br>
          🔴此插件只发布在QQ小群（槐雾缠丝🪡）里，仅限在小群里的妹子们使用，退群既放弃使用权<br>
          🔴禁任何形式的二传、抄袭等<br>
          🟢有任何疑问/bug，请在群内/私信询问槐蛛
        </div>

        <div class="huaizhu-panel-header">
          <div class="huaizhu-tab-bar">
            <button class="huaizhu-tab-btn huaizhu-tab-active" data-tab="generate">生成</button>
            <button class="huaizhu-tab-btn" data-tab="warehouse">仓库</button>
            <button class="huaizhu-tab-btn" data-tab="template">模板</button>
            <button class="huaizhu-tab-btn" data-tab="preset">预设</button>
            <button class="huaizhu-tab-btn" data-tab="settings">独立API</button>
          </div>
        </div>

        <!-- 标签页：生成小剧场 -->
        <div id="huaizhu_tab_generate" class="huaizhu-tab-page">

          <label for="huaizhu_instruction_input">这次想要什么内容：</label>
          <textarea id="huaizhu_instruction_input" rows="4" placeholder="例如：主题是xxx，背景是xxx..."></textarea>

          <div class="huaizhu-wordcount-row">
            <label>
              <input type="checkbox" id="huaizhu_limit_words_checkbox">
              限制字数
            </label>
            <input type="number" id="huaizhu_wordcount_input" placeholder="字数" disabled style="width:70px;">
          </div>

          <div class="huaizhu-style-row">
            <span class="huaizhu-style-label">美化样式：</span>
            <div class="huaizhu-style-buttons">
              <button type="button" id="huaizhu_style_no" class="menu_button huaizhu-style-btn huaizhu-style-active">不需要</button>
              <button type="button" id="huaizhu_style_yes" class="menu_button huaizhu-style-btn">需要</button>
            </div>
          </div>

          <input type="text" id="huaizhu_style_detail_input" placeholder="想要的风格（留空则由AI自定）" style="display:none;">

          <div class="huaizhu-style-row">
            <span class="huaizhu-style-label">是否独立剧场：</span>
            <div class="huaizhu-style-buttons">
              <button type="button" id="huaizhu_independent_yes" class="menu_button huaizhu-style-btn huaizhu-style-active">是（不跟随正文）</button>
              <button type="button" id="huaizhu_independent_no" class="menu_button huaizhu-style-btn">否（跟随正文发展）</button>
            </div>
          </div>

          <div class="huaizhu-modal-buttons">
            <button id="huaizhu_modal_cancel" class="menu_button">取消</button>
            <button id="huaizhu_modal_confirm" class="menu_button">生成</button>
          </div>
        </div>

        <!-- 标签页：仓库 -->
        <div id="huaizhu_tab_warehouse" class="huaizhu-tab-page" style="display:none;">

          <div class="huaizhu-warehouse-section-title huaizhu-collapsible-title">
            <span>最近生成</span>
            <span class="huaizhu-collapse-arrow huaizhu-collapsed">▾</span>
          </div>
          <div id="huaizhu_recent_list_container" class="huaizhu-collapsible-content" style="display:none;"></div>

          <div class="huaizhu-warehouse-section-title huaizhu-collapsible-title" style="margin-top:14px;">
            <span>我的收藏</span>
            <span class="huaizhu-collapse-arrow">▾</span>
          </div>
          <div class="huaizhu-collapsible-content">
            <div id="huaizhu_favorite_list_container"></div>
            <button type="button" id="huaizhu_favorite_add_btn" class="menu_button" style="width:100%; margin:6px 0;">+ 新建收藏</button>
          </div>

        </div>

        <!-- 标签页：模板 -->
        <div id="huaizhu_tab_template" class="huaizhu-tab-page" style="display:none;">

          <input type="text" id="huaizhu_template_search_input" placeholder="搜索模板名称...">

          <div class="huaizhu-template-group-row">
            <select id="huaizhu_template_group_filter">
              <option value="__all__">全部分组</option>
            </select>
            <button type="button" id="huaizhu_template_random_btn" class="menu_button">🎲 随机抽取</button>
          </div>

          <div id="huaizhu_template_list_container"></div>
          <button type="button" id="huaizhu_template_add_btn" class="menu_button" style="width:100%; margin:6px 0;">+ 新建模板</button>

        </div>

        <!-- 标签页：预设 -->
        <div id="huaizhu_tab_preset" class="huaizhu-tab-page" style="display:none;">

          <p style="font-size:0.85em; opacity:0.7; margin:0 0 8px 0;">可勾选多条拼接，用于约束/调整小剧场生成行为</p>
          <div id="huaizhu_preset_list_container"></div>
          <button type="button" id="huaizhu_preset_add_btn" class="menu_button" style="width:100%; margin:6px 0;">+ 新增预设</button>

        </div>

        <!-- 标签页：独立API -->
        <div id="huaizhu_tab_settings" class="huaizhu-tab-page" style="display:none;">

          <div class="huaizhu-switch-row">
            <span>使用独立API</span>
            <label class="huaizhu-switch">
              <input type="checkbox" id="huaizhu_use_independent_api_checkbox">
              <span class="huaizhu-switch-slider"></span>
            </label>
          </div>

          <div id="huaizhu_api_config_fields" style="display:none;">

            <label for="huaizhu_api_platform_select">平台：</label>
            <select id="huaizhu_api_platform_select">
              <option value="openai">GPT (OpenAI)</option>
              <option value="claude">Claude (Anthropic)</option>
              <option value="gemini">Gemini (Google AI Studio)</option>
              <option value="vertex">Vertex AI (Google Cloud)</option>
              <option value="deepseek">DeepSeek</option>
              <option value="openrouter">OpenRouter</option>
              <option value="grok">Grok (xAI)</option>
              <option value="custom_openai">自定义 (OpenAI协议)</option>
              <option value="custom_claude">自定义 (Anthropic协议)</option>
              <option value="custom_gemini">自定义 (Gemini协议)</option>
            </select>

            <label for="huaizhu_api_url_input">API地址：</label>
            <input type="text" id="huaizhu_api_url_input" placeholder="例如：https://api.openai.com">

            <label for="huaizhu_api_key_input">API密钥：</label>
            <div class="huaizhu-key-input-row">
              <input type="password" id="huaizhu_api_key_input" placeholder="sk-...">
              <button type="button" id="huaizhu_toggle_key_visibility" class="huaizhu-icon-btn">👁</button>
            </div>

            <button id="huaizhu_fetch_models_btn" class="menu_button" style="width:100%; margin:8px 0;">获取模型列表</button>

            <div id="huaizhu_model_select_row" style="display:none;">
              <label for="huaizhu_api_model_select">模型：</label>
              <select id="huaizhu_api_model_select"></select>
            </div>

            <div id="huaizhu_api_status_text" class="huaizhu-api-status"></div>

          </div>

          <div class="huaizhu-modal-buttons">
            <button id="huaizhu_api_save_btn" class="menu_button">保存设置</button>
          </div>
        </div>

      </div>
    </div>

    <div id="huaizhu_result_overlay" class="huaizhu-modal-overlay" style="display:none;">
      <div class="huaizhu-result-box">
        <div class="huaizhu-result-header">
          <h3>小剧场</h3>
          <button id="huaizhu_result_close" class="huaizhu-close-btn">×</button>
        </div>
        <div id="huaizhu_result_content" class="huaizhu-result-content"></div>
        <textarea id="huaizhu_result_edit_textarea" style="display:none;"></textarea>
        <div class="huaizhu-result-footer-buttons">
          <button type="button" id="huaizhu_result_save_to_recent_btn" class="menu_button">保存到仓库</button>
          <button type="button" id="huaizhu_result_continue_btn" class="menu_button">续写</button>
          <button type="button" id="huaizhu_result_edit_btn" class="menu_button">修改</button>
          <button type="button" id="huaizhu_result_save_edit_btn" class="menu_button" style="display:none;">保存</button>
        </div>
      </div>
    </div>

    <div id="huaizhu_preset_edit_overlay" class="huaizhu-modal-overlay" style="display:none;">
      <div class="huaizhu-modal-box">
        <div class="huaizhu-panel-header">
          <h3 id="huaizhu_preset_edit_title">新增预设</h3>
          <button id="huaizhu_preset_edit_close" class="huaizhu-close-btn">×</button>
        </div>

        <label for="huaizhu_preset_name_input">名称：</label>
        <input type="text" id="huaizhu_preset_name_input" placeholder="例如：标准免责声明">

        <label for="huaizhu_preset_content_input">内容：</label>
        <textarea id="huaizhu_preset_content_input" rows="5" placeholder="预设的具体文字内容..."></textarea>

        <div class="huaizhu-modal-buttons">
          <button id="huaizhu_preset_edit_cancel" class="menu_button">取消</button>
          <button id="huaizhu_preset_edit_save" class="menu_button">保存</button>
        </div>
      </div>
    </div>

    <div id="huaizhu_favorite_edit_overlay" class="huaizhu-modal-overlay" style="display:none;">
      <div class="huaizhu-modal-box">
        <div class="huaizhu-panel-header">
          <h3>新建收藏</h3>
          <button id="huaizhu_favorite_edit_close" class="huaizhu-close-btn">×</button>
        </div>

        <label for="huaizhu_favorite_name_input">名称：</label>
        <input type="text" id="huaizhu_favorite_name_input" placeholder="例如：雨夜告白">

        <label for="huaizhu_favorite_content_input">内容：</label>
        <textarea id="huaizhu_favorite_content_input" rows="6" placeholder="粘贴或输入想保存的小剧场内容..."></textarea>

        <div class="huaizhu-modal-buttons">
          <button id="huaizhu_favorite_edit_cancel" class="menu_button">取消</button>
          <button id="huaizhu_favorite_edit_save" class="menu_button">保存</button>
        </div>
      </div>
    </div>

    <div id="huaizhu_template_edit_overlay" class="huaizhu-modal-overlay" style="display:none;">
      <div class="huaizhu-modal-box">
        <div class="huaizhu-panel-header">
          <h3 id="huaizhu_template_edit_title">新建模板</h3>
          <button id="huaizhu_template_edit_close" class="huaizhu-close-btn">×</button>
        </div>

        <label for="huaizhu_template_name_input">名称：</label>
        <input type="text" id="huaizhu_template_name_input" placeholder="例如：仿微信聊天">

        <label for="huaizhu_template_group_input">分组：</label>
        <input type="text" id="huaizhu_template_group_input" placeholder="例如：美化样式（留空则归入未分组）">

        <label for="huaizhu_template_content_input">指令内容：</label>
        <textarea id="huaizhu_template_content_input" rows="6" placeholder="想要保存的指令文字..."></textarea>

        <div class="huaizhu-modal-buttons">
          <button id="huaizhu_template_edit_cancel" class="menu_button">取消</button>
          <button id="huaizhu_template_edit_save" class="menu_button">保存</button>
        </div>
      </div>
    </div>
  `;
  $('body').append(floatingHtml);

  const floatBall = document.getElementById('huaizhu_float_ball');
  const modalOverlay = document.getElementById('huaizhu_modal_overlay');
  const modalBox = modalOverlay.querySelector('.huaizhu-modal-box');

  // ===== 开关：控制悬浮球显示/隐藏 =====
  $('#huaizhu_enable_checkbox').on('change', function () {
    if (this.checked) {
      floatBall.style.display = 'flex';
      // 每次重新开启，悬浮球位置重置回默认左侧位置（不沿用上次拖动留下的位置）
      floatBall.style.left = '15px';
      floatBall.style.right = '';
      floatBall.style.top = '40%';
    } else {
      floatBall.style.display = 'none';
      // 关闭开关时，顺便把弹窗也关掉，避免奇怪状态残留
      $('#huaizhu_modal_overlay').css('display', 'none');
      $('#huaizhu_result_overlay').css('display', 'none');
    }
  });

  // ===== 悬浮球：初始位置（每次刷新都回到默认位置，不记忆） =====
  floatBall.style.position = 'fixed';
  floatBall.style.left = '15px';
  floatBall.style.top = '40%';
  floatBall.style.zIndex = '9998';

  let isDragging = false;
  let didMove = false;
  let startX = 0, startY = 0;
  let startRight = 0, startTop = 0;

  function getBallPosition() {
    const rect = floatBall.getBoundingClientRect();
    return {
      right: window.innerWidth - rect.right,
      top: rect.top,
      left: rect.left,
    };
  }

  function onDragStart(clientX, clientY) {
    isDragging = true;
    didMove = false;
    startX = clientX;
    startY = clientY;
    const pos = getBallPosition();
    startRight = pos.right;
    startTop = pos.top;
  }

  function onDragMove(clientX, clientY) {
    if (!isDragging) return;
    const deltaX = clientX - startX;
    const deltaY = clientY - startY;

    if (Math.abs(deltaX) > 5 || Math.abs(deltaY) > 5) {
      didMove = true;
    }

    let newRight = startRight - deltaX;
    let newTop = startTop + deltaY;

    const ballSize = 50;
    newRight = Math.max(0, Math.min(newRight, window.innerWidth - ballSize));
    newTop = Math.max(0, Math.min(newTop, window.innerHeight - ballSize));

    floatBall.style.right = newRight + 'px';
    floatBall.style.top = newTop + 'px';

    // 如果输入面板或结果面板当前是打开状态，拖动悬浮球时面板跟着实时移动
    if (modalOverlay.style.display === 'flex') {
      positionPanelNearBall(modalBox);
    }
    const resultOverlayEl = document.getElementById('huaizhu_result_overlay');
    if (resultOverlayEl.style.display === 'flex') {
      positionPanelNearBall(resultOverlayEl.querySelector('.huaizhu-result-box'));
    }
  }

  // 根据悬浮球当前位置，把面板定位在它旁边（优先放左侧，避免被屏幕右边裁掉）
  function positionPanelNearBall(panelEl) {
    const ballRect = floatBall.getBoundingClientRect();
    const panelWidth = panelEl.offsetWidth;
    const panelHeight = panelEl.offsetHeight;

    let left = ballRect.left - panelWidth - 10; // 默认放悬浮球左边
    if (left < 10) {
      left = ballRect.right + 10; // 左边放不下就放右边
    }

    let top = ballRect.top;
    // 防止面板底部超出屏幕
    if (top + panelHeight > window.innerHeight - 10) {
      top = window.innerHeight - panelHeight - 10;
    }
    if (top < 10) {
      top = 10;
    }

    panelEl.style.position = 'fixed';
    panelEl.style.left = left + 'px';
    panelEl.style.top = top + 'px';
    panelEl.style.margin = '0';
  }

  function onDragEnd() {
    if (!isDragging) return;
    isDragging = false;

    if (!didMove) {
      // 视为点击 -> 在悬浮球旁边打开输入面板
      // 先用visibility:hidden让面板占位但不可见，测量并定位好之后再真正显示，避免"先出现在错误位置再跳转"的闪烁
      modalOverlay.style.display = 'flex';
      modalOverlay.style.background = 'transparent'; // 不需要全屏变暗，更轻量
      modalOverlay.style.alignItems = 'flex-start';
      modalOverlay.style.justifyContent = 'flex-start';
      modalBox.style.visibility = 'hidden';

      requestAnimationFrame(() => {
        positionPanelNearBall(modalBox);
        modalBox.style.visibility = 'visible';
      });
    }
  }

  floatBall.addEventListener('touchstart', (e) => {
    const touch = e.touches[0];
    onDragStart(touch.clientX, touch.clientY);
  });
  floatBall.addEventListener('touchmove', (e) => {
    const touch = e.touches[0];
    onDragMove(touch.clientX, touch.clientY);
    e.preventDefault();
  });
  floatBall.addEventListener('touchend', () => {
    onDragEnd();
  });

  floatBall.addEventListener('mousedown', (e) => {
    onDragStart(e.clientX, e.clientY);
  });
  document.addEventListener('mousemove', (e) => {
    onDragMove(e.clientX, e.clientY);
  });
  document.addEventListener('mouseup', () => {
    onDragEnd();
  });

  // 字数限制勾选框
  $('#huaizhu_limit_words_checkbox').on('change', function () {
    $('#huaizhu_wordcount_input').prop('disabled', !this.checked);
  });

  // 美化开关
  let wantStyle = false;

  $('#huaizhu_style_no').on('click', () => {
    wantStyle = false;
    $('#huaizhu_style_no').addClass('huaizhu-style-active');
    $('#huaizhu_style_yes').removeClass('huaizhu-style-active');
    $('#huaizhu_style_detail_input').css('display', 'none');
  });

  $('#huaizhu_style_yes').on('click', () => {
    wantStyle = true;
    $('#huaizhu_style_yes').addClass('huaizhu-style-active');
    $('#huaizhu_style_no').removeClass('huaizhu-style-active');
    $('#huaizhu_style_detail_input').css('display', 'block');
  });

  // 是否独立剧场开关，默认为"是"（独立，不跟随正文）
  let isIndependentTheater = true;

  // 记录当前结果窗口展示的内容对应哪条"最近生成"记录，供续写/修改/保存使用
  let currentResultRecordId = null;
  let currentResultIsIndependent = true;
  let currentResultInstruction = '';
  let currentResultText = ''; // 当前结果窗口里实际展示的纯文字内容（用于续写/修改）

  $('#huaizhu_independent_yes').on('click', () => {
    isIndependentTheater = true;
    $('#huaizhu_independent_yes').addClass('huaizhu-style-active');
    $('#huaizhu_independent_no').removeClass('huaizhu-style-active');
  });

  $('#huaizhu_independent_no').on('click', () => {
    isIndependentTheater = false;
    $('#huaizhu_independent_no').addClass('huaizhu-style-active');
    $('#huaizhu_independent_yes').removeClass('huaizhu-style-active');
  });

  // ===================================================================
  // 标签页切换逻辑
  // ===================================================================

  $('.huaizhu-tab-btn').on('click', function () {
    const tabName = $(this).data('tab');

    $('.huaizhu-tab-btn').removeClass('huaizhu-tab-active');
    $(this).addClass('huaizhu-tab-active');

    $('.huaizhu-tab-page').css('display', 'none');
    $('#huaizhu_tab_' + tabName).css('display', 'block');

    if (tabName === 'warehouse') {
      renderRecentList();
      renderFavoriteList();
    }

    if (tabName === 'template') {
      refreshGroupFilterOptions();
      renderTemplateList();
    }

    if (tabName === 'settings') {
      loadSavedConfigIntoForm();
      renderPresetList();
    }

    setTimeout(() => positionPanelNearBall(modalBox), 0);
  });

  // ===================================================================
  // 仓库：最近生成（自动留底，只读）
  // ===================================================================

  const HUAIZHU_RECENT_STORAGE_KEY = 'huaizhu_recent_list';

  function loadRecentList() {
    try {
      const raw = localStorage.getItem(HUAIZHU_RECENT_STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  }

  function saveRecentList(list) {
    localStorage.setItem(HUAIZHU_RECENT_STORAGE_KEY, JSON.stringify(list));
  }

  // 每次生成成功后调用，自动把结果存进"最近生成"
  function addToRecentList(instruction, content, isIndependent) {
    const list = loadRecentList();
    list.unshift({
      id: Date.now(),
      instruction: instruction,
      content: content,
      time: new Date().toLocaleString(),
      isIndependent: isIndependent,
    });
    saveRecentList(list);
    return list[0].id; // 返回新建条目的id，方便后续续写/修改时定位
  }

  function renderRecentList() {
    const list = loadRecentList();
    const container = $('#huaizhu_recent_list_container');

    if (list.length === 0) {
      container.html('<p style="opacity:0.6; font-size:0.85em; padding:8px 0;">暂无记录</p>');
      return;
    }

    let html = '';
    list.forEach((item) => {
      const safePreview = $('<div>').text(item.instruction).html();
      html += `
        <div class="huaizhu-entry-item">
          <div class="huaizhu-entry-header huaizhu-collapsible-title">
            <span class="huaizhu-entry-name">${safePreview || '（无标题）'}</span>
            <span class="huaizhu-collapse-arrow huaizhu-collapsed">▾</span>
          </div>
          <div class="huaizhu-entry-content" style="display:none;">
            <div class="huaizhu-entry-time">${item.time}</div>
            <div class="huaizhu-entry-text">${$('<div>').text(item.content).html()}</div>
            <div class="huaizhu-entry-buttons">
              <button type="button" class="menu_button huaizhu-copy-btn" data-content="${encodeURIComponent(item.content)}">复制内容</button>
              <button type="button" class="menu_button huaizhu-recent-delete-btn" data-id="${item.id}">删除</button>
            </div>
          </div>
        </div>
      `;
    });
    container.html(html);
  }

  // ===================================================================
  // 仓库：我的收藏（手动管理）
  // ===================================================================

  const HUAIZHU_FAVORITE_STORAGE_KEY = 'huaizhu_favorite_list';

  function loadFavoriteList() {
    try {
      const raw = localStorage.getItem(HUAIZHU_FAVORITE_STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  }

  function saveFavoriteList(list) {
    localStorage.setItem(HUAIZHU_FAVORITE_STORAGE_KEY, JSON.stringify(list));
  }

  function renderFavoriteList() {
    const list = loadFavoriteList();
    const container = $('#huaizhu_favorite_list_container');

    if (list.length === 0) {
      container.html('<p style="opacity:0.6; font-size:0.85em; padding:8px 0;">暂无收藏</p>');
      return;
    }

    let html = '';
    list.forEach((item) => {
      const safeName = $('<div>').text(item.name).html();
      html += `
        <div class="huaizhu-entry-item">
          <div class="huaizhu-entry-header huaizhu-collapsible-title">
            <span class="huaizhu-entry-name">${safeName || '（无标题）'}</span>
            <span class="huaizhu-collapse-arrow huaizhu-collapsed">▾</span>
          </div>
          <div class="huaizhu-entry-content" style="display:none;">
            <div class="huaizhu-entry-text">${$('<div>').text(item.content).html()}</div>
            <div class="huaizhu-entry-buttons">
              <button type="button" class="menu_button huaizhu-copy-btn" data-content="${encodeURIComponent(item.content)}">复制内容</button>
              <button type="button" class="menu_button huaizhu-favorite-delete-btn" data-id="${item.id}">删除</button>
            </div>
          </div>
        </div>
      `;
    });
    container.html(html);
  }

  // 新建收藏按钮
  $('#huaizhu_favorite_add_btn').on('click', () => {
    $('#huaizhu_favorite_name_input').val('');
    $('#huaizhu_favorite_content_input').val('');
    $('#huaizhu_favorite_edit_overlay').css('display', 'flex');
    $('#huaizhu_favorite_edit_overlay').css('background', 'transparent');
    $('#huaizhu_favorite_edit_overlay').css('align-items', 'flex-start');
    $('#huaizhu_favorite_edit_overlay').css('justify-content', 'flex-start');
    const box = document.querySelector('#huaizhu_favorite_edit_overlay .huaizhu-modal-box');
    setTimeout(() => positionPanelNearBall(box), 0);
  });

  $('#huaizhu_favorite_edit_close, #huaizhu_favorite_edit_cancel').on('click', () => {
    $('#huaizhu_favorite_edit_overlay').css('display', 'none');
  });

  $('#huaizhu_favorite_edit_save').on('click', () => {
    const name = $('#huaizhu_favorite_name_input').val().trim();
    const content = $('#huaizhu_favorite_content_input').val().trim();

    if (!content) {
      alert('请填写收藏内容');
      return;
    }

    const list = loadFavoriteList();
    list.unshift({
      id: Date.now(),
      name: name || '（无标题）',
      content: content,
    });
    saveFavoriteList(list);

    $('#huaizhu_favorite_edit_overlay').css('display', 'none');
    renderFavoriteList();
    setTimeout(() => positionPanelNearBall(modalBox), 0);
  });

  // 折叠展开（事件委托，因为列表内容是动态生成的）
  $(document).on('click', '.huaizhu-entry-header', function () {
    $(this).siblings('.huaizhu-entry-content').slideToggle(150);
    $(this).find('.huaizhu-collapse-arrow').toggleClass('huaizhu-collapsed');
    setTimeout(() => positionPanelNearBall(modalBox), 160);
  });

  // 复制内容按钮（事件委托）
  $(document).on('click', '.huaizhu-copy-btn', function (e) {
    e.stopPropagation();
    const content = decodeURIComponent($(this).data('content'));
    navigator.clipboard.writeText(content).then(() => {
      const originalText = $(this).text();
      $(this).text('已复制！');
      setTimeout(() => $(this).text(originalText), 1200);
    }).catch(() => {
      alert('复制失败，请手动选择文字复制');
    });
  });

  // 删除收藏按钮（事件委托）
  $(document).on('click', '.huaizhu-favorite-delete-btn', function (e) {
    e.stopPropagation();
    const id = parseInt($(this).data('id'));
    let list = loadFavoriteList();
    list = list.filter((item) => item.id !== id);
    saveFavoriteList(list);
    renderFavoriteList();
    setTimeout(() => positionPanelNearBall(modalBox), 0);
  });

  // 删除"最近生成"条目（事件委托）
  $(document).on('click', '.huaizhu-recent-delete-btn', function (e) {
    e.stopPropagation();
    const id = parseInt($(this).data('id'));
    let list = loadRecentList();
    list = list.filter((item) => item.id !== id);
    saveRecentList(list);

    // 如果删除的正是当前结果窗口对应的那条记录，清空关联id，避免后续"保存到仓库"误操作到已删除的记录
    if (currentResultRecordId === id) {
      currentResultRecordId = null;
    }

    renderRecentList();
    setTimeout(() => positionPanelNearBall(modalBox), 0);
  });

  // ===================================================================
  // 模板管理：存储读写、渲染列表（含分组筛选+搜索）、随机抽取、增删
  // ===================================================================

  const HUAIZHU_TEMPLATE_STORAGE_KEY = 'huaizhu_template_list';

  function loadTemplateList() {
    try {
      const raw = localStorage.getItem(HUAIZHU_TEMPLATE_STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  }

  function saveTemplateList(list) {
    localStorage.setItem(HUAIZHU_TEMPLATE_STORAGE_KEY, JSON.stringify(list));
  }

  // 根据当前所有模板，更新分组筛选下拉框的选项（自动收集已出现过的分组名）
  function refreshGroupFilterOptions() {
    const list = loadTemplateList();
    const groups = new Set();
    list.forEach((item) => {
      groups.add(item.group || '未分组');
    });

    const currentValue = $('#huaizhu_template_group_filter').val();
    let optionsHtml = '<option value="__all__">全部分组</option>';
    groups.forEach((g) => {
      const safeG = $('<div>').text(g).html();
      optionsHtml += '<option value="' + safeG + '">' + safeG + '</option>';
    });
    $('#huaizhu_template_group_filter').html(optionsHtml);

    // 尽量保留用户之前选的分组（如果它依然存在）
    if (currentValue && groups.has(currentValue)) {
      $('#huaizhu_template_group_filter').val(currentValue);
    }
  }

  // 渲染模板列表：根据当前的搜索词+分组筛选条件过滤后展示
  function renderTemplateList() {
    const keyword = $('#huaizhu_template_search_input').val().trim().toLowerCase();
    const groupFilter = $('#huaizhu_template_group_filter').val();

    let list = loadTemplateList();

    if (groupFilter && groupFilter !== '__all__') {
      list = list.filter((item) => (item.group || '未分组') === groupFilter);
    }

    if (keyword) {
      list = list.filter((item) => item.name.toLowerCase().includes(keyword));
    }

    const container = $('#huaizhu_template_list_container');

    if (list.length === 0) {
      container.html('<p style="opacity:0.6; font-size:0.85em; padding:8px 0;">暂无匹配的模板</p>');
      return;
    }

    let html = '';
    list.forEach((item) => {
      const safeName = $('<div>').text(item.name).html();
      const safeGroup = $('<div>').text(item.group || '未分组').html();
      html += `
        <div class="huaizhu-entry-item">
          <div class="huaizhu-entry-header huaizhu-collapsible-title">
            <span class="huaizhu-entry-name">${safeName}</span>
            <span class="huaizhu-template-group-tag">${safeGroup}</span>
            <span class="huaizhu-collapse-arrow huaizhu-collapsed">▾</span>
          </div>
          <div class="huaizhu-entry-content" style="display:none;">
            <div class="huaizhu-entry-text">${$('<div>').text(item.content).html()}</div>
            <div class="huaizhu-entry-buttons">
              <button type="button" class="menu_button huaizhu-template-use-btn" data-id="${item.id}">使用</button>
              <button type="button" class="menu_button huaizhu-template-edit-btn" data-id="${item.id}">编辑</button>
              <button type="button" class="menu_button huaizhu-template-delete-btn" data-id="${item.id}">删除</button>
            </div>
          </div>
        </div>
      `;
    });
    container.html(html);
  }

  // 搜索框/分组筛选变化时，重新渲染列表
  $('#huaizhu_template_search_input').on('input', renderTemplateList);
  $('#huaizhu_template_group_filter').on('change', renderTemplateList);

  // 随机抽取：从当前筛选的分组里随机选一个模板并使用
  $('#huaizhu_template_random_btn').on('click', () => {
    const groupFilter = $('#huaizhu_template_group_filter').val();
    let list = loadTemplateList();

    if (groupFilter && groupFilter !== '__all__') {
      list = list.filter((item) => (item.group || '未分组') === groupFilter);
    }

    if (list.length === 0) {
      alert('当前分组没有可抽取的模板');
      return;
    }

    const randomItem = list[Math.floor(Math.random() * list.length)];
    useTemplate(randomItem.id);
  });

  // 使用模板：填入生成页的指令框，并切回生成标签
  function useTemplate(id) {
    const list = loadTemplateList();
    const item = list.find((t) => t.id === id);
    if (!item) return;

    $('#huaizhu_instruction_input').val(item.content);

    $('.huaizhu-tab-btn').removeClass('huaizhu-tab-active');
    $('.huaizhu-tab-btn[data-tab="generate"]').addClass('huaizhu-tab-active');
    $('.huaizhu-tab-page').css('display', 'none');
    $('#huaizhu_tab_generate').css('display', 'block');

    setTimeout(() => positionPanelNearBall(modalBox), 0);
  }

  // 使用按钮（事件委托）
  $(document).on('click', '.huaizhu-template-use-btn', function (e) {
    e.stopPropagation();
    useTemplate(parseInt($(this).data('id')));
  });

  // 删除按钮（事件委托）
  $(document).on('click', '.huaizhu-template-delete-btn', function (e) {
    e.stopPropagation();
    const id = parseInt($(this).data('id'));
    let list = loadTemplateList();
    list = list.filter((item) => item.id !== id);
    saveTemplateList(list);
    refreshGroupFilterOptions();
    renderTemplateList();
    setTimeout(() => positionPanelNearBall(modalBox), 0);
  });

  // 编辑按钮（事件委托）：打开编辑弹窗并填入已有数据
  let editingTemplateId = null;

  $(document).on('click', '.huaizhu-template-edit-btn', function (e) {
    e.stopPropagation();
    const id = parseInt($(this).data('id'));
    const list = loadTemplateList();
    const item = list.find((t) => t.id === id);
    if (!item) return;

    editingTemplateId = id;
    $('#huaizhu_template_edit_title').text('编辑模板');
    $('#huaizhu_template_name_input').val(item.name);
    $('#huaizhu_template_group_input').val(item.group || '');
    $('#huaizhu_template_content_input').val(item.content);
    openTemplateEditPanel();
  });

  // 新建模板按钮
  $('#huaizhu_template_add_btn').on('click', () => {
    editingTemplateId = null;
    $('#huaizhu_template_edit_title').text('新建模板');
    $('#huaizhu_template_name_input').val('');
    $('#huaizhu_template_group_input').val('');
    $('#huaizhu_template_content_input').val('');
    openTemplateEditPanel();
  });

  function openTemplateEditPanel() {
    const overlay = $('#huaizhu_template_edit_overlay');
    overlay.css('display', 'flex');
    overlay.css('background', 'transparent');
    overlay.css('align-items', 'flex-start');
    overlay.css('justify-content', 'flex-start');
    const box = document.querySelector('#huaizhu_template_edit_overlay .huaizhu-modal-box');
    setTimeout(() => positionPanelNearBall(box), 0);
  }

  $('#huaizhu_template_edit_close, #huaizhu_template_edit_cancel').on('click', () => {
    $('#huaizhu_template_edit_overlay').css('display', 'none');
  });

  $('#huaizhu_template_edit_save').on('click', () => {
    const name = $('#huaizhu_template_name_input').val().trim();
    const group = $('#huaizhu_template_group_input').val().trim();
    const content = $('#huaizhu_template_content_input').val().trim();

    if (!name || !content) {
      alert('请填写模板名称和内容');
      return;
    }

    let list = loadTemplateList();

    if (editingTemplateId) {
      // 编辑已有模板
      const idx = list.findIndex((t) => t.id === editingTemplateId);
      if (idx !== -1) {
        list[idx] = { id: editingTemplateId, name, group, content };
      }
    } else {
      // 新建模板
      list.unshift({ id: Date.now(), name, group, content });
    }

    saveTemplateList(list);
    $('#huaizhu_template_edit_overlay').css('display', 'none');
    refreshGroupFilterOptions();
    renderTemplateList();
    setTimeout(() => positionPanelNearBall(modalBox), 0);
  });

  // ===================================================================
  // 预设管理：存储读写、渲染列表（含勾选状态）、增删改
  // ===================================================================

  const HUAIZHU_PRESET_STORAGE_KEY = 'huaizhu_preset_list';

  function loadPresetList() {
    try {
      const raw = localStorage.getItem(HUAIZHU_PRESET_STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  }

  function savePresetList(list) {
    localStorage.setItem(HUAIZHU_PRESET_STORAGE_KEY, JSON.stringify(list));
  }

  // 拼接所有当前被勾选的预设内容，按列表顺序连接，供生成时使用
  function getActivePresetText() {
    const list = loadPresetList();
    const activeOnes = list.filter((item) => item.checked);
    if (activeOnes.length === 0) return '';
    return activeOnes.map((item) => item.content).join('\n\n');
  }

  function renderPresetList() {
    const list = loadPresetList();
    const container = $('#huaizhu_preset_list_container');

    if (list.length === 0) {
      container.html('<p style="opacity:0.6; font-size:0.85em; padding:8px 0;">暂无预设</p>');
      return;
    }

    let html = '';
    list.forEach((item) => {
      const safeName = $('<div>').text(item.name).html();
      html += `
        <div class="huaizhu-preset-item">
          <input type="checkbox" class="huaizhu-preset-checkbox" data-id="${item.id}" ${item.checked ? 'checked' : ''}>
          <span class="huaizhu-preset-name">${safeName}</span>
          <button type="button" class="huaizhu-icon-btn huaizhu-preset-edit-btn" data-id="${item.id}">✎</button>
          <button type="button" class="huaizhu-icon-btn huaizhu-preset-delete-btn" data-id="${item.id}">🗑</button>
        </div>
      `;
    });
    container.html(html);
  }

  // 勾选状态变化时直接保存
  $(document).on('change', '.huaizhu-preset-checkbox', function () {
    const id = parseInt($(this).data('id'));
    const checked = $(this).prop('checked');
    const list = loadPresetList();
    const item = list.find((p) => p.id === id);
    if (item) {
      item.checked = checked;
      savePresetList(list);
    }
  });

  let editingPresetId = null;

  $('#huaizhu_preset_add_btn').on('click', () => {
    editingPresetId = null;
    $('#huaizhu_preset_edit_title').text('新增预设');
    $('#huaizhu_preset_name_input').val('');
    $('#huaizhu_preset_content_input').val('');
    openPresetEditPanel();
  });

  $(document).on('click', '.huaizhu-preset-edit-btn', function () {
    const id = parseInt($(this).data('id'));
    const list = loadPresetList();
    const item = list.find((p) => p.id === id);
    if (!item) return;

    editingPresetId = id;
    $('#huaizhu_preset_edit_title').text('编辑预设');
    $('#huaizhu_preset_name_input').val(item.name);
    $('#huaizhu_preset_content_input').val(item.content);
    openPresetEditPanel();
  });

  $(document).on('click', '.huaizhu-preset-delete-btn', function () {
    const id = parseInt($(this).data('id'));
    let list = loadPresetList();
    list = list.filter((p) => p.id !== id);
    savePresetList(list);
    renderPresetList();
    setTimeout(() => positionPanelNearBall(modalBox), 0);
  });

  function openPresetEditPanel() {
    const overlay = $('#huaizhu_preset_edit_overlay');
    overlay.css('display', 'flex');
    overlay.css('background', 'transparent');
    overlay.css('align-items', 'flex-start');
    overlay.css('justify-content', 'flex-start');
    const box = document.querySelector('#huaizhu_preset_edit_overlay .huaizhu-modal-box');
    setTimeout(() => positionPanelNearBall(box), 0);
  }

  $('#huaizhu_preset_edit_close, #huaizhu_preset_edit_cancel').on('click', () => {
    $('#huaizhu_preset_edit_overlay').css('display', 'none');
  });

  $('#huaizhu_preset_edit_save').on('click', () => {
    const name = $('#huaizhu_preset_name_input').val().trim();
    const content = $('#huaizhu_preset_content_input').val().trim();

    if (!name || !content) {
      alert('请填写预设名称和内容');
      return;
    }

    let list = loadPresetList();

    if (editingPresetId) {
      const idx = list.findIndex((p) => p.id === editingPresetId);
      if (idx !== -1) {
        list[idx].name = name;
        list[idx].content = content;
      }
    } else {
      list.push({ id: Date.now(), name, content, checked: false });
    }

    savePresetList(list);
    $('#huaizhu_preset_edit_overlay').css('display', 'none');
    renderPresetList();
    setTimeout(() => positionPanelNearBall(modalBox), 0);
  });

  // ===================================================================
  // API设置子页面：切换显示、读写配置、获取模型列表
  // ===================================================================

  const HUAIZHU_API_STORAGE_KEY = 'huaizhu_api_config';

  function loadApiConfig() {
    try {
      const raw = localStorage.getItem(HUAIZHU_API_STORAGE_KEY);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (e) {
      return null;
    }
  }

  function saveApiConfigToStorage(config) {
    localStorage.setItem(HUAIZHU_API_STORAGE_KEY, JSON.stringify(config));
  }

  // 智能拼接URL：自动判断用户填的地址是否已经包含版本路径(/v1, /v1beta)，避免重复拼接导致404
  function buildApiUrl(baseUrl, pathSuffix) {
    let cleanUrl = baseUrl.replace(/\/+$/, ''); // 去掉结尾斜杠

    // pathSuffix形如 '/v1/models'，提取它的版本号部分，比如'/v1'
    const versionMatch = pathSuffix.match(/^(\/v\d+(beta)?)/);
    const versionPart = versionMatch ? versionMatch[1] : '';

    // 如果用户填的地址结尾已经是这个版本号（如 .../v1），就不再重复加一次版本号
    if (versionPart && cleanUrl.endsWith(versionPart)) {
      const restOfPath = pathSuffix.slice(versionPart.length);
      return cleanUrl + restOfPath;
    }

    return cleanUrl + pathSuffix;
  }

  // 根据平台类型，请求该平台的模型列表接口
  async function fetchModelList(platform, apiUrl, apiKey) {

    // DeepSeek、OpenRouter、Grok、自定义OpenAI协议，都走OpenAI兼容格式
    const openaiFamily = ['openai', 'custom_openai', 'deepseek', 'openrouter', 'grok'];
    // 自定义Anthropic协议，走Claude格式
    const claudeFamily = ['claude', 'custom_claude'];
    // 自定义Gemini协议、Vertex AI，走Gemini格式（Vertex AI的完整专属认证以后再完善，这里先用基础兼容方式）
    const geminiFamily = ['gemini', 'custom_gemini', 'vertex'];

    if (openaiFamily.includes(platform)) {
      const url = buildApiUrl(apiUrl, '/v1/models');
      const response = await fetch(url, {
        method: 'GET',
        headers: { 'Authorization': 'Bearer ' + apiKey },
      });
      if (!response.ok) {
        throw new Error('请求失败，状态码：' + response.status);
      }
      const data = await response.json();
      if (!data.data || !Array.isArray(data.data)) {
        throw new Error('返回格式异常，未找到模型列表');
      }
      return data.data.map((m) => m.id);
    }

    if (claudeFamily.includes(platform)) {
      const url = buildApiUrl(apiUrl, '/v1/models');
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        },
      });
      if (!response.ok) {
        throw new Error('请求失败，状态码：' + response.status);
      }
      const data = await response.json();
      if (!data.data || !Array.isArray(data.data)) {
        throw new Error('返回格式异常，未找到模型列表');
      }
      return data.data.map((m) => m.id);
    }

    if (geminiFamily.includes(platform)) {
      const url = buildApiUrl(apiUrl, '/v1beta/models?key=' + encodeURIComponent(apiKey));
      const response = await fetch(url, { method: 'GET' });
      if (!response.ok) {
        throw new Error('请求失败，状态码：' + response.status);
      }
      const data = await response.json();
      if (!data.models || !Array.isArray(data.models)) {
        throw new Error('返回格式异常，未找到模型列表');
      }
      return data.models.map((m) => m.name.replace(/^models\//, ''));
    }

    throw new Error('不支持的平台类型：' + platform);
  }

  // 根据保存的独立API配置，真正调用该平台的生成接口
  async function callIndependentApi(config, prompt) {
    const { platform, apiUrl, apiKey, model } = config;

    const openaiFamily = ['openai', 'custom_openai', 'deepseek', 'openrouter', 'grok'];
    const claudeFamily = ['claude', 'custom_claude'];
    const geminiFamily = ['gemini', 'custom_gemini', 'vertex'];

    if (openaiFamily.includes(platform)) {
      const url = buildApiUrl(apiUrl, '/v1/chat/completions');
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + apiKey,
        },
        body: JSON.stringify({
          model: model,
          messages: [{ role: 'user', content: prompt }],
        }),
      });
      if (!response.ok) {
        const errText = await response.text();
        throw new Error('独立API请求失败(' + response.status + ')：' + errText.slice(0, 200));
      }
      const data = await response.json();
      return data.choices[0].message.content;
    }

    if (claudeFamily.includes(platform)) {
      const url = buildApiUrl(apiUrl, '/v1/messages');
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: model,
          max_tokens: 4096,
          messages: [{ role: 'user', content: prompt }],
        }),
      });
      if (!response.ok) {
        const errText = await response.text();
        throw new Error('独立API请求失败(' + response.status + ')：' + errText.slice(0, 200));
      }
      const data = await response.json();
      return data.content[0].text;
    }

    if (geminiFamily.includes(platform)) {
      const url = buildApiUrl(apiUrl, '/v1beta/models/' + model + ':generateContent?key=' + encodeURIComponent(apiKey));
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
        }),
      });
      if (!response.ok) {
        const errText = await response.text();
        throw new Error('独立API请求失败(' + response.status + ')：' + errText.slice(0, 200));
      }
      const data = await response.json();
      return data.candidates[0].content.parts[0].text;
    }

    throw new Error('不支持的平台类型：' + platform);
  }

  // 把已保存的配置读出来填进表单
  function loadSavedConfigIntoForm() {
    const config = loadApiConfig();
    if (config && config.enabled) {
      $('#huaizhu_use_independent_api_checkbox').prop('checked', true);
      $('#huaizhu_api_config_fields').css('display', 'block');
      $('#huaizhu_api_platform_select').val(config.platform || 'openai');
      $('#huaizhu_api_url_input').val(config.apiUrl || '');
      $('#huaizhu_api_key_input').val(config.apiKey || '');
      if (config.model) {
        $('#huaizhu_model_select_row').css('display', 'block');
        $('#huaizhu_api_model_select').html('<option value="' + config.model + '">' + config.model + '</option>');
      }
    } else {
      $('#huaizhu_use_independent_api_checkbox').prop('checked', false);
      $('#huaizhu_api_config_fields').css('display', 'none');
    }
  }

  // 独立API开关：控制配置区域的显示/隐藏
  $('#huaizhu_use_independent_api_checkbox').on('change', function () {
    $('#huaizhu_api_config_fields').css('display', this.checked ? 'block' : 'none');
    setTimeout(() => positionPanelNearBall(modalBox), 0);
  });

  // 密钥显示/隐藏切换
  $('#huaizhu_toggle_key_visibility').on('click', () => {
    const input = document.getElementById('huaizhu_api_key_input');
    input.type = input.type === 'password' ? 'text' : 'password';
  });

  // 点击"获取模型列表"
  $('#huaizhu_fetch_models_btn').on('click', async () => {
    const platform = $('#huaizhu_api_platform_select').val();
    const apiUrl = $('#huaizhu_api_url_input').val().trim();
    const apiKey = $('#huaizhu_api_key_input').val().trim();
    const statusText = $('#huaizhu_api_status_text');

    if (!apiUrl || !apiKey) {
      statusText.text('请先填写API地址和密钥').css('color', '#d9534f');
      return;
    }

    statusText.text('正在获取模型列表...').css('color', 'inherit');
    $('#huaizhu_fetch_models_btn').prop('disabled', true);

    try {
      const models = await fetchModelList(platform, apiUrl, apiKey);
      if (models.length === 0) {
        statusText.text('未获取到任何模型，请检查密钥权限').css('color', '#d9534f');
      } else {
        const optionsHtml = models.map((m) => '<option value="' + m + '">' + m + '</option>').join('');
        $('#huaizhu_api_model_select').html(optionsHtml);
        $('#huaizhu_model_select_row').css('display', 'block');
        statusText.text('成功获取 ' + models.length + ' 个模型').css('color', '#5cb85c');
      }
      setTimeout(() => positionPanelNearBall(modalBox), 0);
    } catch (error) {
      statusText.text('获取失败：' + error.message).css('color', '#d9534f');
    } finally {
      $('#huaizhu_fetch_models_btn').prop('disabled', false);
    }
  });

  // 保存设置
  $('#huaizhu_api_save_btn').on('click', () => {
    const enabled = $('#huaizhu_use_independent_api_checkbox').prop('checked');

    if (!enabled) {
      saveApiConfigToStorage({ enabled: false });
      alert('已设置为使用酒馆当前角色卡的API');
      return;
    }

    const platform = $('#huaizhu_api_platform_select').val();
    const apiUrl = $('#huaizhu_api_url_input').val().trim();
    const apiKey = $('#huaizhu_api_key_input').val().trim();
    const model = $('#huaizhu_api_model_select').val();

    if (!apiUrl || !apiKey || !model) {
      alert('请完整填写API地址、密钥，并获取并选择一个模型后再保存');
      return;
    }

    saveApiConfigToStorage({ enabled: true, platform, apiUrl, apiKey, model });
    alert('API设置已保存');
  });

  // 关闭输入面板（取消按钮 / 右上角×）
  function closeInputPanel() {
    modalOverlay.style.display = 'none';
    // 重置回"生成"标签页，避免下次打开还停在别的标签
    $('.huaizhu-tab-btn').removeClass('huaizhu-tab-active');
    $('.huaizhu-tab-btn[data-tab="generate"]').addClass('huaizhu-tab-active');
    $('.huaizhu-tab-page').css('display', 'none');
    $('#huaizhu_tab_generate').css('display', 'block');
  }
  $('#huaizhu_modal_cancel').on('click', closeInputPanel);
  $('#huaizhu_modal_close_x').on('click', closeInputPanel);

  // 结果窗口关闭
  $('#huaizhu_result_close').on('click', () => {
    $('#huaizhu_result_overlay').css('display', 'none');
  });
  $('#huaizhu_result_overlay').on('click', function (e) {
    if (e.target === this) {
      $(this).css('display', 'none');
    }
  });

  // ===================================================================
  // 续写 / 修改 / 保存：对当前结果窗口展示的内容进行操作
  // ===================================================================

  // 保存到仓库：把当前结果窗口展示的内容，真正写入"最近生成"
  // 如果这条结果之前已经保存过（比如续写之后），则更新已有记录，而不是重复新增
  $('#huaizhu_result_save_to_recent_btn').on('click', () => {
    if (!currentResultText) return;

    if (currentResultRecordId) {
      // 已经保存过，更新内容
      const list = loadRecentList();
      const idx = list.findIndex((item) => item.id === currentResultRecordId);
      if (idx !== -1) {
        list[idx].content = currentResultText;
        saveRecentList(list);
      }
    } else {
      // 第一次保存，新建记录
      const newId = addToRecentList(currentResultInstruction, currentResultText, currentResultIsIndependent);
      currentResultRecordId = newId;
    }

    const btn = $('#huaizhu_result_save_to_recent_btn');
    const originalText = btn.text();
    btn.text('已保存！');
    setTimeout(() => btn.text(originalText), 1200);
  });

  // 续写：根据是否独立剧场，决定续写依据，结果追加在原内容后面
  $('#huaizhu_result_continue_btn').on('click', async () => {
    if (!currentResultText) return;

    $('#huaizhu_result_continue_btn').prop('disabled', true).text('续写中...');

    try {
      const context = SillyTavern.getContext();

      let extraContext = '';
      if (!currentResultIsIndependent) {
        // 非独立剧场：重新读取最新的正文聊天记录，让续写跟上正文进度
        const recentCount = 6;
        const chatArray = context.chat;
        const recentMessages = chatArray.slice(-recentCount);
        let historyText = '';
        for (const msg of recentMessages) {
          const speaker = msg.is_user ? '用户' : msg.name;
          historyText += speaker + '：' + msg.mes + '\n';
        }
        extraContext = '\n【正文最新进展，续写时请与此保持衔接】\n' + historyText + '\n';
      }

      const continuePrompt =
        '（以下是之前已经生成的一段小剧场内容，请在其基础上接着往下续写，' +
        '只输出续写的新增部分，不要重复已有内容，风格和人设需保持一致。）\n\n' +
        '【已有内容】\n' + currentResultText + '\n' +
        extraContext +
        '\n【续写要求】\n' + (currentResultInstruction || '请合理地继续发展剧情') +
        (wantStyle ? '\n（【强制要求】原内容是HTML美化格式，续写部分也必须用相同风格的HTML代码输出，不允许退化为纯文字。）' : '');

      const presetText = getActivePresetText();
      const finalContinuePrompt = presetText ? (presetText + '\n\n' + continuePrompt) : continuePrompt;

      const apiConfig = loadApiConfig();
      let continuation;
      if (apiConfig && apiConfig.enabled) {
        continuation = await callIndependentApi(apiConfig, finalContinuePrompt);
      } else {
        continuation = await context.generateRaw({ prompt: finalContinuePrompt });
      }

      continuation = continuation.replace(/```html\s*/gi, '').replace(/```\s*$/g, '').trim();

      const combined = currentResultText + '\n\n' + continuation;
      showResult(combined);

    } catch (error) {
      alert('续写失败：' + error.message);
    } finally {
      $('#huaizhu_result_continue_btn').prop('disabled', false).text('续写');
    }
  });

  // 修改：把结果展示区切换为可编辑的文本框
  $('#huaizhu_result_edit_btn').on('click', () => {
    const contentBox = document.getElementById('huaizhu_result_content');
    const editArea = document.getElementById('huaizhu_result_edit_textarea');

    editArea.value = currentResultText;
    $(contentBox).css('display', 'none');
    $(editArea).css('display', 'block');
    $('#huaizhu_result_edit_btn').css('display', 'none');
    $('#huaizhu_result_continue_btn').css('display', 'none');
    $('#huaizhu_result_save_edit_btn').css('display', 'inline-block');

    setTimeout(() => positionPanelNearBall(document.querySelector('.huaizhu-result-box')), 0);
  });

  // 保存：把编辑框里的内容存回去，并真正写入"最近生成"那条记录
  $('#huaizhu_result_save_edit_btn').on('click', () => {
    const editArea = document.getElementById('huaizhu_result_edit_textarea');
    const newText = editArea.value;

    currentResultText = newText;

    // 如果这次结果对应着某条"最近生成"记录，真正更新存储
    if (currentResultRecordId) {
      const list = loadRecentList();
      const idx = list.findIndex((item) => item.id === currentResultRecordId);
      if (idx !== -1) {
        list[idx].content = newText;
        saveRecentList(list);
      }
    }

    // 退出编辑状态，重新展示
    $('#huaizhu_result_edit_btn').css('display', 'inline-block');
    $('#huaizhu_result_continue_btn').css('display', 'inline-block');
    $('#huaizhu_result_save_edit_btn').css('display', 'none');

    showResult(newText);
  });

  function looksLikeHtml(text) {
    const htmlTagPattern = /<\s*(div|span|p|style|table|img|br|h[1-6])[\s>]/i;
    return htmlTagPattern.test(text);
  }

  function escapeAndFormatPlainText(text) {
    const escaped = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    return escaped.replace(/\n/g, '<br>');
  }

  // 清理一段CSS文本里的危险规则（position:fixed/absolute、vh/vw单位的尺寸等）
  function sanitizeCssText(cssText) {
    let cleaned = cssText;
    // 把 position: fixed/absolute/sticky 统一替换成 relative
    cleaned = cleaned.replace(/position\s*:\s*(fixed|absolute|sticky)/gi, 'position: relative');
    // 去掉用vh/vw单位写的height/width/min-height等（防止内容被强行撑满屏幕）
    cleaned = cleaned.replace(/(height|min-height|max-height|width|min-width|max-width)\s*:\s*[\d.]+\s*(vh|vw)\s*;?/gi, '');
    // 去掉z-index，避免叠在我们自己的UI上层
    cleaned = cleaned.replace(/z-index\s*:\s*[^;]+;?/gi, '');
    return cleaned;
  }

  // 清理AI生成HTML中可能"逃出"容器、影响整个页面布局的危险样式
  // 包括：行内style属性 + <style>标签内部的CSS规则
  function sanitizeAiHtml(html) {
    const wrapper = document.createElement('div');
    wrapper.innerHTML = html;

    // 先处理所有 <style> 标签：清理里面的危险CSS规则文本
    const styleTags = wrapper.querySelectorAll('style');
    styleTags.forEach((styleTag) => {
      styleTag.textContent = sanitizeCssText(styleTag.textContent);
    });

    // 再处理所有元素的行内style属性
    const allElements = wrapper.querySelectorAll('*');
    allElements.forEach((el) => {
      if (el.style && el.tagName !== 'STYLE') {
        if (el.style.position === 'fixed' || el.style.position === 'absolute' || el.style.position === 'sticky') {
          el.style.position = 'relative';
        }
        el.style.removeProperty('top');
        el.style.removeProperty('left');
        el.style.removeProperty('right');
        el.style.removeProperty('bottom');
        el.style.removeProperty('z-index');
        if (el.style.height && /vh|vw/.test(el.style.height)) {
          el.style.removeProperty('height');
        }
        if (el.style.width && /vh|vw/.test(el.style.width)) {
          el.style.removeProperty('width');
        }
        if (el.style.minHeight && /vh/.test(el.style.minHeight)) {
          el.style.removeProperty('min-height');
        }
      }
    });

    return wrapper.innerHTML;
  }

  // 用Shadow DOM彻底隔离AI生成内容的样式作用域：
  // 即使清理后仍有遗漏的CSS规则，也绝对不可能逃出这个隔离边界影响外部页面
  function renderIntoShadowContainer(containerEl, htmlContent) {
    containerEl.innerHTML = '';
    const shadowHost = document.createElement('div');
    containerEl.appendChild(shadowHost);
    const shadowRoot = shadowHost.attachShadow({ mode: 'open' });

    // Shadow DOM内部默认不继承外部样式，这里补一份基础样式保证文字可读
    // 同时强制约束所有子元素，防止AI写的vh/fixed等样式把容器撑爆（这层防护在Shadow内部生效，外部CSS无法穿透到这里，必须在此补一份）
    const baseStyle = document.createElement('style');
    baseStyle.textContent = `
      :host { display: block; color: #333; font-size: 14px; line-height: 1.6; word-wrap: break-word; }
      * {
        max-width: 100% !important;
        height: auto !important;
        max-height: none !important;
        min-height: 0 !important;
        position: static !important;
        box-sizing: border-box !important;
      }
    `;
    shadowRoot.appendChild(baseStyle);

    const contentWrapper = document.createElement('div');
    contentWrapper.innerHTML = htmlContent;
    shadowRoot.appendChild(contentWrapper);
  }

  function showResult(resultText, isError) {
    const contentBox = document.getElementById('huaizhu_result_content');

    let safeHtml;
    if (looksLikeHtml(resultText)) {
      safeHtml = sanitizeAiHtml(resultText);
    } else {
      safeHtml = escapeAndFormatPlainText(resultText);
    }

    renderIntoShadowContainer(contentBox, safeHtml);

    currentResultText = resultText;

    // 错误信息不需要续写/修改/保存这些操作按钮
    $('.huaizhu-result-footer-buttons').css('display', isError ? 'none' : 'flex');

    // 退出可能残留的编辑状态
    $('#huaizhu_result_edit_textarea').css('display', 'none');
    $(contentBox).css('display', 'block');
    $('#huaizhu_result_edit_btn').text('修改').css('display', isError ? 'none' : 'inline-block');
    $('#huaizhu_result_save_edit_btn').css('display', 'none');

    openResultPanel();
  }

  // 打开结果面板：复用"贴着悬浮球定位"这套已验证可靠的逻辑，不再单独发明居中方案
  function openResultPanel() {
    const resultOverlay = document.getElementById('huaizhu_result_overlay');
    const resultBox = resultOverlay.querySelector('.huaizhu-result-box');

    resultOverlay.style.display = 'flex';
    resultOverlay.style.background = 'transparent';
    resultOverlay.style.alignItems = 'flex-start';
    resultOverlay.style.justifyContent = 'flex-start';

    setTimeout(() => positionPanelNearBall(resultBox), 0);
  }

  function showLoading() {
    const contentBox = $('#huaizhu_result_content');
    contentBox.html('<div class="huaizhu-loading"><span class="huaizhu-loading-spinner"></span>生成中，请稍候...</div>');
    openResultPanel();
  }

  $('#huaizhu_modal_confirm').on('click', async () => {

    const userInstruction = $('#huaizhu_instruction_input').val().trim();
    if (!userInstruction) {
      alert('请输入这次想要的小剧场内容描述');
      return;
    }

    const limitWords = $('#huaizhu_limit_words_checkbox').prop('checked');
    const wordCount = $('#huaizhu_wordcount_input').val();
    const styleDetail = $('#huaizhu_style_detail_input').val().trim();

    closeInputPanel();

    // 立刻显示"生成中"的结果窗口，让用户知道正在处理
    showLoading();

    try {
      const context = SillyTavern.getContext();

      let characterInfo = '';
      if (context.characterId !== undefined && context.characters[context.characterId]) {
        const card = context.characters[context.characterId];
        characterInfo =
          '角色名：' + (card.name || '') + '\n' +
          '角色设定：' + (card.description || '') + '\n' +
          '性格：' + (card.personality || '') + '\n';
      }

      const recentCount = 6;
      const chatArray = context.chat;
      const recentMessages = chatArray.slice(-recentCount);
      let historyText = '';
      for (const msg of recentMessages) {
        const speaker = msg.is_user ? '用户' : msg.name;
        historyText += speaker + '：' + msg.mes + '\n';
      }

      let fixedRules =
        '（注意：以下是一段独立的小剧场/番外生成请求，与主线剧情时间线无关，不计入正式记忆，不需要更新状态栏。' +
        '请严格根据下方提供的角色设定行事，禁止偏离人设（不得OOC）。）\n\n';

      let styleRule = '';
      if (wantStyle) {
        if (styleDetail) {
          styleRule =
            '\n（【强制样式要求，必须严格执行】：本次内容必须以HTML代码形式输出美化效果，具体风格为："' + styleDetail + '"。' +
            '无论本次内容是对话、独白、社交媒体帖子、新闻、聊天记录还是其他任何形式，都必须用带样式的HTML容器包裹呈现，' +
            '绝对不允许只输出未经HTML包装的纯文字段落。请直接输出完整的HTML代码（可包含inline style），不要用markdown代码块包裹，不要添加任何解释说明文字。）\n';
        } else {
          styleRule =
            '\n（【强制样式要求，必须严格执行】：本次内容必须以HTML代码形式输出美化效果，风格由你根据内容自行决定（例如仿聊天软件、仿日记、仿信纸、仿社交媒体界面等）。' +
            '无论本次内容是对话、独白、社交媒体帖子、新闻、聊天记录还是其他任何形式，都必须用带样式的HTML容器包裹呈现，' +
            '绝对不允许只输出未经HTML包装的纯文字段落。请直接输出完整的HTML代码（可包含inline style），不要用markdown代码块包裹，不要添加任何解释说明文字。）\n';
        }
      } else {
        styleRule = '\n（样式要求：请只输出纯文字内容，不需要任何HTML标签或样式。）\n';
      }

      let wordCountRule = '';
      if (limitWords && wordCount) {
        wordCountRule = '\n（字数要求：请将生成内容控制在约' + wordCount + '字左右。）';
      }

      const prompt =
        fixedRules +
        '【角色设定参考】\n' + characterInfo + '\n' +
        '【最近剧情参考】\n' + historyText + '\n' +
        '【本次小剧场要求】\n' + userInstruction +
        styleRule +
        wordCountRule;

      // 拼接当前勾选的预设内容（不管是否使用独立API，都会生效）
      const presetText = getActivePresetText();
      const finalPrompt = presetText ? (presetText + '\n\n' + prompt) : prompt;

      // 检查是否启用了独立API，决定走哪条生成路径
      const apiConfig = loadApiConfig();
      let result;
      if (apiConfig && apiConfig.enabled) {
        result = await callIndependentApi(apiConfig, finalPrompt);
      } else {
        result = await context.generateRaw({ prompt: finalPrompt });
      }

      result = result.replace(/```html\s*/gi, '').replace(/```\s*$/g, '').trim();

      // 不再自动存入仓库，只记录这次生成的元数据，等用户点"保存到仓库"才真正写入
      currentResultRecordId = null; // 尚未保存，还没有对应的仓库记录id
      currentResultIsIndependent = isIndependentTheater;
      currentResultInstruction = userInstruction;

      showResult(result);

      $('#huaizhu_instruction_input').val('');

    } catch (error) {
      showResult('生成失败，错误信息：' + error.message, true);
    }
  });

});
