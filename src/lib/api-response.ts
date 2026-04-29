/**
 * 标准化 API 响应格式
 * 统一成功/错误响应格式与 HTTP 状态码
 */

import { NextResponse } from "next/server";

// 成功响应
export interface ApiSuccessResponse<T = unknown> {
  success: true;
  data: T;
  message?: string;
}

// 错误响应
export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export type ApiResponse<T = unknown> = ApiSuccessResponse<T> | ApiErrorResponse;

// 业务错误码
export const ErrorCodes = {
  // 认证/授权
  UNAUTHORIZED: "UNAUTHORIZED",
  FORBIDDEN: "FORBIDDEN",
  TOKEN_EXPIRED: "TOKEN_EXPIRED",

  // 资源
  NOT_FOUND: "NOT_FOUND",
  CONFLICT: "CONFLICT",
  DUPLICATE: "DUPLICATE",

  // 请求
  VALIDATION_ERROR: "VALIDATION_ERROR",
  BAD_REQUEST: "BAD_REQUEST",
  RATE_LIMITED: "RATE_LIMITED",

  // 服务端
  INTERNAL_ERROR: "INTERNAL_ERROR",
  EXTERNAL_SERVICE_ERROR: "EXTERNAL_SERVICE_ERROR",
  TIMEOUT: "TIMEOUT",
} as const;

export type ErrorCode = (typeof ErrorCodes)[keyof typeof ErrorCodes];

// HTTP 状态码映射
const errorCodeToHttpStatus: Record<ErrorCode, number> = {
  [ErrorCodes.UNAUTHORIZED]: 401,
  [ErrorCodes.FORBIDDEN]: 403,
  [ErrorCodes.TOKEN_EXPIRED]: 401,
  [ErrorCodes.NOT_FOUND]: 404,
  [ErrorCodes.CONFLICT]: 409,
  [ErrorCodes.DUPLICATE]: 409,
  [ErrorCodes.VALIDATION_ERROR]: 422,
  [ErrorCodes.BAD_REQUEST]: 400,
  [ErrorCodes.RATE_LIMITED]: 429,
  [ErrorCodes.INTERNAL_ERROR]: 500,
  [ErrorCodes.EXTERNAL_SERVICE_ERROR]: 502,
  [ErrorCodes.TIMEOUT]: 504,
};

/**
 * 创建成功响应
 */
export function successResponse<T>(data: T, message?: string): ApiSuccessResponse<T> {
  return { success: true, data, message };
}

/**
 * 创建 Next.js Response 成功响应
 */
export function successNextResponse<T>(data: T, message?: string, status = 200): NextResponse<ApiSuccessResponse<T>> {
  return NextResponse.json(successResponse(data, message), { status });
}

/**
 * 创建错误响应
 */
export function errorResponse(code: ErrorCode, message: string, details?: unknown): ApiErrorResponse {
  return { success: false, error: { code, message, details } };
}

/**
 * 创建 Next.js Response 错误响应
 */
export function errorNextResponse(code: ErrorCode, message: string, details?: unknown): NextResponse<ApiErrorResponse> {
  const httpStatus = errorCodeToHttpStatus[code] ?? 500;
  return NextResponse.json(errorResponse(code, message, details), { status: httpStatus });
}

/**
 * 便捷错误响应工厂函数
 */
export const ApiError = {
  unauthorized: (message = "未登录或登录已过期", details?: unknown) =>
    errorNextResponse(ErrorCodes.UNAUTHORIZED, message, details),

  forbidden: (message = "没有权限执行此操作", details?: unknown) =>
    errorNextResponse(ErrorCodes.FORBIDDEN, message, details),

  notFound: (message = "资源不存在", details?: unknown) =>
    errorNextResponse(ErrorCodes.NOT_FOUND, message, details),

  conflict: (message = "资源冲突", details?: unknown) =>
    errorNextResponse(ErrorCodes.CONFLICT, message, details),

  duplicate: (message = "资源已存在", details?: unknown) =>
    errorNextResponse(ErrorCodes.DUPLICATE, message, details),

  validation: (message = "参数校验失败", details?: unknown) =>
    errorNextResponse(ErrorCodes.VALIDATION_ERROR, message, details),

  badRequest: (message = "请求参数错误", details?: unknown) =>
    errorNextResponse(ErrorCodes.BAD_REQUEST, message, details),

  rateLimited: (message = "请求过于频繁", details?: unknown) =>
    errorNextResponse(ErrorCodes.RATE_LIMITED, message, details),

  internal: (message = "服务器内部错误", details?: unknown) =>
    errorNextResponse(ErrorCodes.INTERNAL_ERROR, message, details),

  externalService: (message = "外部服务调用失败", details?: unknown) =>
    errorNextResponse(ErrorCodes.EXTERNAL_SERVICE_ERROR, message, details),

  timeout: (message = "请求超时", details?: unknown) =>
    errorNextResponse(ErrorCodes.TIMEOUT, message, details),
};
