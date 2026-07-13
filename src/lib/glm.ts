// GLM-4-Flash API 服务
// 智谱 AI 开放平台，兼容 OpenAI 格式
// 用于 AI 推荐习惯：根据用户现有习惯生成个性化建议，采纳后加入习惯列表
import type { Habit } from '@/store/habitStore';
import { habitIcons, habitColors } from '@/store/habitStore';

const GLM_API_URL = 'https://open.bigmodel.cn/api/paas/v4/chat/completions';
const MODEL = 'glm-4-flash';

/** AI 推荐的习惯建议 */
export interface AIHabitSuggestion {
  name: string;
  icon: string;
  color: string;
  frequency: string;
  reminderTimes: string[];
  reason: string;
}

interface GLMMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface GLMResponse {
  choices?: Array<{
    message?: { content?: string };
  }>;
  error?: { message?: string };
}

/**
 * 调用 GLM-4-Flash 生成单条习惯建议
 * 用于首页每日推荐，减少 token 和响应时间
 */
export async function generateSingleHabitSuggestion(
  apiKey: string,
  existingHabits: Habit[]
): Promise<AIHabitSuggestion> {
  if (!apiKey.trim()) {
    throw new Error('请先在设置中填写 API Key');
  }

  const existingNames = existingHabits.map((h) => h.name).join('、') || '（暂无）';
  const iconList = habitIcons.join(', ');
  const colorList = habitColors.join(', ');

  const systemPrompt = `你是一位自律习惯培养专家。根据用户已有的习惯，只推荐 1 个互补的新习惯。
要求：
1. 不要推荐用户已有的习惯
2. 推荐要个性化、具体可执行（如"晨间 10 分钟拉伸"而非"运动"）
3. 必须返回纯 JSON 对象，不要 markdown 代码块，不要解释文字
4. 包含字段：name(名称), icon(图标名), color(颜色hex), frequency(频率), reminderTimes(提醒时间数组), reason(推荐理由)

图标只能从以下选择：${iconList}
颜色只能从以下选择：${colorList}
frequency 可选值：daily, weekly, weekdays, weekends
reminderTimes 格式：["HH:MM"]，可为空数组 []`;

  const userPrompt = `我现有的习惯：${existingNames}。请推荐 1 个最适合我的新习惯。`;

  const resp = await fetch(GLM_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey.trim()}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.8,
      max_tokens: 256,
    }),
  });

  if (!resp.ok) {
    const errText = await resp.text().catch(() => '');
    throw new Error(`API 请求失败（${resp.status}）：${errText.slice(0, 100)}`);
  }

  const data: GLMResponse = await resp.json();
  if (data.error?.message) {
    throw new Error(data.error.message);
  }

  const content = data.choices?.[0]?.message?.content?.trim() || '';
  if (!content) {
    throw new Error('AI 返回内容为空');
  }

  const jsonStr = extractJsonObject(content);
  if (!jsonStr) {
    throw new Error('AI 返回格式异常，无法解析');
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonStr);
  } catch {
    throw new Error('AI 返回的 JSON 解析失败');
  }

  if (Array.isArray(parsed) || typeof parsed !== 'object' || parsed === null) {
    throw new Error('AI 返回的不是单个对象');
  }

  const suggestion = normalizeSuggestion(parsed as Record<string, unknown>);
  if (!suggestion) {
    throw new Error('AI 返回数据无效');
  }
  return suggestion;
}

/**
 * 调用 GLM-4-Flash 生成习惯建议
 * @param apiKey 智谱 API Key
 * @param existingHabits 用户现有的习惯列表
 * @returns 建议数组（3-5 条）
 */
export async function generateHabitSuggestions(
  apiKey: string,
  existingHabits: Habit[]
): Promise<AIHabitSuggestion[]> {
  if (!apiKey.trim()) {
    throw new Error('请先在设置中填写 API Key');
  }

  const existingNames = existingHabits.map((h) => h.name).join('、') || '（暂无）';
  const iconList = habitIcons.join(', ');
  const colorList = habitColors.join(', ');

  const systemPrompt = `你是一位自律习惯培养专家。根据用户已有的习惯，推荐 3-5 个互补的新习惯。
要求：
1. 不要推荐用户已有的习惯
2. 推荐要个性化、具体可执行（如"晨间 10 分钟拉伸"而非"运动"）
3. 覆盖不同维度（健康、学习、心态、效率等）
4. 必须返回纯 JSON 数组，不要 markdown 代码块，不要解释文字
5. 每条包含字段：name(名称), icon(图标名), color(颜色hex), frequency(频率), reminderTimes(提醒时间数组), reason(推荐理由)

图标只能从以下选择：${iconList}
颜色只能从以下选择：${colorList}
frequency 可选值：daily, weekly, weekdays, weekends
reminderTimes 格式：["HH:MM"]，可为空数组 []`;

  const userPrompt = `我现有的习惯：${existingNames}。请推荐 3-5 个适合我的新习惯。`;

  const messages: GLMMessage[] = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt },
  ];

  const resp = await fetch(GLM_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey.trim()}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages,
      temperature: 0.8,
      max_tokens: 1200,
    }),
  });

  if (!resp.ok) {
    const errText = await resp.text().catch(() => '');
    throw new Error(`API 请求失败（${resp.status}）：${errText.slice(0, 100)}`);
  }

  const data: GLMResponse = await resp.json();
  if (data.error?.message) {
    throw new Error(data.error.message);
  }

  const content = data.choices?.[0]?.message?.content?.trim() || '';
  if (!content) {
    throw new Error('AI 返回内容为空');
  }

  // 提取 JSON（兼容被 markdown 代码块包裹的情况）
  const jsonStr = extractJson(content);
  if (!jsonStr) {
    throw new Error('AI 返回格式异常，无法解析');
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonStr);
  } catch {
    throw new Error('AI 返回的 JSON 解析失败');
  }

  if (!Array.isArray(parsed)) {
    throw new Error('AI 返回的不是数组');
  }

  // 校验并规范化每条建议
  return parsed
    .filter((item) => item && typeof item === 'object')
    .map((item) => normalizeSuggestion(item as Record<string, unknown>))
    .filter((s): s is AIHabitSuggestion => s !== null);
}

/** 从可能包含 markdown 代码块的文本中提取单个 JSON 对象 */
function extractJsonObject(content: string): string | null {
  // 先尝试直接解析
  try {
    const parsed = JSON.parse(content);
    if (!Array.isArray(parsed)) return content;
  } catch {
    // ignore
  }
  // 尝试提取 ```json ... ``` 或 ``` ... ```
  const match = content.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (match) {
    return match[1].trim();
  }
  // 尝试提取第一个 { 到最后一个 }
  const start = content.indexOf('{');
  const end = content.lastIndexOf('}');
  if (start !== -1 && end !== -1 && end > start) {
    return content.slice(start, end + 1);
  }
  return null;
}

/** 从可能包含 markdown 代码块的文本中提取 JSON */
function extractJson(content: string): string | null {
  // 先尝试直接解析
  try {
    JSON.parse(content);
    return content;
  } catch {
    // ignore
  }
  // 尝试提取 ```json ... ``` 或 ``` ... ```
  const match = content.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (match) {
    return match[1].trim();
  }
  // 尝试提取第一个 [ 到最后一个 ]
  const start = content.indexOf('[');
  const end = content.lastIndexOf(']');
  if (start !== -1 && end !== -1 && end > start) {
    return content.slice(start, end + 1);
  }
  return null;
}

/** 规范化单条建议，确保字段合法 */
function normalizeSuggestion(item: Record<string, unknown>): AIHabitSuggestion | null {
  const name = typeof item.name === 'string' ? item.name.trim() : '';
  if (!name) return null;

  const icon = habitIcons.includes(item.icon as string) ? (item.icon as string) : 'Star';
  const color = habitColors.includes(item.color as string) ? (item.color as string) : habitColors[0];
  const frequency = ['daily', 'weekly', 'weekdays', 'weekends'].includes(item.frequency as string)
    ? (item.frequency as string)
    : 'daily';

  let reminderTimes: string[] = [];
  if (Array.isArray(item.reminderTimes)) {
    reminderTimes = item.reminderTimes
      .filter((t) => typeof t === 'string' && /^\d{1,2}:\d{2}$/.test(t))
      .slice(0, 3);
  }

  const reason = typeof item.reason === 'string' ? item.reason.trim() : '';

  return { name, icon, color, frequency, reminderTimes, reason };
}
