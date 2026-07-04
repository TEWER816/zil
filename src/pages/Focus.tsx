import { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, RotateCcw, Sparkles, Maximize2, Minimize2, Palette, Target } from 'lucide-react';
import { useFocusStore } from '@/store/focusStore';
import { useUIStore } from '@/store/uiStore';
import { useSettingsStore } from '@/store/settingsStore';
import { ProgressRing } from '@/components/common/ProgressRing';
import { recommendFocusDuration } from '@/lib/focusRecommender';
import { Modal } from '@/components/common/Modal';
import { Button } from '@/components/common/Button';

export function Focus() {
  const {
    focusDuration,
    breakDuration,
    timeLeft,
    isRunning,
    isPaused,
    sessionType,
    currentSession,
    startSession,
    pauseSession,
    resumeSession,
    endSession,
    tick,
    setFocusDuration,
    setBreakDuration,
    getTodayFocusTime,
    getTodayPomodoros,
    sessions
  } = useFocusStore();

  const [showSettings, setShowSettings] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showTaskPrompt, setShowTaskPrompt] = useState(false);
  const [taskInput, setTaskInput] = useState('');
  const intervalRef = useRef<number | null>(null);

  const { focusMode, enterFocusMode, exitFocusMode } = useUIStore();
  const { focusBgColor, setFocusBgColor } = useSettingsStore();

  const todayFocusTime = getTodayFocusTime();
  const todayPomodoros = getTodayPomodoros();

  // 最近使用过的任务（去重，取最近 5 个）
  const recentTasks = useMemo(() => {
    const tasks = sessions
      .filter(s => s.type === 'focus' && s.task)
      .map(s => s.task as string)
      .reverse();
    return [...new Set(tasks)].slice(0, 5);
  }, [sessions]);

  // 颜色预设（柔和色系，深浅兼顾）
  const colorPresets = [
    '#1A1A1F', // 深灰（默认）
    '#1A2E2A', // 深薄荷
    '#1F2937', // 深石板
    '#F7FAF7', // 奶油白
    '#E8F8F5', // 薄荷
    '#FFF8E7', // 奶黄
    '#EBF5FF', // 天蓝
    '#FFFFFF', // 纯白
  ];

  // 进入沉浸专注模式：全屏 + 隐藏侧边栏
  const handleStartImmersive = async () => {
    enterFocusMode();
    try {
      await document.documentElement.requestFullscreen();
    } catch {
      // 全屏失败不阻塞，仍进入沉浸模式
    }
  };

  // 退出沉浸专注模式
  const handleExitImmersive = async () => {
    exitFocusMode();
    setShowColorPicker(false);
    if (document.fullscreenElement) {
      try { await document.exitFullscreen(); } catch { /* ignore */ }
    }
  };

  // 监听全屏变化：用户按 Esc 退出全屏时，同步退出沉浸模式
  useEffect(() => {
    const handleFsChange = () => {
      if (!document.fullscreenElement && focusMode) {
        exitFocusMode();
        setShowColorPicker(false);
      }
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, [focusMode, exitFocusMode]);

  // 神经网络智能推荐专注时长
  const focusRec = useMemo(
    () => recommendFocusDuration(new Date().getHours(), todayPomodoros, sessions),
    [todayPomodoros, sessions]
  );

  // 计时器
  useEffect(() => {
    if (isRunning) {
      intervalRef.current = window.setInterval(() => {
        tick();
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, tick]);

  // 格式化时间
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // 进度百分比
  const totalTime = sessionType === 'focus' ? focusDuration * 60 : breakDuration * 60;
  const progress = ((totalTime - timeLeft) / totalTime) * 100;

  // 点击播放：若没有进行中的会话，先询问任务
  const handlePlayPause = () => {
    if (isRunning) {
      pauseSession();
    } else if (isPaused && currentSession) {
      resumeSession();
    } else {
      // 新会话：弹出任务输入
      setShowTaskPrompt(true);
    }
  };

  // 确认开始专注
  const handleConfirmStart = () => {
    startSession(sessionType, taskInput);
    setTaskInput('');
    setShowTaskPrompt(false);
  };

  const isFocus = sessionType === 'focus';
  const accentColor = isFocus ? '#5DCCC5' : '#FFC857';

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col items-center justify-center min-h-[70vh] md:min-h-[80vh] space-y-7 md:space-y-8 relative"
    >
      {/* 沉浸模式浮动控制栏 */}
      <AnimatePresence>
        {focusMode && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="fixed top-4 right-4 z-50 flex items-center gap-2"
          >
            {/* 颜色自定义按钮 */}
            <motion.button
              type="button"
              whileHover={{ scale: 1.06 }}
              whileTap={{ scale: 0.94 }}
              onClick={() => setShowColorPicker(!showColorPicker)}
              className="w-10 h-10 rounded-xl flex items-center justify-center border border-white/10 backdrop-blur-md bg-white/5 text-dark-muted/70 hover:text-primary transition-colors"
              title="自定义背景色"
            >
              <Palette className="w-4 h-4" />
            </motion.button>
            {/* 结束自律按钮 */}
            <motion.button
              type="button"
              whileHover={{ scale: 1.06 }}
              whileTap={{ scale: 0.94 }}
              onClick={handleExitImmersive}
              className="h-10 px-4 rounded-xl flex items-center gap-1.5 border border-white/10 backdrop-blur-md bg-white/5 text-dark-muted/70 hover:text-primary transition-colors text-sm"
              title="结束自律（Esc）"
            >
              <Minimize2 className="w-4 h-4" />
              <span>结束自律</span>
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 颜色自定义面板 */}
      <AnimatePresence>
        {focusMode && showColorPicker && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={{ duration: 0.25, ease: [0.32, 0.72, 0, 1] }}
            className="fixed top-20 right-4 z-50 card p-4 w-64"
          >
            <p className="text-xs text-dark-muted/60 mb-3 tracking-wider uppercase">背景色</p>
            <div className="grid grid-cols-4 gap-2 mb-4">
              {colorPresets.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setFocusBgColor(color)}
                  className={`w-11 h-11 rounded-lg border-2 transition-all ${
                    focusBgColor.toLowerCase() === color.toLowerCase()
                      ? 'border-primary scale-105'
                      : 'border-white/10 hover:border-white/30'
                  }`}
                  style={{ backgroundColor: color }}
                  title={color}
                />
              ))}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-dark-muted/60">自定义</span>
              <input
                type="color"
                value={focusBgColor}
                onChange={(e) => setFocusBgColor(e.target.value)}
                className="w-10 h-8 rounded cursor-pointer bg-transparent border border-white/10"
              />
              <input
                type="text"
                value={focusBgColor}
                onChange={(e) => setFocusBgColor(e.target.value)}
                className="input flex-1 py-1 px-2 text-xs font-mono"
                placeholder="#000000"
                maxLength={7}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 计时器主区 */}
      <motion.section
        initial={{ scale: 0.96, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.05 }}
        className="flex flex-col items-center relative w-full"
      >
        {/* 当前任务展示 */}
        {currentSession?.task && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 max-w-[80vw]"
          >
            <Target className="w-3.5 h-3.5 text-primary shrink-0" />
            <span className="text-sm text-primary/90 font-medium truncate max-w-[240px]">
              {currentSession.task}
            </span>
          </motion.div>
        )}

        {/* 会话类型徽章 */}
        <div className="mb-5 md:mb-6 inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full"
          style={{
            background: isFocus ? 'rgba(93, 204, 197, 0.1)' : 'rgba(255, 200, 87, 0.1)',
            border: `1px solid ${isFocus ? 'rgba(93, 204, 197, 0.25)' : 'rgba(255, 200, 87, 0.25)'}`,
          }}
        >
          <motion.span
            animate={isRunning ? { opacity: [1, 0.4, 1] } : { opacity: 1 }}
            transition={{ duration: 2, repeat: Infinity }}
            className="w-1.5 h-1.5 rounded-full"
            style={{ backgroundColor: accentColor }}
          />
          <span className="text-xs md:text-sm font-medium" style={{ color: accentColor }}>
            {isFocus ? '专注时间' : '休息时间'}
          </span>
        </div>

        {/* 大计时器 */}
        <div className="relative mb-7 md:mb-8">
          {/* 轻柔呼吸光晕 */}
          {isRunning && (
            <div
              className="absolute inset-0 rounded-full blur-3xl timer-glow-soft"
              style={{ backgroundColor: accentColor }}
            />
          )}

          <div className="relative">
            <ProgressRing
              progress={progress}
              size={192}
              strokeWidth={6}
              color={accentColor}
              glow={false}
            >
              <div className="flex flex-col items-center">
                <span className="text-4xl md:text-5xl font-display font-bold tracking-tight text-dark-muted tabular-nums">
                  {formatTime(timeLeft)}
                </span>
                <span className="text-xs text-dark-muted/50 mt-1 tracking-widest uppercase">
                  {isFocus ? 'Focus' : 'Break'}
                </span>
              </div>
            </ProgressRing>
          </div>
        </div>

        {/* 控制按钮 */}
        <div className="flex gap-4 justify-center">
          <motion.button
            whileHover={{ scale: 1.06 }}
            whileTap={{ scale: 0.94 }}
            onClick={handlePlayPause}
            className="w-16 h-16 md:w-20 md:h-20 rounded-full flex items-center justify-center"
            style={{
              backgroundColor: accentColor,
              color: '#FFFFFF',
            }}
          >
            {isRunning ? (
              <Pause className="w-7 h-7" fill="currentColor" />
            ) : (
              <Play className="w-7 h-7 ml-0.5" fill="currentColor" />
            )}
          </motion.button>

          <motion.button
            whileHover={currentSession ? { scale: 1.06 } : {}}
            whileTap={currentSession ? { scale: 0.94 } : {}}
            onClick={endSession}
            disabled={!currentSession}
            className={`w-16 h-16 md:w-20 md:h-20 rounded-full flex items-center justify-center border transition-colors ${
              currentSession
                ? 'bg-white/5 border-white/10 text-dark-muted hover:border-primary/40 hover:text-primary'
                : 'bg-white/5 border-white/5 text-dark-muted/30 cursor-not-allowed'
            }`}
          >
            <RotateCcw className="w-6 h-6" />
          </motion.button>
        </div>
      </motion.section>

      {/* 今日统计 */}
      <motion.section
        initial={{ y: 12, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="card w-full max-w-md"
      >
        <div className="flex gap-4 md:gap-6 justify-center">
          <div className="flex-1 text-center">
            <p className="text-xs text-dark-muted/50 mb-1 tracking-wider uppercase">今日专注</p>
            <p className="text-2xl md:text-3xl font-display font-bold text-gradient-amber">
              {todayFocusTime}
              <span className="text-sm text-dark-muted/60 ml-1 font-sans font-normal">分钟</span>
            </p>
          </div>
          <div className="w-px bg-dark-border/60" />
          <div className="flex-1 text-center">
            <p className="text-xs text-dark-muted/50 mb-1 tracking-wider uppercase">番茄钟</p>
            <p className="text-2xl md:text-3xl font-display font-bold text-gradient-mint">
              {todayPomodoros}
              <span className="text-sm text-dark-muted/60 ml-1 font-sans font-normal">个</span>
            </p>
          </div>
        </div>
      </motion.section>

      {/* 开始专注（沉浸模式入口） - 专注模式下隐藏 */}
      {!focusMode && (
        <motion.button
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.18 }}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={handleStartImmersive}
          className="flex items-center gap-2 px-6 py-3 rounded-xl bg-primary/15 border border-primary/30 text-primary hover:bg-primary/25 transition-colors text-sm font-medium tracking-wide"
        >
          <Maximize2 className="w-4 h-4" />
          <span>开始专注</span>
        </motion.button>
      )}

      {/* 设置 */}
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        whileHover={{ scale: 1.04 }}
        whileTap={{ scale: 0.96 }}
        onClick={() => setShowSettings(!showSettings)}
        className="text-xs text-dark-muted/50 hover:text-primary transition-colors tracking-wider"
      >
        {showSettings ? '收起设置' : '调整时长'}
      </motion.button>

      {showSettings && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="card flex flex-col gap-5 w-full max-w-md"
        >
          {/* AI 推荐专注时长 */}
          <div className="flex items-center justify-between gap-3 pb-4 border-b border-dark-border/40">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                <Sparkles className="w-4 h-4 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] text-dark-muted/50 uppercase tracking-wider">AI 推荐时长</p>
                <p className="text-xs text-dark-muted/70 truncate">{focusRec.reason}</p>
              </div>
            </div>
            <motion.button
              type="button"
              whileTap={{ scale: 0.95 }}
              onClick={() => setFocusDuration(focusRec.duration)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium shrink-0 transition-colors ${
                focusDuration === focusRec.duration
                  ? 'bg-primary text-dark-bg'
                  : 'bg-primary/10 text-primary hover:bg-primary/20'
              }`}
            >
              {focusRec.duration}分
            </motion.button>
          </div>
          <div className="flex flex-col md:flex-row gap-5 md:gap-8">
          <div className="text-center flex-1">
            <p className="text-xs text-dark-muted/50 mb-3 tracking-wider uppercase">专注时长</p>
            <div className="flex gap-2 flex-wrap justify-center">
              {[15, 25, 45, 60].map((duration) => (
                <motion.button
                  key={duration}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setFocusDuration(duration)}
                  className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    focusDuration === duration
                      ? 'bg-primary text-dark-bg'
                      : 'bg-white/5 text-dark-muted hover:bg-white/10'
                  }`}
                >
                  {duration}分
                </motion.button>
              ))}
            </div>
            <div className="mt-3 flex items-center justify-center gap-1.5">
              <span className="text-xs text-dark-muted/50">自定义</span>
              <input
                type="number"
                min={1}
                max={120}
                value={focusDuration}
                onChange={(e) => {
                  const v = Number(e.target.value);
                  if (v >= 1 && v <= 120) setFocusDuration(v);
                }}
                className="w-16 input py-1 text-center text-sm"
              />
              <span className="text-xs text-dark-muted/50">分</span>
            </div>
          </div>

          <div className="hidden md:block w-px bg-dark-border/60" />

          <div className="text-center flex-1">
            <p className="text-xs text-dark-muted/50 mb-3 tracking-wider uppercase">休息时长</p>
            <div className="flex gap-2 justify-center">
              {[5, 10, 15].map((duration) => (
                <motion.button
                  key={duration}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setBreakDuration(duration)}
                  className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    breakDuration === duration
                      ? 'bg-secondary text-dark-bg'
                      : 'bg-white/5 text-dark-muted hover:bg-white/10'
                  }`}
                >
                  {duration}分
                </motion.button>
              ))}
            </div>
            <div className="mt-3 flex items-center justify-center gap-1.5">
              <span className="text-xs text-dark-muted/50">自定义</span>
              <input
                type="number"
                min={1}
                max={60}
                value={breakDuration}
                onChange={(e) => {
                  const v = Number(e.target.value);
                  if (v >= 1 && v <= 60) setBreakDuration(v);
                }}
                className="w-16 input py-1 text-center text-sm"
              />
              <span className="text-xs text-dark-muted/50">分</span>
            </div>
          </div>
          </div>
        </motion.div>
      )}

      {/* 开始专注：询问任务弹窗 */}
      <Modal
        isOpen={showTaskPrompt}
        onClose={() => { setShowTaskPrompt(false); setTaskInput(''); }}
        title="想要专注的任务"
      >
        <p className="text-sm text-dark-muted/70 mb-4">
          给这次专注起个名字吧（可以不填，直接开始）
        </p>
        <input
          type="text"
          autoFocus
          value={taskInput}
          onChange={(e) => setTaskInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleConfirmStart();
          }}
          placeholder="例如：阅读 30 页、完成项目报告…"
          className="input w-full mb-4"
          maxLength={40}
        />
        {recentTasks.length > 0 && (
          <div className="mb-6">
            <p className="text-xs text-dark-muted/50 mb-2 tracking-wider uppercase">最近任务</p>
            <div className="flex flex-wrap gap-2">
              {recentTasks.map((task) => (
                <button
                  key={task}
                  type="button"
                  onClick={() => setTaskInput(task)}
                  className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-dark-muted/80 hover:border-primary/40 hover:text-primary transition-colors"
                >
                  {task}
                </button>
              ))}
            </div>
          </div>
        )}
        <div className="flex gap-3">
          <Button variant="secondary" onClick={() => { setShowTaskPrompt(false); setTaskInput(''); }} className="flex-1">
            取消
          </Button>
          <Button onClick={handleConfirmStart} className="flex-1">
            开始专注
          </Button>
        </div>
      </Modal>
    </motion.div>
  );
}
