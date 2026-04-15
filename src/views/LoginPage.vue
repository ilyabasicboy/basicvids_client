<template>
  <section class="auth-page-grid">
    <article class="panel">
      <div class="panel-heading">
        <p class="eyebrow">Auth</p>
        <h2>Sign in</h2>
      </div>

      <form class="auth-form" @submit.prevent="submit">
        <label>
          <span>Username or email</span>
          <input v-model="credentials.identifier" type="text" autocomplete="username" required />
        </label>
        <label>
          <span>Password</span>
          <input v-model="credentials.password" type="password" autocomplete="current-password" required />
        </label>
        <button class="primary-button" type="submit" :disabled="isSigningIn">
          {{ isSigningIn ? 'Signing in...' : 'Sign in' }}
        </button>
      </form>
    </article>
  </section>
</template>

<script setup>
import { reactive } from 'vue';

defineProps({
  isSigningIn: { type: Boolean, default: false },
});

const emit = defineEmits(['login']);

const credentials = reactive({
  identifier: '',
  password: '',
});

function submit() {
  emit('login', { ...credentials });
}
</script>
