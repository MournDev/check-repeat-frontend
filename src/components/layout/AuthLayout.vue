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
        <span class="brand-name">论文查重系统</span>
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
          <span>论文查重系统</span>
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
  background: #272729;
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
  color: #ffffff;
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
  background: #ffffff;
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
  color: #1d1d1f;
  margin-bottom: 48px;
}

.mobile-logo-icon {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: #f5f5f7;
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
  color: #1d1d1f;
  margin: 0 0 10px 0;
}

.form-subtitle {
  font-size: 17px;
  font-weight: 400;
  line-height: 1.47;
  letter-spacing: -0.374px;
  color: #7a7a7a;
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
</style>
