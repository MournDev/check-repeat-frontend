<template>
  <div class="auth-page">
    <!-- Left: Dark tile hero panel -->
    <div class="left-panel">
      <div class="left-top">
        <div class="brand-mark">
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
            <rect width="28" height="28" rx="7" fill="white" fill-opacity="0.12"/>
            <path d="M7 14L12 9L17 14L12 19L7 14Z" fill="white" fill-opacity="0.9"/>
            <path d="M13 14L18 9L21 12V16L18 19L13 14Z" fill="white" fill-opacity="0.5"/>
          </svg>
        </div>
        <span class="brand-name">{{ systemName }}</span>
      </div>

      <div class="characters-area">
        <AnimatedCharacters
          :page-type="pageType"
          :is-typing="isTyping"
          :show-password="showPassword"
          :password-length="passwordLength"
          :is-error="isError"
        />
      </div>

      <p class="left-tagline">学术诚信，从每一次查重开始</p>
    </div>

    <!-- Right: Clean white form panel -->
    <div class="right-panel">
      <div class="form-wrapper">
        <div class="mobile-logo">
          <div class="mobile-logo-icon">
            <svg width="20" height="20" viewBox="0 0 28 28" fill="none">
              <path d="M7 14L12 9L17 14L12 19L7 14Z" fill="#0066cc" fill-opacity="0.9"/>
              <path d="M13 14L18 9L21 12V16L18 19L13 14Z" fill="#2997ff" fill-opacity="0.7"/>
            </svg>
          </div>
          <span>{{ systemName }}</span>
        </div>

        <div class="form-header">
          <h1 class="form-title">{{ title }}</h1>
          <p class="form-subtitle">{{ subtitle }}</p>
        </div>

        <slot></slot>
      </div>
    </div>
  </div>
</template>

<script setup>
import AnimatedCharacters from '@/components/animated-characters/AnimatedCharacters.vue'

// 品牌名唯一来源：.env 的 VITE_SYSTEM_NAME
const systemName = import.meta.env.VITE_SYSTEM_NAME

defineProps({
  pageType: { type: String, default: 'login' },
  title: { type: String, default: '登录到工作台' },
  subtitle: { type: String, default: '统一接入学生论文管理系统' },
  isTyping: { type: Boolean, default: false },
  showPassword: { type: Boolean, default: false },
  passwordLength: { type: Number, default: 0 },
  isError: { type: Boolean, default: false },
})
</script>

<style lang="scss" scoped>
.auth-page {
  display: grid;
  grid-template-columns: 1fr 1fr;
  min-height: 100vh;

  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
    .left-panel { display: none; }
    .mobile-logo { display: flex; }
  }
}

// ── Left panel: near-black tile, no gradient ─────────────
.left-panel {
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: var(--apple-spacing-xxl);
  background: var(--apple-surface-tile-1);
  overflow: hidden;
}

.left-top {
  position: relative;
  z-index: 10;
  display: flex;
  align-items: center;
  gap: var(--apple-spacing-xs);
}

.brand-mark {
  width: 40px;
  height: 40px;
  border-radius: var(--apple-rounded-md);
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.12);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.brand-name {
  font-family: var(--apple-font-display);
  font-size: var(--apple-fs-tagline);
  font-weight: 600;
  letter-spacing: var(--apple-ls-tagline);
  color: var(--apple-on-dark);
}

.characters-area {
  position: relative;
  z-index: 10;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  height: 500px;
}

.left-tagline {
  position: relative;
  z-index: 10;
  font-family: var(--apple-font-text);
  font-size: var(--apple-fs-lead-airy);
  font-weight: 300;
  line-height: var(--apple-lh-lead-airy);
  color: rgba(255, 255, 255, 0.55);
  margin: 0;
  text-align: center;
}

// ── Right panel: pure white canvas ───────────────────────
.right-panel {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--apple-spacing-xl);
  background: var(--apple-canvas);
}

.form-wrapper {
  width: 100%;
  max-width: 400px;
}

.mobile-logo {
  display: none;
  align-items: center;
  justify-content: center;
  gap: var(--apple-spacing-xs);
  font-size: var(--apple-fs-button-large);
  font-weight: 600;
  color: var(--apple-ink);
  margin-bottom: var(--apple-spacing-xxl);
}

.mobile-logo-icon {
  width: 32px;
  height: 32px;
  border-radius: var(--apple-rounded-sm);
  background: var(--apple-canvas-parchment);
  display: flex;
  align-items: center;
  justify-content: center;
}

.form-header {
  text-align: center;
  margin-bottom: var(--apple-spacing-xl);
}

.form-title {
  font-family: var(--apple-font-display);
  font-size: var(--apple-fs-display-lg);
  font-weight: 600;
  line-height: var(--apple-lh-display-lg);
  color: var(--apple-ink);
  margin: 0 0 var(--apple-spacing-xs);
}

.form-subtitle {
  font-size: var(--apple-fs-body-strong);
  font-weight: 400;
  line-height: var(--apple-lh-body);
  letter-spacing: var(--apple-ls-body);
  color: var(--apple-ink-muted-48);
  margin: 0;
}

@media (max-width: 1068px) {
  .form-title { font-size: var(--apple-fs-display-md); }
}

@media (max-width: 640px) {
  .form-title { font-size: var(--apple-fs-lead); }
}

@media (max-width: 480px) {
  .right-panel { padding: var(--apple-spacing-md); }
  .form-title { font-size: var(--apple-fs-lead-airy); }
}

/* ── 共享认证表单（Login / Register / Reset 插槽内容，样式集中在此） ── */
.form-wrapper :deep(.el-form-item) {
  margin-bottom: var(--apple-spacing-md);
}

.form-wrapper :deep(.el-input__wrapper) {
  height: 48px;
  background: var(--apple-canvas-parchment);
  border: 1px solid var(--apple-hairline);
  border-radius: var(--apple-rounded-pill);
  box-shadow: none;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.form-wrapper :deep(.el-input__wrapper:hover) {
  border-color: var(--apple-primary);
}

.form-wrapper :deep(.el-input__wrapper.is-focus),
.form-wrapper :deep(.el-input__wrapper:focus) {
  border-color: var(--apple-primary);
  box-shadow: 0 0 0 3px rgba(0, 102, 204, 0.12);
  background: var(--apple-surface);
}

.form-wrapper :deep(.el-input__inner) {
  background: transparent;
  font-size: var(--apple-fs-caption);
  color: var(--apple-ink);
}

.form-wrapper :deep(.el-input__inner::placeholder) {
  color: var(--apple-ink-secondary);
}

.form-wrapper :deep(.field-label) {
  margin-bottom: var(--apple-spacing-xxs);
  font-size: var(--apple-fs-fine-print);
  font-weight: 400;
  letter-spacing: 0.2px;
  color: var(--apple-ink);
}

.form-wrapper :deep(.eye-toggle) {
  display: flex;
  align-items: center;
  font-size: 16px;
  color: var(--apple-ink-secondary);
  cursor: pointer;
  transition: color 0.2s;
}

.form-wrapper :deep(.eye-toggle:hover) {
  color: var(--apple-ink);
}

.form-wrapper :deep(.el-button.submit-btn) {
  width: 100%;
  height: 48px;
  font-size: 15px;
  font-weight: 600;
  letter-spacing: 1px;
  border-radius: var(--apple-rounded-pill);
  background: var(--apple-primary);
  border-color: var(--apple-primary);
  transition: background 0.2s, opacity 0.2s;
  cursor: pointer;
}

.form-wrapper :deep(.el-button.submit-btn:hover) {
  background: var(--apple-primary-active);
  border-color: var(--apple-primary-active);
  opacity: 1;
}

.form-wrapper :deep(.el-button.submit-btn:active) {
  opacity: 0.85;
}

.form-wrapper :deep(.divider) {
  display: flex;
  align-items: center;
  gap: var(--apple-spacing-sm);
  margin: var(--apple-spacing-md) 0 0;
  font-size: var(--apple-fs-fine-print);
}

.form-wrapper :deep(.divider::before),
.form-wrapper :deep(.divider::after) {
  content: '';
  flex: 1;
  height: 1px;
  background: var(--apple-hairline);
}

.form-wrapper :deep(.divider span) {
  color: var(--apple-ink-secondary);
  white-space: nowrap;
}

.form-wrapper :deep(.signup-row) {
  margin-top: var(--apple-spacing-lg);
  text-align: center;
  font-size: var(--apple-fs-fine-print);
  color: var(--apple-ink-secondary);
}

/* 同页第二行链接（如登录页「报告验真」）收窄间距 */
.form-wrapper :deep(.signup-row-tight) {
  margin-top: var(--apple-spacing-xs);
}

.form-wrapper :deep(.el-button.signup-link) {
  color: var(--apple-primary);
  font-weight: 400;
  text-decoration: none;
  cursor: pointer;
}

.form-wrapper :deep(.el-button.signup-link:hover) {
  color: var(--apple-primary-active);
  text-decoration: underline;
}
</style>
