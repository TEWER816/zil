import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { User, Quote, Save, Trash2, Sparkles, Upload, Download, CheckCircle2, AlertCircle, Palette, Image as ImageIcon, RotateCcw, Key, Eye, EyeOff, ExternalLink } from 'lucide-react';
import { useSettingsStore } from '@/store/settingsStore';
import { Button } from '@/components/common/Button';
import { Modal } from '@/components/common/Modal';
import { ProgressRing } from '@/components/common/ProgressRing';

type FeedbackStatus = 'idle' | 'success' | 'error';

// 压缩图片：限制最大尺寸 + 质量，避免 base64 撑爆 localStorage
const compressImage = (file: File, maxSize = 1200, quality = 0.85): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
        if (width > maxSize || height > maxSize) {
          const ratio = Math.min(maxSize / width, maxSize / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(ev.target?.result as string);
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        // PNG 保留格式（保留透明通道），其他统一 JPEG
        const isPng = file.type === 'image/png';
        try {
          resolve(canvas.toDataURL(isPng ? 'image/png' : 'image/jpeg', isPng ? undefined : quality));
        } catch {
          resolve(ev.target?.result as string);
        }
      };
      img.onerror = () => reject(new Error('图片加载失败'));
      img.src = ev.target?.result as string;
    };
    reader.onerror = () => reject(new Error('文件读取失败'));
    reader.readAsDataURL(file);
  });
};

// 主色预设
const primaryPresets = [
  { color: '#5DCCC5', name: '薄荷青' },
  { color: '#6366F1', name: '靛蓝' },
  { color: '#8B5CF6', name: '紫罗兰' },
  { color: '#EC4899', name: '玫瑰粉' },
  { color: '#F59E0B', name: '琥珀橙' },
  { color: '#10B981', name: '翡翠绿' },
  { color: '#EF4444', name: '活力红' },
  { color: '#06B6D4', name: '青蓝' },
];

export function Settings() {
  const {
    userName, showMotivationalQuotes, setUserName, setShowMotivationalQuotes,
    customPrimaryColor, setCustomPrimaryColor,
    backgroundImage, setBackgroundImage,
    bgOverlayOpacity, setBgOverlayOpacity,
    bgBlur, setBgBlur,
    homeProgressImage, setHomeProgressImage,
    glmApiKey, setGlmApiKey,
  } = useSettingsStore();
  const [tempName, setTempName] = useState(userName);
  const [saved, setSaved] = useState(false);
  const [clearConfirm, setClearConfirm] = useState(false);
  const [clearConfirmInput, setClearConfirmInput] = useState('');
  const [importConfirm, setImportConfirm] = useState(false);
  const [pendingImportData, setPendingImportData] = useState<Record<string, unknown> | null>(null);
  const [feedback, setFeedback] = useState<FeedbackStatus>('idle');
  const [feedbackMsg, setFeedbackMsg] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [tempApiKey, setTempApiKey] = useState(glmApiKey);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const bgInputRef = useRef<HTMLInputElement>(null);
  const progressImgInputRef = useRef<HTMLInputElement>(null);

  const showFeedback = (status: FeedbackStatus, msg: string) => {
    setFeedback(status);
    setFeedbackMsg(msg);
    setTimeout(() => setFeedback('idle'), 3000);
  };

  const handleSaveName = () => {
    setUserName(tempName);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleClearData = () => {
    // 清除所有本地数据：习惯、专注、预设、个性化设置（含自定义图片、主题色等）
    localStorage.removeItem('zil-habits');
    localStorage.removeItem('zil-focus');
    localStorage.removeItem('zil-presets');
    localStorage.removeItem('zil-settings');
    setClearConfirmInput('');
    window.location.reload();
  };

  // 导出数据：将所有 localStorage 数据打包为 JSON 文件下载
  const handleExport = () => {
    const keys = ['zil-habits', 'zil-focus', 'zil-settings', 'zil-presets'];
    const data: Record<string, string> = {};
    keys.forEach((k) => {
      const v = localStorage.getItem(k);
      if (v !== null) data[k] = v;
    });
    const payload = {
      app: 'Zil Desktop',
      version: 1,
      exportedAt: new Date().toISOString(),
      data,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const ts = new Date().toISOString().slice(0, 10);
    a.href = url;
    a.download = `zil-backup-${ts}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showFeedback('success', '数据已导出为本地文件');
  };

  // 选择导入文件
  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  // 读取导入文件
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const parsed = JSON.parse(ev.target?.result as string);
        if (!parsed.data || typeof parsed.data !== 'object') {
          showFeedback('error', '文件格式不正确');
          return;
        }
        setPendingImportData(parsed.data as Record<string, unknown>);
        setImportConfirm(true);
      } catch {
        showFeedback('error', '无法解析文件，请选择有效的备份文件');
      }
    };
    reader.onerror = () => showFeedback('error', '读取文件失败');
    reader.readAsText(file);
    // 重置 input 以便重复选择同一文件
    e.target.value = '';
  };

  // 确认导入
  const handleConfirmImport = () => {
    if (!pendingImportData) return;
    Object.entries(pendingImportData).forEach(([k, v]) => {
      localStorage.setItem(k, typeof v === 'string' ? v : JSON.stringify(v));
    });
    setImportConfirm(false);
    setPendingImportData(null);
    showFeedback('success', '数据已导入，正在刷新…');
    setTimeout(() => window.location.reload(), 600);
  };

  // 上传背景图（压缩后存储）
  const handleBgUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      showFeedback('error', '图片不能超过 10MB');
      e.target.value = '';
      return;
    }
    try {
      const compressed = await compressImage(file, 1600, 0.85);
      setBackgroundImage(compressed);
      showFeedback('success', '背景已应用');
    } catch {
      showFeedback('error', '图片处理失败');
    }
    e.target.value = '';
  };

  // 上传主页进度图（压缩后存储，尺寸小一些）
  const handleProgressImgUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      showFeedback('error', '图片不能超过 10MB');
      e.target.value = '';
      return;
    }
    try {
      const compressed = await compressImage(file, 480, 0.9);
      setHomeProgressImage(compressed);
      showFeedback('success', '主页进度图已应用');
    } catch {
      showFeedback('error', '图片处理失败');
    }
    e.target.value = '';
  };

  // 重置个性化设置
  const handleResetCustomization = () => {
    setCustomPrimaryColor(null);
    setBackgroundImage(null);
    setBgOverlayOpacity(70);
    setBgBlur(0);
    setHomeProgressImage(null);
    showFeedback('success', '已恢复默认');
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="space-y-5 md:space-y-6 max-w-2xl"
    >
      {/* 页面标题 */}
      <div className="mb-2">
        <h2 className="text-2xl md:text-3xl font-display font-bold text-dark-muted">设置</h2>
        <p className="text-sm text-dark-muted/60 mt-1">个性化你的 Zil 体验</p>
      </div>

      {/* 个人设置 */}
      <motion.section
        initial={{ y: 12, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.05 }}
        className="card"
      >
        <div className="flex items-center gap-3 mb-5">
          <div className="w-9 h-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
            <User className="w-[18px] h-[18px] text-primary" />
          </div>
          <div>
            <h3 className="font-display text-lg text-dark-muted">个人设置</h3>
            <p className="text-xs text-dark-muted/50">让 Zil 知道如何称呼你</p>
          </div>
        </div>

        <div>
          <label className="text-xs text-dark-muted/60 mb-2 block tracking-wider uppercase">昵称</label>
          <div className="flex gap-3">
            <input
              type="text"
              value={tempName}
              onChange={(e) => setTempName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSaveName();
              }}
              placeholder="输入你的昵称..."
              className="input flex-1"
            />
            <Button onClick={handleSaveName}>
              <Save className="w-4 h-4" />
            </Button>
          </div>
          {saved && (
            <motion.p
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-xs text-secondary mt-2 flex items-center gap-1"
            >
              <Sparkles className="w-3 h-3" />
              已保存
            </motion.p>
          )}
        </div>
      </motion.section>

      {/* 显示设置 */}
      <motion.section
        initial={{ y: 12, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="card"
      >
        <div className="flex items-center gap-3 mb-5">
          <div className="w-9 h-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
            <Quote className="w-[18px] h-[18px] text-primary" />
          </div>
          <div>
            <h3 className="font-display text-lg text-dark-muted">显示设置</h3>
            <p className="text-xs text-dark-muted/50">控制界面显示内容</p>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <p className="text-dark-muted text-sm">显示激励语录</p>
            <p className="text-xs text-dark-muted/50 mt-0.5">在首页底部展示温暖语录</p>
          </div>
          <button
            type="button"
            onClick={() => setShowMotivationalQuotes(!showMotivationalQuotes)}
            className={`w-11 h-6 rounded-full relative transition-colors ${
              showMotivationalQuotes
                ? 'bg-primary'
                : 'bg-white/10 border border-white/10'
            }`}
          >
            <motion.div
              animate={showMotivationalQuotes ? { x: 22 } : { x: 2 }}
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              className="w-4 h-4 rounded-full bg-white absolute top-1"
            />
          </button>
        </div>
      </motion.section>

      {/* 个性化设置：自定义主色 + 背景图 */}
      <motion.section
        initial={{ y: 12, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.17 }}
        className="card"
      >
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
              <Palette className="w-[18px] h-[18px] text-primary" />
            </div>
            <div>
              <h3 className="font-display text-lg text-dark-muted">个性化</h3>
              <p className="text-xs text-dark-muted/50">自定义主题色与背景图</p>
            </div>
          </div>
          {(customPrimaryColor || backgroundImage || homeProgressImage) && (
            <button
              type="button"
              onClick={handleResetCustomization}
              className="flex items-center gap-1.5 text-xs text-dark-muted/60 hover:text-danger transition-colors px-2.5 py-1.5 rounded-lg hover:bg-danger/5"
            >
              <RotateCcw className="w-3 h-3" />
              重置
            </button>
          )}
        </div>

        {/* 自定义主色 */}
        <div className="mb-6">
          <label className="text-xs text-dark-muted/60 mb-3 block tracking-wider uppercase">主题色</label>
          {/* 预设色板 */}
          <div className="flex flex-wrap gap-2.5 mb-3">
            {primaryPresets.map(({ color, name }) => {
              const isActive = (customPrimaryColor ?? '#5DCCC5') === color;
              return (
                <button
                  key={color}
                  type="button"
                  onClick={() => setCustomPrimaryColor(color === '#5DCCC5' ? null : color)}
                  title={name}
                  className={`w-9 h-9 rounded-xl transition-all relative ${isActive ? 'ring-2 ring-offset-2 ring-offset-dark-bg ring-white/40 scale-110' : 'hover:scale-105'}`}
                  style={{ backgroundColor: color }}
                >
                  {isActive && (
                    <CheckCircle2 className="w-4 h-4 text-white absolute inset-0 m-auto drop-shadow" />
                  )}
                </button>
              );
            })}
          </div>
          {/* 自定义取色器 */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <input
                type="color"
                value={customPrimaryColor ?? '#5DCCC5'}
                onChange={(e) => setCustomPrimaryColor(e.target.value)}
                className="w-10 h-10 rounded-xl cursor-pointer border border-white/10 bg-transparent"
                style={{ appearance: 'none', padding: 0 }}
              />
            </div>
            <div className="flex-1">
              <p className="text-sm text-dark-muted">
                {customPrimaryColor ? '自定义颜色' : '默认薄荷青'}
              </p>
              <p className="text-xs text-dark-muted/50">
                {customPrimaryColor ?? '#5DCCC5'}
                {customPrimaryColor && (
                  <button
                    type="button"
                    onClick={() => setCustomPrimaryColor(null)}
                    className="ml-2 text-primary hover:underline"
                  >
                    恢复默认
                  </button>
                )}
              </p>
            </div>
          </div>
        </div>

        {/* 分割线 */}
        <div className="border-t border-white/5 my-5" />

        {/* 自定义背景图 */}
        <div>
          <label className="text-xs text-dark-muted/60 mb-3 block tracking-wider uppercase">背景图</label>

          {backgroundImage ? (
            <div className="space-y-4">
              {/* 预览 */}
              <div
                className="h-28 rounded-xl border border-white/10 overflow-hidden bg-cover bg-center relative"
                style={{ backgroundImage: `url(${backgroundImage})` }}
              >
                <button
                  type="button"
                  onClick={() => setBackgroundImage(null)}
                  className="absolute top-2 right-2 w-7 h-7 rounded-lg bg-black/50 backdrop-blur-sm flex items-center justify-center text-white/80 hover:text-danger hover:bg-black/70 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* 遮罩透明度滑块 */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs text-dark-muted/70">背景浓度</span>
                  <span className="text-xs text-dark-muted/50">{100 - bgOverlayOpacity}%</span>
                </div>
                <input
                  type="range"
                  min={20}
                  max={95}
                  value={bgOverlayOpacity}
                  onChange={(e) => setBgOverlayOpacity(Number(e.target.value))}
                  className="w-full accent-primary h-1.5"
                />
                <p className="text-[11px] text-dark-muted/40 mt-1">数值越小背景图越清晰</p>
              </div>

              {/* 模糊度滑块 */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs text-dark-muted/70">模糊度</span>
                  <span className="text-xs text-dark-muted/50">{bgBlur}px</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={20}
                  value={bgBlur}
                  onChange={(e) => setBgBlur(Number(e.target.value))}
                  className="w-full accent-primary h-1.5"
                />
              </div>

              {/* 换一张 */}
              <Button variant="secondary" onClick={() => bgInputRef.current?.click()} className="w-full">
                <Upload className="w-4 h-4" />
                更换图片
              </Button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => bgInputRef.current?.click()}
              className="w-full py-8 rounded-xl border border-dashed border-white/15 hover:border-primary/40 hover:bg-primary/5 transition-colors flex flex-col items-center gap-2 text-dark-muted/50 hover:text-primary"
            >
              <ImageIcon className="w-7 h-7" />
              <span className="text-sm">点击上传背景图</span>
              <span className="text-[11px] text-dark-muted/40">支持 JPG / PNG，最大 10MB，自动压缩</span>
            </button>
          )}
          <input
            ref={bgInputRef}
            type="file"
            accept="image/*"
            onChange={handleBgUpload}
            className="hidden"
          />
        </div>

        {/* 分割线 */}
        <div className="border-t border-white/5 my-5" />

        {/* 主页进度图 */}
        <div>
          <label className="text-xs text-dark-muted/60 mb-3 block tracking-wider uppercase">主页进度图</label>

          {homeProgressImage ? (
            <div className="space-y-4">
              {/* 圆形预览（与主页进度环一致） */}
              <div className="flex items-center gap-4">
                <div className="relative shrink-0">
                  <ProgressRing
                    progress={100}
                    size={92}
                    strokeWidth={6}
                    color="#5DCCC5"
                    glow={false}
                  >
                    <img
                      src={homeProgressImage}
                      alt="主页进度图预览"
                      className="rounded-full object-cover ring-1 ring-white/10"
                      style={{ width: 72, height: 72 }}
                    />
                  </ProgressRing>
                  <button
                    type="button"
                    onClick={() => setHomeProgressImage(null)}
                    className="absolute top-0 right-0 w-6 h-6 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center text-white/80 hover:text-danger hover:bg-black/80 transition-colors border border-white/10"
                    title="清除"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
                <div className="min-w-0">
                  <p className="text-sm text-dark-muted">已设置主页进度图</p>
                  <p className="text-xs text-dark-muted/50 mt-0.5">显示在主页右上角进度环中央</p>
                </div>
              </div>

              {/* 换一张 */}
              <Button variant="secondary" onClick={() => progressImgInputRef.current?.click()} className="w-full">
                <Upload className="w-4 h-4" />
                更换图片
              </Button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => progressImgInputRef.current?.click()}
              className="w-full py-6 rounded-xl border border-dashed border-white/15 hover:border-primary/40 hover:bg-primary/5 transition-colors flex items-center gap-3 text-dark-muted/50 hover:text-primary"
            >
              <ImageIcon className="w-6 h-6 shrink-0" />
              <div className="text-left">
                <p className="text-sm">上传主页进度图</p>
                <p className="text-[11px] text-dark-muted/40 mt-0.5">圆形裁剪显示在进度环中央，最大 10MB</p>
              </div>
            </button>
          )}
          <input
            ref={progressImgInputRef}
            type="file"
            accept="image/*"
            onChange={handleProgressImgUpload}
            className="hidden"
          />
        </div>
      </motion.section>

      {/* AI 设置：GLM API Key */}
      <motion.section
        initial={{ y: 12, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.18 }}
        className="card"
      >
        <div className="flex items-center gap-3 mb-5">
          <div className="w-9 h-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
            <Key className="w-[18px] h-[18px] text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-display text-lg text-dark-muted">AI 智能设置</h3>
            <p className="text-xs text-dark-muted/50">配置智谱 GLM-4-Flash，启用 AI 推荐习惯</p>
          </div>
        </div>

        <div>
          <label className="text-xs text-dark-muted/60 mb-2 block tracking-wider uppercase">智谱 API Key</label>
          <div className="flex gap-3">
            <div className="relative flex-1">
              <input
                type={showApiKey ? 'text' : 'password'}
                value={tempApiKey}
                onChange={(e) => setTempApiKey(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    setGlmApiKey(tempApiKey.trim());
                    showFeedback('success', 'API Key 已保存');
                  }
                }}
                placeholder="在此粘贴智谱 API Key..."
                className="input w-full pr-10"
                autoComplete="off"
                spellCheck={false}
              />
              <button
                type="button"
                onClick={() => setShowApiKey(!showApiKey)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-dark-muted/40 hover:text-dark-muted/70 transition-colors"
                title={showApiKey ? '隐藏' : '显示'}
              >
                {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <Button onClick={() => {
              setGlmApiKey(tempApiKey.trim());
              showFeedback('success', 'API Key 已保存');
            }}>
              <Save className="w-4 h-4" />
            </Button>
          </div>
          <div className="mt-3 flex items-start gap-2">
            <Sparkles className="w-3 h-3 text-primary/60 mt-0.5 shrink-0" />
            <p className="text-xs text-dark-muted/50 leading-relaxed">
              前往{' '}
              <a
                href="https://open.bigmodel.cn/apikey/platform"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline inline-flex items-center gap-0.5"
              >
                智谱开放平台
                <ExternalLink className="w-3 h-3" />
              </a>
              {' '}创建 API Key，GLM-4-Flash 模型免费。配置后在「习惯」页可使用 AI 推荐功能。
            </p>
          </div>
          {glmApiKey && (
            <div className="mt-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-secondary/10 border border-secondary/20">
              <CheckCircle2 className="w-3 h-3 text-secondary" />
              <span className="text-xs text-secondary">已配置</span>
            </div>
          )}
        </div>
      </motion.section>

      {/* 数据备份：导出 / 导入 */}
      <motion.section
        initial={{ y: 12, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.18 }}
        className="card"
      >
        <div className="flex items-center gap-3 mb-5">
          <div className="w-9 h-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
            <Download className="w-[18px] h-[18px] text-primary" />
          </div>
          <div>
            <h3 className="font-display text-lg text-dark-muted">数据备份</h3>
            <p className="text-xs text-dark-muted/50">导出 / 导入本地数据，便于备份与迁移</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <Button variant="secondary" onClick={handleExport} className="flex-1">
            <Upload className="w-4 h-4" />
            导出数据
          </Button>
          <Button variant="secondary" onClick={handleImportClick} className="flex-1">
            <Download className="w-4 h-4" />
            导入数据
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json,.json"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>

        {/* 反馈提示 */}
        {feedback !== 'idle' && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className={`mt-4 text-xs flex items-center gap-1.5 ${
              feedback === 'success' ? 'text-secondary' : 'text-red-400'
            }`}
          >
            {feedback === 'success'
              ? <CheckCircle2 className="w-3 h-3" />
              : <AlertCircle className="w-3 h-3" />
            }
            <span>{feedbackMsg}</span>
          </motion.div>
        )}
      </motion.section>

      {/* 数据管理 */}
      <motion.section
        initial={{ y: 12, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="card"
      >
        <div className="flex items-center gap-3 mb-5">
          <div className="w-9 h-9 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center">
            <Trash2 className="w-[18px] h-[18px] text-red-400" />
          </div>
          <div>
            <h3 className="font-display text-lg text-dark-muted">数据管理</h3>
            <p className="text-xs text-dark-muted/50">管理你的本地数据</p>
          </div>
        </div>

        <p className="text-sm text-dark-muted/70 mb-4">
          清除所有习惯、专注数据及个性化设置（含自定义图片、主题色等），此操作不可恢复。
        </p>
        <Button variant="danger" onClick={() => setClearConfirm(true)}>
          <Trash2 className="w-4 h-4" />
          清除所有数据
        </Button>
      </motion.section>

      {/* 关于 */}
      <div className="text-center pt-2 pb-2">
        <div className="inline-flex items-center gap-2">
          <div className="w-5 h-5 rounded-md bg-primary/15 border border-primary/25 flex items-center justify-center">
            <Sparkles className="w-3 h-3 text-primary" />
          </div>
          <span className="font-display text-sm text-gradient-amber font-bold">Zil Desktop</span>
        </div>
        <p className="text-xs text-dark-muted/40 font-mono italic mt-1.5">
          自律，是一种舒适
        </p>
      </div>

      {/* 清除数据确认 */}
      <Modal
        isOpen={clearConfirm}
        onClose={() => { setClearConfirm(false); setClearConfirmInput(''); }}
        title="确认清除"
      >
        <p className="text-dark-muted mb-4">
          所有习惯、打卡记录、专注数据及个性化设置（含自定义图片、主题色等）将被永久删除，不可恢复。
        </p>
        <p className="text-sm text-dark-muted/70 mb-2">
          请输入 <span className="text-red-400 font-medium">我确定清除所有数据</span> 以确认：
        </p>
        <input
          type="text"
          value={clearConfirmInput}
          onChange={(e) => setClearConfirmInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && clearConfirmInput === '我确定清除所有数据') {
              handleClearData();
            }
          }}
          placeholder="我确定清除所有数据"
          className="input w-full mb-6"
          autoFocus
        />
        <div className="flex gap-3">
          <Button
            variant="secondary"
            onClick={() => { setClearConfirm(false); setClearConfirmInput(''); }}
            className="flex-1"
          >
            取消
          </Button>
          <Button
            variant="danger"
            onClick={handleClearData}
            disabled={clearConfirmInput !== '我确定清除所有数据'}
            className="flex-1"
          >
            清除
          </Button>
        </div>
      </Modal>

      {/* 导入数据确认 */}
      <Modal
        isOpen={importConfirm}
        onClose={() => { setImportConfirm(false); setPendingImportData(null); }}
        title="确认导入"
      >
        <p className="text-dark-muted mb-6">
          导入将覆盖当前所有数据，此操作不可恢复。建议先导出当前数据作为备份。确定要继续吗？
        </p>
        <div className="flex gap-3">
          <Button variant="secondary" onClick={() => { setImportConfirm(false); setPendingImportData(null); }} className="flex-1">
            取消
          </Button>
          <Button onClick={handleConfirmImport} className="flex-1">
            确认导入
          </Button>
        </div>
      </Modal>
    </motion.div>
  );
}
