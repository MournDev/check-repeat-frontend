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

<script setup lang="ts">
import { computed } from 'vue'
import AnimatedCharacters from '@/components/animated-characters/AnimatedCharacters.vue'

// 品牌名唯一来源：.env 的 VITE_SYSTEM_NAME
const systemName = import.meta.env.VITE_SYSTEM_NAME

interface AuthLayoutProps {
  pageType?: 'login' | 'register' | 'reset';
  title?: string;
  subtitle?: string;
  isTyping?: boolean;
  showPassword?: boolean;
  passwordLength?: number;
  isError?: boolean;
}

const props = withDefaults(defineProps<AuthLayoutProps>(), {
  pageType: 'login',
  title: '登录到工作台',
  subtitle: '统一接入学生论文管理系统',
  isTyping: false,
  showPassword: false,
  passwordLength: 0,
  isError: false,
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
  padding: 48px;
  background: var(--apple-surface-tile-1);
  overflow: hidden;
}

.left-top {
  position: relative;
  z-index: 10;
  display: flex;
  align-items: center;
  gap: 10px;
}

.brand-mark {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.12);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.brand-name {
  font-family: "SF Pro Display", "Inter", system-ui, sans-serif;
  font-size: 21px;
  font-weight: 600;
  letter-spacing: 0.231px;
  color: var(--apple-canvas);
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
  font-family: "SF Pro Text", "Inter", system-ui, sans-serif;
  font-size: 24px;
  font-weight: 300;
  line-height: 1.5;
  color: rgba(255, 255, 255, 0.55);
  margin: 0;
  text-align: center;
}

// ── Right panel: pure white canvas ───────────────────────
.right-panel {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 32px;
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
  gap: 8px;
  font-size: 18px;
  font-weight: 600;
  color: var(--apple-ink);
  margin-bottom: 48px;
}

.mobile-logo-icon {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: var(--apple-canvas-parchment);
  display: flex;
  align-items: center;
  justify-content: center;
}

.form-header {
  text-align: center;
  margin-bottom: 40px;
}

.form-title {
  font-family: "SF Pro Display", "Inter", system-ui, sans-serif;
  font-size: 40px;
  font-weight: 600;
  line-height: 1.10;
  color: var(--apple-ink);
  margin: 0 0 10px 0;
}

.form-subtitle {
  font-size: 17px;
  font-weight: 400;
  line-height: 1.47;
  letter-spacing: -0.374px;
  color: var(--apple-ink-muted-48);
  margin: 0;
}

@media (max-width: 1068px) {
  .form-title { font-size: 34px; }
}

@media (max-width: 640px) {
  .form-title { font-size: 28px; }
}

@media (max-width: 480px) {
  .right-panel { padding: 20px; }
  .form-title { font-size: 24px; }
}

/* ── 视觉统一（design-tokens 覆盖层） ──────────────────────── */
.left-panel { padding: var(--apple-spacing-xxl); }

.left-top { gap: var(--apple-spacing-xs); }

.brand-mark { border-radius: var(--apple-rounded-md); }

.brand-name {
  font-family: var(--apple-font-display);
  font-size: var(--apple-fs-tagline);
  letter-spacing: var(--apple-ls-tagline);
  color: var(--apple-on-dark);
}

.left-tagline {
  font-family: var(--apple-font-text);
  font-size: var(--apple-fs-lead-airy);
  line-height: var(--apple-lh-lead-airy);
}

.right-panel { padding: var(--apple-spacing-xl); }

.mobile-logo {
  gap: var(--apple-spacing-xs);
  margin-bottom: var(--apple-spacing-xxl);
  font-size: var(--apple-fs-button-large);
}

.mobile-logo-icon { border-radius: var(--apple-rounded-sm); }

.form-header { margin-bottom: var(--apple-spacing-xl); }

.form-title {
  margin: 0 0 var(--apple-spacing-xs);
  font-family: var(--apple-font-display);
  font-size: var(--apple-fs-display-lg);
  line-height: var(--apple-lh-display-lg);
  color: var(--apple-ink);
}

.form-subtitle {
  font-size: var(--apple-fs-body-strong);
  line-height: var(--apple-lh-body);
  letter-spacing: var(--apple-ls-body);
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
</style>
