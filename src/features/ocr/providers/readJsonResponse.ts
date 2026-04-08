export async function readJsonResponse(response: Response, context: string) {
  const text = await response.text();

  if (text.trim().length === 0) {
    throw new Error(`${context}返回空响应，请确认当前运行环境的 /api/ocr/* 转发已接通。`);
  }

  try {
    return JSON.parse(text) as unknown;
  } catch {
    throw new Error(`${context}返回了无法解析的响应，请确认当前运行环境的 /api/ocr/* 转发已接通。`);
  }
}
