import type { OcrProviderErrorInput } from "../types";

const BAIDU_ERROR_CODE_MESSAGES: Record<number, string> = {
  110: "access_token 无效，请重新获取 token 后再试。",
  111: "access_token 已过期，请重新获取 token 后再试。",
  216100: "请求中包含非法参数，请检查后重新尝试。",
  216101: "缺少必须的参数，请检查参数是否有遗漏。",
  216102: "请求了不支持的服务，请检查调用的 URL。",
  216103: "请求中的参数过长，请检查后重新尝试。",
  216110: "appid 不存在，请重新核对信息是否正确。",
  216200: "图片为空，请检查后重新尝试。",
  216201: "上传的图片格式错误，请确认图片格式符合接口要求。",
  216202: "上传的图片大小错误，请根据接口文档调整图片大小。",
  216205: "传入的请求体大小超限，请调整文件大小后重试。",
  216306: "上传文件失败，请检查请求参数和文件内容。",
  216307: "图片数据解析失败，请检查文件内容是否完整可读。",
  216308: "pdf_file_num 超过了 PDF 实际页数，请检查页码参数。",
  216401: "提交请求失败，请稍后重试。",
};

export function parseBaiduError(input: OcrProviderErrorInput) {
  if (
    typeof input.body === "object" &&
    input.body !== null &&
    "error_description" in input.body &&
    typeof input.body.error_description === "string"
  ) {
    return input.body.error_description;
  }

  if (
    typeof input.body === "object" &&
    input.body !== null &&
    "error" in input.body &&
    typeof input.body.error === "string"
  ) {
    return input.body.error;
  }

  if (
    typeof input.body === "object" &&
    input.body !== null &&
    "error_msg" in input.body &&
    typeof input.body.error_msg === "string"
  ) {
    const errorCode =
      "error_code" in input.body && typeof input.body.error_code === "number" ? input.body.error_code : null;
    const explanation = errorCode !== null ? BAIDU_ERROR_CODE_MESSAGES[errorCode] : null;

    return explanation ? `${input.body.error_msg}：${explanation}` : input.body.error_msg;
  }

  return `OCR 请求失败：${input.status}`;
}
