<template>
  <div ref="containerRef" :style="{ position: 'relative', width: '550px', height: '400px' }">
    <div ref="purpleRef" :style="purpleStyle">
      <div ref="purpleFaceRef" :style="purpleFaceStyle">
        <div class="eyeball" data-max-distance="5" :style="smallEyeStyle">
          <div class="eyeball-pupil" :style="smallPupilStyle" />
        </div>
        <div class="eyeball" data-max-distance="5" :style="smallEyeStyle">
          <div class="eyeball-pupil" :style="smallPupilStyle" />
        </div>
      </div>
    </div>

    <div ref="blackRef" :style="blackStyle">
      <div ref="blackFaceRef" :style="blackFaceStyle">
        <div class="eyeball" data-max-distance="4" :style="blackEyeStyle">
          <div class="eyeball-pupil" :style="blackPupilStyle" />
        </div>
        <div class="eyeball" data-max-distance="4" :style="blackEyeStyle">
          <div class="eyeball-pupil" :style="blackPupilStyle" />
        </div>
      </div>
    </div>

    <div ref="orangeRef" :style="orangeStyle">
      <div ref="orangeFaceRef" :style="orangeFaceStyle">
        <div class="pupil" data-max-distance="5" :style="dotPupilStyle" />
        <div class="pupil" data-max-distance="5" :style="dotPupilStyle" />
      </div>
    </div>

    <div ref="yellowRef" :style="yellowStyle">
      <div ref="yellowFaceRef" :style="yellowFaceStyle">
        <div class="pupil" data-max-distance="5" :style="dotPupilStyle" />
        <div class="pupil" data-max-distance="5" :style="dotPupilStyle" />
      </div>
      <div ref="yellowMouthRef" :style="yellowMouthStyle" />
    </div>
  </div>
</template>

<script setup lang="ts">
import gsap from 'gsap';
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';

interface AnimatedCharactersProps {
  isTyping?: boolean;
  showPassword?: boolean;
  passwordLength?: number;
  isLoginFailed?: boolean;
  pageType?: 'login' | 'register' | 'reset';
  isError?: boolean;
}

const props = withDefaults(defineProps<AnimatedCharactersProps>(), {
  isTyping: false,
  showPassword: false,
  passwordLength: 0,
  isLoginFailed: false,
  pageType: 'login',
  isError: false,
});

const containerRef = ref<HTMLDivElement | null>(null);
const mouseRef = ref({ x: 0, y: 0 });
const rafIdRef = ref(0);

const purpleRef = ref<HTMLDivElement | null>(null);
const blackRef = ref<HTMLDivElement | null>(null);
const yellowRef = ref<HTMLDivElement | null>(null);
const orangeRef = ref<HTMLDivElement | null>(null);

const purpleFaceRef = ref<HTMLDivElement | null>(null);
const blackFaceRef = ref<HTMLDivElement | null>(null);
const yellowFaceRef = ref<HTMLDivElement | null>(null);
const orangeFaceRef = ref<HTMLDivElement | null>(null);
const yellowMouthRef = ref<HTMLDivElement | null>(null);

const purpleBlinkTimerRef = ref<ReturnType<typeof setTimeout>>();
const blackBlinkTimerRef = ref<ReturnType<typeof setTimeout>>();
const purplePeekTimerRef = ref<ReturnType<typeof setTimeout>>();
const lookingTimerRef = ref<ReturnType<typeof setTimeout>>();

const isLookingRef = ref(false);
const isHidingPassword = computed(() => props.passwordLength > 0 && !props.showPassword);
const isShowingPassword = computed(() => props.passwordLength > 0 && props.showPassword);

const stateRef = ref({
  isTyping: props.isTyping,
  isHidingPassword: isHidingPassword.value,
  isShowingPassword: isShowingPassword.value,
  isLooking: false,
  isLoginFailed: false,
  isError: props.isError,
  pageType: props.pageType,
});

const quickToRef = ref<Record<string, gsap.QuickToFunc> | null>(null);

const purpleStyle = {
  position: 'absolute',
  bottom: 0,
  left: '70px',
  width: '180px',
  height: '400px',
  backgroundColor: '#6C3FF5',
  borderRadius: '10px 10px 0 0',
  zIndex: 1,
  transformOrigin: 'bottom center',
  willChange: 'transform',
} as const;

const blackStyle = {
  position: 'absolute',
  bottom: 0,
  left: '240px',
  width: '120px',
  height: '310px',
  backgroundColor: '#1d1d1f',
  borderRadius: '8px 8px 0 0',
  zIndex: 2,
  transformOrigin: 'bottom center',
  willChange: 'transform',
} as const;

const orangeStyle = {
  position: 'absolute',
  bottom: 0,
  left: 0,
  width: '240px',
  height: '200px',
  backgroundColor: '#FF9B6B',
  borderRadius: '120px 120px 0 0',
  zIndex: 3,
  transformOrigin: 'bottom center',
  willChange: 'transform',
} as const;

const yellowStyle = {
  position: 'absolute',
  bottom: 0,
  left: '310px',
  width: '140px',
  height: '230px',
  backgroundColor: '#E8D754',
  borderRadius: '70px 70px 0 0',
  zIndex: 4,
  transformOrigin: 'bottom center',
  willChange: 'transform',
} as const;

const purpleFaceStyle = { position: 'absolute', display: 'flex', gap: '32px', left: '45px', top: '40px' } as const;
const blackFaceStyle = { position: 'absolute', display: 'flex', gap: '24px', left: '26px', top: '32px' } as const;
const orangeFaceStyle = { position: 'absolute', display: 'flex', gap: '32px', left: '82px', top: '90px' } as const;
const yellowFaceStyle = { position: 'absolute', display: 'flex', gap: '24px', left: '52px', top: '40px' } as const;
const yellowMouthStyle = {
  position: 'absolute',
  width: '80px',
  height: '4px',
  backgroundColor: '#1d1d1f',
  borderRadius: '9999px',
  left: '40px',
  top: '88px',
} as const;

const eyeBase = {
  borderRadius: '50%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  overflow: 'hidden',
  willChange: 'height',
} as const;

const smallEyeStyle = { ...eyeBase, width: '18px', height: '18px', backgroundColor: 'white' } as const;
const blackEyeStyle = { ...eyeBase, width: '16px', height: '16px', backgroundColor: 'white' } as const;
const smallPupilStyle = { width: '7px', height: '7px', borderRadius: '50%', backgroundColor: '#2D2D2D', willChange: 'transform' } as const;
const blackPupilStyle = { width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#2D2D2D', willChange: 'transform' } as const;
const dotPupilStyle = { width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#2D2D2D', willChange: 'transform' } as const;

const calcPos = (el: HTMLElement) => {
  const rect = el.getBoundingClientRect();
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 3;
  const dx = mouseRef.value.x - cx;
  const dy = mouseRef.value.y - cy;
  return {
    faceX: Math.max(-15, Math.min(15, dx / 20)),
    faceY: Math.max(-10, Math.min(10, dy / 30)),
    bodySkew: Math.max(-6, Math.min(6, -dx / 120)),
  };
};

const calcEyePos = (el: HTMLElement, maxDist: number) => {
  const r = el.getBoundingClientRect();
  const cx = r.left + r.width / 2;
  const cy = r.top + r.height / 2;
  const dx = mouseRef.value.x - cx;
  const dy = mouseRef.value.y - cy;
  const dist = Math.min(Math.sqrt(dx ** 2 + dy ** 2), maxDist);
  const angle = Math.atan2(dy, dx);
  return { x: Math.cos(angle) * dist, y: Math.sin(angle) * dist };
};

const applyLookAtEachOther = () => {
  const qt = quickToRef.value;
  if (qt) {
    qt.purpleFaceLeft(55);
    qt.purpleFaceTop(65);
    qt.blackFaceLeft(32);
    qt.blackFaceTop(12);
  }
  purpleRef.value?.querySelectorAll('.eyeball-pupil').forEach((p) => {
    gsap.to(p, { x: 3, y: 4, duration: 0.3, ease: 'power2.out', overwrite: 'auto' });
  });
  blackRef.value?.querySelectorAll('.eyeball-pupil').forEach((p) => {
    gsap.to(p, { x: 0, y: -4, duration: 0.3, ease: 'power2.out', overwrite: 'auto' });
  });
};

const applyHidingPassword = () => {
  const qt = quickToRef.value;
  if (qt) {
    qt.purpleFaceLeft(55);
    qt.purpleFaceTop(65);
  }
};

const applyShowPassword = () => {
  const qt = quickToRef.value;
  if (qt) {
    qt.purpleSkew(0);
    qt.blackSkew(0);
    qt.orangeSkew(0);
    qt.yellowSkew(0);
    qt.purpleX(0);
    qt.blackX(0);
    qt.purpleHeight(400);
    qt.purpleFaceLeft(20);
    qt.purpleFaceTop(35);
    qt.blackFaceLeft(10);
    qt.blackFaceTop(28);
    qt.orangeFaceX(50 - 82);
    qt.orangeFaceY(85 - 90);
    qt.yellowFaceX(20 - 52);
    qt.yellowFaceY(35 - 40);
    qt.mouthX(10 - 40);
    qt.mouthY(0);
  }

  purpleRef.value?.querySelectorAll('.eyeball-pupil').forEach((p) => {
    gsap.to(p, { x: -4, y: -4, duration: 0.3, ease: 'power2.out', overwrite: 'auto' });
  });
  blackRef.value?.querySelectorAll('.eyeball-pupil').forEach((p) => {
    gsap.to(p, { x: -4, y: -4, duration: 0.3, ease: 'power2.out', overwrite: 'auto' });
  });
  orangeRef.value?.querySelectorAll('.pupil').forEach((p) => {
    gsap.to(p, { x: -5, y: -4, duration: 0.3, ease: 'power2.out', overwrite: 'auto' });
  });
  yellowRef.value?.querySelectorAll('.pupil').forEach((p) => {
    gsap.to(p, { x: -5, y: -4, duration: 0.3, ease: 'power2.out', overwrite: 'auto' });
  });
};

const applyLoginFailed = () => {
  const qt = quickToRef.value;
  if (qt) {
    qt.purpleSkew(0);
    qt.blackSkew(0);
    qt.orangeSkew(0);
    qt.yellowSkew(0);
    qt.purpleX(0);
    qt.blackX(0);
    qt.purpleHeight(400);
  }

  const shakeTimeline = gsap.timeline();
  
  shakeTimeline
    .to(purpleRef.value, { x: -10, duration: 0.1, ease: 'power2.inOut' })
    .to(purpleRef.value, { x: 10, duration: 0.1, ease: 'power2.inOut' })
    .to(purpleRef.value, { x: -10, duration: 0.1, ease: 'power2.inOut' })
    .to(purpleRef.value, { x: 0, duration: 0.1, ease: 'power2.inOut' }, '-=0.05')
    .to(blackRef.value, { x: -8, duration: 0.1, ease: 'power2.inOut' }, '-=0.35')
    .to(blackRef.value, { x: 8, duration: 0.1, ease: 'power2.inOut' }, '-=0.25')
    .to(blackRef.value, { x: -8, duration: 0.1, ease: 'power2.inOut' }, '-=0.15')
    .to(blackRef.value, { x: 0, duration: 0.1, ease: 'power2.inOut' }, '-=0.05')
    .to(orangeRef.value, { x: -6, duration: 0.1, ease: 'power2.inOut' }, '-=0.35')
    .to(orangeRef.value, { x: 6, duration: 0.1, ease: 'power2.inOut' }, '-=0.25')
    .to(orangeRef.value, { x: 0, duration: 0.1, ease: 'power2.inOut' }, '-=0.05')
    .to(yellowRef.value, { x: -6, duration: 0.1, ease: 'power2.inOut' }, '-=0.3')
    .to(yellowRef.value, { x: 6, duration: 0.1, ease: 'power2.inOut' }, '-=0.2')
    .to(yellowRef.value, { x: 0, duration: 0.1, ease: 'power2.inOut' }, '-=0.05');

  const sadTimeline = gsap.timeline();
  sadTimeline
    .to(purpleRef.value?.querySelectorAll('.eyeball-pupil'), { 
      y: 3, duration: 0.3, ease: 'power2.out', overwrite: 'auto' 
    }, 0)
    .to(blackRef.value?.querySelectorAll('.eyeball-pupil'), { 
      y: 3, duration: 0.3, ease: 'power2.out', overwrite: 'auto' 
    }, 0)
    .to(orangeRef.value?.querySelectorAll('.pupil'), { 
      y: 3, duration: 0.3, ease: 'power2.out', overwrite: 'auto' 
    }, 0)
    .to(yellowRef.value?.querySelectorAll('.pupil'), { 
      y: 3, duration: 0.3, ease: 'power2.out', overwrite: 'auto' 
    }, 0);

  if (qt && yellowMouthRef.value) {
    gsap.to(yellowMouthRef.value, { 
      borderRadius: '20px 20px 0 0', 
      borderTop: '3px solid #2D2D2D',
      borderBottom: 'none',
      top: '78px',
      duration: 0.3, 
      ease: 'power2.out' 
    });
  }
};

const resetLoginFailed = () => {
  if (yellowMouthRef.value) {
    gsap.to(yellowMouthRef.value, { 
      borderRadius: '0 0 20px 20px', 
      borderBottom: '3px solid #2D2D2D',
      borderTop: 'none',
      top: '75px',
      duration: 0.3, 
      ease: 'power2.out' 
    });
  }
};

onMounted(() => {
  gsap.set('.pupil', { x: 0, y: 0 });
  gsap.set('.eyeball-pupil', { x: 0, y: 0 });

  if (
    !purpleRef.value ||
    !blackRef.value ||
    !orangeRef.value ||
    !yellowRef.value ||
    !purpleFaceRef.value ||
    !blackFaceRef.value ||
    !orangeFaceRef.value ||
    !yellowFaceRef.value ||
    !yellowMouthRef.value
  ) {
    return;
  }

  quickToRef.value = {
    purpleSkew: gsap.quickTo(purpleRef.value, 'skewX', { duration: 0.3, ease: 'power2.out' }),
    blackSkew: gsap.quickTo(blackRef.value, 'skewX', { duration: 0.3, ease: 'power2.out' }),
    orangeSkew: gsap.quickTo(orangeRef.value, 'skewX', { duration: 0.3, ease: 'power2.out' }),
    yellowSkew: gsap.quickTo(yellowRef.value, 'skewX', { duration: 0.3, ease: 'power2.out' }),
    purpleX: gsap.quickTo(purpleRef.value, 'x', { duration: 0.3, ease: 'power2.out' }),
    blackX: gsap.quickTo(blackRef.value, 'x', { duration: 0.3, ease: 'power2.out' }),
    purpleHeight: gsap.quickTo(purpleRef.value, 'height', { duration: 0.3, ease: 'power2.out' }),
    purpleFaceLeft: gsap.quickTo(purpleFaceRef.value, 'left', { duration: 0.3, ease: 'power2.out' }),
    purpleFaceTop: gsap.quickTo(purpleFaceRef.value, 'top', { duration: 0.3, ease: 'power2.out' }),
    blackFaceLeft: gsap.quickTo(blackFaceRef.value, 'left', { duration: 0.3, ease: 'power2.out' }),
    blackFaceTop: gsap.quickTo(blackFaceRef.value, 'top', { duration: 0.3, ease: 'power2.out' }),
    orangeFaceX: gsap.quickTo(orangeFaceRef.value, 'x', { duration: 0.2, ease: 'power2.out' }),
    orangeFaceY: gsap.quickTo(orangeFaceRef.value, 'y', { duration: 0.2, ease: 'power2.out' }),
    yellowFaceX: gsap.quickTo(yellowFaceRef.value, 'x', { duration: 0.2, ease: 'power2.out' }),
    yellowFaceY: gsap.quickTo(yellowFaceRef.value, 'y', { duration: 0.2, ease: 'power2.out' }),
    mouthX: gsap.quickTo(yellowMouthRef.value, 'x', { duration: 0.2, ease: 'power2.out' }),
    mouthY: gsap.quickTo(yellowMouthRef.value, 'y', { duration: 0.2, ease: 'power2.out' }),
  };

  // 根据页面类型设置初始动画
  const setupPageAnimation = () => {
    const { pageType } = props;
    const qt = quickToRef.value;
    if (!qt) return;

    switch (pageType) {
      case 'register':
        // 注册页：欢迎动画 - 紫色角色轻微挥手
        gsap.to(purpleRef.value, {
          rotate: 5,
          duration: 2,
          repeat: -1,
          yoyo: true,
          ease: 'power2.inOut'
        });
        break;
      case 'reset':
        // 忘记密码页：思考动画 - 紫色角色托腮
        gsap.to(purpleFaceRef.value, {
          y: 5,
          duration: 3,
          repeat: -1,
          yoyo: true,
          ease: 'power2.inOut'
        });
        break;
      default:
        // 登录页：默认动画
        break;
    }
  };

  setupPageAnimation();

  const tick = () => {
    const container = containerRef.value;
    const qt = quickToRef.value;
    if (!container || !qt) return;

    const { isTyping, isHidingPassword, isShowingPassword, isLooking, isLoginFailed } = stateRef.value;

    if (isLoginFailed) {
      rafIdRef.value = requestAnimationFrame(tick);
      return;
    }

    if (purpleRef.value && !isShowingPassword) {
      const pp = calcPos(purpleRef.value);
      if (isTyping || isHidingPassword) {
        qt.purpleSkew(pp.bodySkew - 12);
        qt.purpleX(40);
        qt.purpleHeight(440);
      } else {
        qt.purpleSkew(pp.bodySkew);
        qt.purpleX(0);
        qt.purpleHeight(400);
      }
    }

    if (blackRef.value && !isShowingPassword) {
      const bp = calcPos(blackRef.value);
      if (isLooking) {
        qt.blackSkew(bp.bodySkew * 1.5 + 10);
        qt.blackX(20);
      } else if (isTyping || isHidingPassword) {
        qt.blackSkew(bp.bodySkew * 1.5);
        qt.blackX(0);
      } else {
        qt.blackSkew(bp.bodySkew);
        qt.blackX(0);
      }
    }

    if (orangeRef.value && !isShowingPassword) {
      const op = calcPos(orangeRef.value);
      qt.orangeSkew(op.bodySkew);
      qt.orangeFaceX(op.faceX);
      qt.orangeFaceY(op.faceY);
    }

    if (yellowRef.value && !isShowingPassword) {
      const yp = calcPos(yellowRef.value);
      qt.yellowSkew(yp.bodySkew);
      qt.yellowFaceX(yp.faceX);
      qt.yellowFaceY(yp.faceY);
      qt.mouthX(yp.faceX);
      qt.mouthY(yp.faceY);
    }

    if (purpleRef.value && !isShowingPassword && !isLooking) {
      const pp = calcPos(purpleRef.value);
      const purpleFaceX = pp.faceX >= 0 ? Math.min(25, pp.faceX * 1.5) : pp.faceX;
      qt.purpleFaceLeft(45 + purpleFaceX);
      qt.purpleFaceTop(40 + pp.faceY);
    }

    if (blackRef.value && !isShowingPassword && !isLooking) {
      const bp = calcPos(blackRef.value);
      qt.blackFaceLeft(26 + bp.faceX);
      qt.blackFaceTop(32 + bp.faceY);
    }

    if (!isShowingPassword) {
      container.querySelectorAll('.pupil').forEach((p) => {
        const el = p as HTMLElement;
        const maxDist = Number(el.dataset.maxDistance) || 5;
        const ePos = calcEyePos(el, maxDist);
        gsap.set(el, { x: ePos.x, y: ePos.y });
      });

      if (!isLooking) {
        container.querySelectorAll('.eyeball').forEach((eb) => {
          const el = eb as HTMLElement;
          const maxDist = Number(el.dataset.maxDistance) || 10;
          const pupil = el.querySelector('.eyeball-pupil') as HTMLElement | null;
          if (!pupil) return;
          const ePos = calcEyePos(el, maxDist);
          gsap.set(pupil, { x: ePos.x, y: ePos.y });
        });
      }
    }

    rafIdRef.value = requestAnimationFrame(tick);
  };

  const onMove = (e: MouseEvent) => {
    mouseRef.value = { x: e.clientX, y: e.clientY };
  };

  window.addEventListener('mousemove', onMove, { passive: true });
  rafIdRef.value = requestAnimationFrame(tick);

  const purpleEyeballs = purpleRef.value.querySelectorAll('.eyeball');
  const blackEyeballs = blackRef.value.querySelectorAll('.eyeball');

  const schedulePurpleBlink = () => {
    purpleBlinkTimerRef.value = setTimeout(() => {
      purpleEyeballs.forEach((el) => {
        gsap.to(el, { height: 2, duration: 0.08, ease: 'power2.in' });
      });
      setTimeout(() => {
        purpleEyeballs.forEach((el) => {
          const size = Number((el as HTMLElement).style.width.replace('px', '')) || 18;
          gsap.to(el, { height: size, duration: 0.08, ease: 'power2.out' });
        });
        schedulePurpleBlink();
      }, 150);
    }, Math.random() * 4000 + 3000);
  };

  const scheduleBlackBlink = () => {
    blackBlinkTimerRef.value = setTimeout(() => {
      blackEyeballs.forEach((el) => {
        gsap.to(el, { height: 2, duration: 0.08, ease: 'power2.in' });
      });
      setTimeout(() => {
        blackEyeballs.forEach((el) => {
          const size = Number((el as HTMLElement).style.width.replace('px', '')) || 16;
          gsap.to(el, { height: size, duration: 0.08, ease: 'power2.out' });
        });
        scheduleBlackBlink();
      }, 150);
    }, Math.random() * 4000 + 3000);
  };

  schedulePurpleBlink();
  scheduleBlackBlink();

  onBeforeUnmount(() => {
    window.removeEventListener('mousemove', onMove);
    cancelAnimationFrame(rafIdRef.value);
  });
});

watch(
  () => [props.isTyping, isHidingPassword.value, isShowingPassword.value, isLookingRef.value, props.isLoginFailed, props.pageType, props.isError],
  () => {
    stateRef.value = {
      isTyping: props.isTyping,
      isHidingPassword: isHidingPassword.value,
      isShowingPassword: isShowingPassword.value,
      isLooking: isLookingRef.value,
      isLoginFailed: props.isLoginFailed,
      isError: props.isError,
      pageType: props.pageType,
    };
  },
  { immediate: true },
);

watch(
  () => [props.isLoginFailed, props.isError],
  ([loginFailed, isError]) => {
    if (loginFailed || isError) {
      applyLoginFailed();
    } else {
      resetLoginFailed();
    }
  },
  { immediate: false },
);

watch(
  () => [isShowingPassword.value, props.passwordLength],
  () => {
    if (!isShowingPassword.value || props.passwordLength <= 0) {
      clearTimeout(purplePeekTimerRef.value);
      return;
    }

    const purpleEyePupils = purpleRef.value?.querySelectorAll('.eyeball-pupil');
    if (!purpleEyePupils?.length) return;

    const schedulePeek = () => {
      purplePeekTimerRef.value = setTimeout(() => {
        purpleEyePupils.forEach((p) => {
          gsap.to(p, { x: 4, y: 5, duration: 0.3, ease: 'power2.out', overwrite: 'auto' });
        });
        const qt = quickToRef.value;
        if (qt) {
          qt.purpleFaceLeft(20);
          qt.purpleFaceTop(35);
        }

        setTimeout(() => {
          purpleEyePupils.forEach((p) => {
            gsap.to(p, { x: -4, y: -4, duration: 0.3, ease: 'power2.out', overwrite: 'auto' });
          });
          schedulePeek();
        }, 800);
      }, Math.random() * 3000 + 2000);
    };

    schedulePeek();
  },
  { immediate: true },
);

watch(
  () => [props.isTyping, isShowingPassword.value],
  () => {
    if (props.isTyping && !isShowingPassword.value) {
      isLookingRef.value = true;
      stateRef.value.isLooking = true;
      applyLookAtEachOther();

      clearTimeout(lookingTimerRef.value);
      lookingTimerRef.value = setTimeout(() => {
        isLookingRef.value = false;
        stateRef.value.isLooking = false;
        purpleRef.value?.querySelectorAll('.eyeball-pupil').forEach((p) => {
          gsap.killTweensOf(p);
        });
      }, 800);
    } else {
      clearTimeout(lookingTimerRef.value);
      isLookingRef.value = false;
      stateRef.value.isLooking = false;
    }
  },
  { immediate: true },
);

watch(
  () => [isHidingPassword.value, isShowingPassword.value],
  () => {
    if (isShowingPassword.value) {
      applyShowPassword();
    } else if (isHidingPassword.value) {
      applyHidingPassword();
    }
  },
  { immediate: true },
);

onBeforeUnmount(() => {
  clearTimeout(purpleBlinkTimerRef.value);
  clearTimeout(blackBlinkTimerRef.value);
  clearTimeout(purplePeekTimerRef.value);
  clearTimeout(lookingTimerRef.value);
  cancelAnimationFrame(rafIdRef.value);
});
</script>

<style scoped>
/* 样式已通过内联样式定义，此处无需额外样式 */
</style>
