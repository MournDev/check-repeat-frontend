import request from "./request";

// ── 学生端 ──

export const getCategories = () =>
  request({ url: "/api/knowledge/categories", method: "get" });

export const getArticles = (params) =>
  request({ url: "/api/knowledge/articles", method: "get", params });

export const getPopular = () =>
  request({ url: "/api/knowledge/articles/popular", method: "get" });

export const getArticle = (id) =>
  request({ url: `/api/knowledge/articles/${id}`, method: "get" });

export const searchArticles = (params) =>
  request({ url: "/api/knowledge/search", method: "get", params });

// ── 管理端 ──

export const adminListArticles = (params) =>
  request({ url: "/api/knowledge/admin/articles", method: "get", params });

export const adminCreateArticle = (data) =>
  request({ url: "/api/knowledge/admin/articles", method: "post", data });

export const adminUpdateArticle = (id, data) =>
  request({ url: `/api/knowledge/admin/articles/${id}`, method: "put", data });

export const adminDeleteArticle = (id) =>
  request({ url: `/api/knowledge/admin/articles/${id}`, method: "delete" });

export const adminUpdateArticleStatus = (id, status) =>
  request({ url: `/api/knowledge/admin/articles/${id}/status`, method: "put", data: { status } });