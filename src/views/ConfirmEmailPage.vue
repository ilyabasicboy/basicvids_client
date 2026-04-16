<template>
  <section class="auth-page-grid">
    <article class="panel">
      <div class="panel-heading">
        <p class="eyebrow">Auth</p>
        <h2>Confirm email</h2>
      </div>

      <form class="auth-form" @submit.prevent="submit">
        <label>
          <span>Email</span>
          <input v-model.trim="form.email" type="email" autocomplete="email" required />
        </label>
        <label>
          <span>Confirmation code</span>
          <input v-model.trim="form.code" type="text" inputmode="numeric" autocomplete="one-time-code" required />
        </label>
        <button class="primary-button" type="submit" :disabled="isConfirmingEmail">
          {{ isConfirmingEmail ? 'Confirming...' : 'Confirm email' }}
        </button>
      </form>
    </article>
  </section>
</template>

<script setup>
import { reactive, watch } from 'vue';
import { useRoute } from 'vue-router';

defineProps({
  isConfirmingEmail: { type: Boolean, default: false },
});

const emit = defineEmits(['confirm-email']);
const route = useRoute();

const form = reactive({
  email: String(route.query.email || ''),
  code: '',
});

watch(
  () => route.query.email,
  (email) => {
    form.email = String(email || '');
  },
);

function submit() {
  emit('confirm-email', { ...form });
}
</script>
