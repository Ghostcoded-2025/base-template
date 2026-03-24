<script setup lang="ts">
import chromeInstallIcon from '@/assets/chrome-install-icon.png'
import edgeInstallIcon from '@/assets/edge-install-icon.png'
import iosAddToHomeIcon from '@/assets/ios-add-to-home-icon.png'
import iosMoreIcon from '@/assets/ios-more-icon.png'
import iosShareIcon from '@/assets/ios-share-icon.png'
import { library } from '@fortawesome/fontawesome-svg-core'
import { faEllipsisVertical } from '@fortawesome/free-solid-svg-icons'
import { isRunningAsInstalledPwa } from '@/lib/pwa'
import { computed, onMounted, onUnmounted, ref } from 'vue'

library.add(faEllipsisVertical)

type BrowserKind = 'safari' | 'chrome' | 'edge' | 'firefox' | 'other'

type Scenario =
  | 'auto'
  | 'ios-safari'
  | 'ios-other'
  | 'android-chrome-edge'
  | 'android-other'
  | 'desktop-chrome'
  | 'desktop-edge'
  | 'desktop-safari'
  | 'desktop-firefox'
  | 'desktop-other'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

function isBeforeInstallPromptEvent(e: Event): e is BeforeInstallPromptEvent {
  return (
    'prompt' in e &&
    typeof (e as BeforeInstallPromptEvent).prompt === 'function'
  )
}

const isIOS = ref(false)
const isAndroid = ref(false)
const isDesktop = ref(false)
const browser = ref<BrowserKind>('other')
const isStandalone = ref(false)
const selectedScenario = ref<Scenario>('auto')
const deferredPrompt = ref<BeforeInstallPromptEvent | null>(null)
const installPromptLoading = ref(false)

const siteOrigin = computed(() => {
  if (typeof window === 'undefined') {
    return ''
  }
  return window.location.origin
})

function onBeforeInstallPrompt(e: Event) {
  if (!isBeforeInstallPromptEvent(e)) {
    return
  }
  e.preventDefault()
  deferredPrompt.value = e
}

onMounted(() => {
  if (typeof window === 'undefined') {
    return
  }

  const ua = window.navigator.userAgent || ''
  const uaLower = ua.toLowerCase()

  const iosMatch =
    /iphone|ipad|ipod/.test(uaLower) ||
    (uaLower.includes('macintosh') && navigator.maxTouchPoints > 1)
  const androidMatch = uaLower.includes('android')

  isIOS.value = iosMatch
  isAndroid.value = androidMatch
  isDesktop.value = !iosMatch && !androidMatch

  if (ua.includes('EdgiOS') || ua.includes('Edg/')) {
    browser.value = 'edge'
  } else if (ua.includes('CriOS')) {
    browser.value = 'chrome'
  } else if (ua.includes('FxiOS')) {
    browser.value = 'firefox'
  } else if (ua.includes('Chrome/')) {
    browser.value = 'chrome'
  } else if (ua.includes('Firefox/')) {
    browser.value = 'firefox'
  } else if (ua.includes('Safari/')) {
    browser.value = 'safari'
  } else {
    browser.value = 'other'
  }

  isStandalone.value = isRunningAsInstalledPwa()

  window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt)
})

onUnmounted(() => {
  if (typeof window === 'undefined') {
    return
  }
  window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt)
})

const detectedScenario = computed<Exclude<Scenario, 'auto'>>(() => {
  if (isIOS.value && browser.value === 'safari') {
    return 'ios-safari'
  }
  if (isIOS.value) {
    return 'ios-other'
  }
  if (
    isAndroid.value &&
    (browser.value === 'chrome' || browser.value === 'edge')
  ) {
    return 'android-chrome-edge'
  }
  if (isAndroid.value) {
    return 'android-other'
  }
  if (isDesktop.value && browser.value === 'chrome') {
    return 'desktop-chrome'
  }
  if (isDesktop.value && browser.value === 'edge') {
    return 'desktop-edge'
  }
  if (isDesktop.value && browser.value === 'firefox') {
    return 'desktop-firefox'
  }
  if (isDesktop.value && browser.value === 'safari') {
    return 'desktop-safari'
  }
  return 'desktop-other'
})

const activeScenario = computed<Exclude<Scenario, 'auto'>>(() =>
  selectedScenario.value === 'auto'
    ? detectedScenario.value
    : selectedScenario.value,
)

const showIosSafari = computed(() => activeScenario.value === 'ios-safari')
const showIosOther = computed(() => activeScenario.value === 'ios-other')
const showAndroidChromeEdge = computed(
  () => activeScenario.value === 'android-chrome-edge',
)
const showAndroidOther = computed(
  () => activeScenario.value === 'android-other',
)
const showDesktopChrome = computed(
  () => activeScenario.value === 'desktop-chrome',
)
const showDesktopEdge = computed(() => activeScenario.value === 'desktop-edge')
const showDesktopSafari = computed(
  () => activeScenario.value === 'desktop-safari',
)
const showDesktopFirefox = computed(
  () => activeScenario.value === 'desktop-firefox',
)
const showDesktopOther = computed(
  () => activeScenario.value === 'desktop-other',
)

const showFallback = computed(
  () =>
    !showIosSafari.value &&
    !showIosOther.value &&
    !showAndroidChromeEdge.value &&
    !showAndroidOther.value &&
    !showDesktopChrome.value &&
    !showDesktopEdge.value &&
    !showDesktopSafari.value &&
    !showDesktopFirefox.value &&
    !showDesktopOther.value,
)

async function runInstallPrompt() {
  const ev = deferredPrompt.value
  if (!ev) {
    return
  }
  installPromptLoading.value = true
  try {
    await ev.prompt()
    await ev.userChoice
  } finally {
    deferredPrompt.value = null
    installPromptLoading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
    <div class="mx-auto max-w-3xl">
      <div class="mb-8">
        <h1 class="mb-3 text-3xl font-bold text-gray-900">
          Install Base Template on your device
        </h1>
        <p class="max-w-2xl text-gray-600">
          Base Template is a progressive web app. You can add it to your home screen or install it
          like a native app—no app store required.
        </p>
        <div class="mt-4">
          <label
            for="install-scenario"
            class="mb-1 block text-xs font-medium text-gray-600"
          >
            View instructions for
          </label>
          <select
            id="install-scenario"
            v-model="selectedScenario"
            class="block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary sm:w-72"
          >
            <option value="auto">
              Auto-detect
            </option>
            <option value="ios-safari">
              iPhone or iPad · Safari
            </option>
            <option value="ios-other">
              iPhone or iPad · other browser
            </option>
            <option value="android-chrome-edge">
              Android · Chrome/Edge
            </option>
            <option value="android-other">
              Android · other browser
            </option>
            <option value="desktop-chrome">
              Desktop · Chrome
            </option>
            <option value="desktop-edge">
              Desktop · Edge
            </option>
            <option value="desktop-safari">
              Desktop · Safari
            </option>
            <option value="desktop-firefox">
              Desktop · Firefox
            </option>
            <option value="desktop-other">
              Desktop · other browser
            </option>
          </select>
        </div>
      </div>

      <div
        v-if="deferredPrompt && !isStandalone"
        class="card mb-8 rounded border border-gray-200 bg-white p-6 shadow-sm"
      >
        <h2 class="mb-2 text-lg font-semibold text-gray-900">
          Install from your browser
        </h2>
        <p class="text-gray-600">
          Your browser can install this app directly.
        </p>
        <button
          type="button"
          class="mt-3 inline-flex items-center rounded border border-gray-900 bg-gray-900 px-3 py-2 text-sm text-white disabled:opacity-50"
          :disabled="installPromptLoading"
          @click="runInstallPrompt"
        >
          {{ installPromptLoading ? 'Working…' : 'Install' }}
        </button>
      </div>

      <div
        v-if="isStandalone"
        class="card mb-8 rounded border border-emerald-200 bg-emerald-50 p-6"
      >
        <h2 class="mb-2 text-lg font-semibold text-gray-900">
          You’re all set
        </h2>
        <p class="text-gray-600">
          It looks like Base Template is already installed and running in app mode on this device. You
          can launch it again from your home screen, app drawer, or dock.
        </p>
      </div>

      <div class="space-y-6">
        <section
          v-if="showIosSafari"
          class="card rounded border border-gray-200 bg-white p-6 shadow-sm"
        >
          <h2 class="mb-3 text-xl font-semibold text-gray-900">
            iPhone or iPad (Safari)
          </h2>
          <p class="mb-3 text-gray-600">
            On iOS, apps like Base Template can be installed from Safari using “Add to Home Screen”.
            If you are not already there, open
            <span class="font-mono text-[0.8rem] text-gray-900">{{ siteOrigin }}</span>
            in Safari first.
          </p>
          <ol class="list-decimal space-y-2 pl-5 text-gray-600">
            <li>
              Tap the three dots (<span class="font-medium text-gray-900">More</span>) button to reveal the full
              toolbar
              <img
                :src="iosMoreIcon"
                alt="More button icon"
                class="ml-1 inline-block h-4 w-auto align-middle"
              >.
            </li>
            <li>
              Tap
              <img
                :src="iosShareIcon"
                alt="Share button icon"
                class="mx-1 inline-block h-4 w-auto align-middle"
              >
              Share in the toolbar.
            </li>
            <li>
              Scroll down in the sheet and tap
              <img
                :src="iosAddToHomeIcon"
                alt="Add to Home Screen icon"
                class="mr-1 inline-block h-4 w-auto align-middle"
              >
              <span class="font-medium text-gray-900">Add to Home Screen</span>
              .
            </li>
            <li>
              Tap
              <span class="font-medium text-gray-900">Add</span>.
            </li>
          </ol>
        </section>

        <section
          v-else-if="showIosOther"
          class="card rounded border border-gray-200 bg-white p-6 shadow-sm"
        >
          <h2 class="mb-3 text-xl font-semibold text-gray-900">
            iPhone or iPad (other browser)
          </h2>
          <p class="mb-3 text-gray-600">
            iOS only lets you install web apps to the home screen from Safari.
          </p>
          <ol class="list-decimal space-y-2 pl-5 text-gray-600">
            <li>Copy this page’s address <span class="font-mono text-[0.8rem] text-gray-900">{{ siteOrigin }}</span>.</li>
            <li>
              Open Safari and paste the URL into the address bar.
            </li>
          </ol>
        </section>

        <section
          v-else-if="showAndroidChromeEdge"
          class="card rounded border border-gray-200 bg-white p-6 shadow-sm"
        >
          <h2 class="mb-3 text-xl font-semibold text-gray-900">
            Android (Chrome or Edge)
          </h2>
          <p class="mb-3 text-gray-600">
            Most Android browsers let you install Base Template so it behaves like a native app.
          </p>
          <ol class="list-decimal space-y-2 pl-5 text-gray-600">
            <li>
              Look for an <span class="font-medium text-gray-900">Install</span> or
              <span class="font-medium text-gray-900">Add to Home screen</span> prompt near the address bar, or:
            </li>
            <li>
              Open the browser menu
              <FontAwesomeIcon
                icon="ellipsis-vertical"
                class="mx-1 inline-block h-4 w-4 align-middle text-gray-600"
                aria-hidden="true"
              />
              (three dots), then tap
              <span class="font-medium text-gray-900">Install app</span> or
              <span class="font-medium text-gray-900">Add to Home screen</span>.
              On Edge you may see <span class="font-medium text-gray-900">Add to phone</span> instead.
            </li>
            <li>Confirm the install. Base Template will appear in your app drawer and on your home screen.</li>
          </ol>
          <p class="mt-3 text-xs text-gray-500">
            If you don’t see the install option, make sure you’re online, using HTTPS, and have
            kept this page open for a few seconds.
          </p>
        </section>

        <section
          v-else-if="showAndroidOther"
          class="card rounded border border-gray-200 bg-white p-6 shadow-sm"
        >
          <h2 class="mb-3 text-xl font-semibold text-gray-900">
            Android (other browser)
          </h2>
          <p class="mb-3 text-gray-600">
            Some Android browsers have limited support for installing web apps.
          </p>
          <ol class="list-decimal space-y-2 pl-5 text-gray-600">
            <li>
              Check the browser menu for an option like
              <span class="font-medium text-gray-900">Install app</span> or
              <span class="font-medium text-gray-900">Add to Home screen</span>.
            </li>
            <li>If you don’t see it, try opening this site in Chrome for the best install experience.</li>
          </ol>
        </section>

        <section
          v-else-if="showDesktopChrome"
          class="card rounded border border-gray-200 bg-white p-6 shadow-sm"
        >
          <h2 class="mb-3 text-xl font-semibold text-gray-900">
            Desktop (Chrome)
          </h2>
          <p class="mb-3 text-gray-600">
            You can install Base Template as a standalone app window on your computer.
          </p>
          <ol class="list-decimal space-y-2 pl-5 text-gray-600">
            <li>
              Look for this install icon near the address bar:
              <img
                :src="chromeInstallIcon"
                alt="Chrome install icon"
                class="ml-1 inline-block h-5 w-auto align-middle"
              >
            </li>
            <li>
              Click it, then choose <span class="font-medium text-gray-900">Install</span> or
              <span class="font-medium text-gray-900">Install Base Template</span>.
            </li>
            <li>
              Base Template will open in its own window and can be pinned to your taskbar or dock like
              a regular app.
            </li>
            <li>
              You may also see an <span class="font-medium text-gray-900">Install</span> control on this page when Chromium can install the site (same as the prompt above the steps, when it appears).
            </li>
          </ol>
        </section>

        <section
          v-else-if="showDesktopEdge"
          class="card rounded border border-gray-200 bg-white p-6 shadow-sm"
        >
          <h2 class="mb-3 text-xl font-semibold text-gray-900">
            Desktop (Edge)
          </h2>
          <p class="mb-3 text-gray-600">
            Microsoft Edge also lets you install Base Template as its own app window.
          </p>
          <ol class="list-decimal space-y-2 pl-5 text-gray-600">
            <li>
              Look for this app icon near the address bar:
              <img
                :src="edgeInstallIcon"
                alt="Edge install icon"
                class="ml-1 inline-block h-5 w-auto align-middle"
              >
            </li>
            <li>
              Click it, then choose <span class="font-medium text-gray-900">Install</span> or
              <span class="font-medium text-gray-900">Install this site as an app</span>.
            </li>
            <li>
              Or open the menu
              <FontAwesomeIcon
                icon="ellipsis-vertical"
                class="mx-1 inline-block h-4 w-4 align-middle text-gray-600"
                aria-hidden="true"
              />
              and look for <span class="font-medium text-gray-900">Apps</span>
              → <span class="font-medium text-gray-900">Install this site as an app</span>.
            </li>
            <li>
              Base Template will open in its own window and can be pinned to your taskbar or Start
              menu.
            </li>
          </ol>
        </section>

        <section
          v-else-if="showDesktopSafari"
          class="card rounded border border-gray-200 bg-white p-6 shadow-sm"
        >
          <h2 class="mb-3 text-xl font-semibold text-gray-900">
            Desktop (Safari)
          </h2>
          <p class="mb-3 text-gray-600">
            Safari on macOS does not install progressive web apps the same way Chrome or Edge does on the desktop.
          </p>
          <p class="text-gray-600">
            Use Chrome or Edge on your computer to install Base Template, or open
            <span class="font-mono text-[0.8rem] text-gray-900">{{ siteOrigin }}</span>
            on an iPhone or iPad in Safari and use <span class="font-medium text-gray-900">Add to Home Screen</span> there.
          </p>
        </section>

        <section
          v-else-if="showDesktopFirefox"
          class="card rounded border border-gray-200 bg-white p-6 shadow-sm"
        >
          <h2 class="mb-3 text-xl font-semibold text-gray-900">
            Desktop (Firefox)
          </h2>
          <p class="mb-3 text-gray-600">
            Firefox on desktop has limited support for installing progressive web apps.
          </p>
          <p class="text-gray-600">
            Try Chrome or Edge to install Base Template on this computer, or use your phone’s browser and follow the Android or iPhone instructions above.
          </p>
        </section>

        <section
          v-else-if="showFallback || showDesktopOther"
          class="card rounded border border-gray-200 bg-white p-6 shadow-sm"
        >
          <h2 class="mb-3 text-xl font-semibold text-gray-900">
            Using another browser
          </h2>
          <p class="mb-3 text-gray-600">
            Your browser may have limited support for installing progressive web apps.
          </p>
          <ol class="list-decimal space-y-2 pl-5 text-gray-600">
            <li>
              Check your browser’s menu for options like
              <span class="font-medium text-gray-900">Install</span>,
              <span class="font-medium text-gray-900">Install app</span>,
              <span class="font-medium text-gray-900">Add to Home screen</span>, or
              <span class="font-medium text-gray-900">Add to phone</span>.
            </li>
            <li>
              If you don’t see any install option, try opening
              <span class="font-mono text-[0.8rem] text-gray-900">{{ siteOrigin }}</span>
              in Chrome, Edge, or Safari (on iOS) for the best experience.
            </li>
          </ol>
          <p class="mt-3 text-sm text-gray-600">
            In general, open
            <span class="font-mono text-[0.8rem] text-gray-900">{{ siteOrigin }}</span>
            in a recent Chrome, Edge, or mobile Safari and look in the menu or address bar for an install or “add to home” option.
          </p>
        </section>
      </div>
    </div>
  </div>
</template>
