<template>
  <section class="auth-page-grid">
    <article class="panel">
      <div class="panel-heading">
        <p class="eyebrow">Auth</p>
        <h2>Create account</h2>
      </div>

      <form class="auth-form" @submit.prevent="submit">
        <label>
          <span>Username</span>
          <input v-model.trim="account.username" type="text" autocomplete="username" required />
        </label>
        <div class="field-row">
          <label>
            <span>First name</span>
            <input v-model.trim="account.firstName" type="text" autocomplete="given-name" />
          </label>
          <label>
            <span>Last name</span>
            <input v-model.trim="account.lastName" type="text" autocomplete="family-name" />
          </label>
        </div>
        <label>
          <span>Email</span>
          <input v-model.trim="account.email" type="email" autocomplete="email" required />
        </label>
        <label class="avatar-upload-field">
          <span>Avatar</span>
          <input type="file" accept="image/*" @change="onAvatarSelect" />
          <small>{{ account.avatar ? account.avatar.name : 'Choose a profile picture.' }}</small>
        </label>
        <label>
          <span>Password</span>
          <input v-model="account.password" type="password" autocomplete="new-password" required />
        </label>
        <label>
          <span>Confirm password</span>
          <input v-model="account.confirmPassword" type="password" autocomplete="new-password" required />
        </label>
        <button class="primary-button" type="submit" :disabled="isCreatingAccount">
          {{ isCreatingAccount ? 'Creating...' : 'Create account' }}
        </button>
      </form>
    </article>
  </section>
</template>

<script setup>
import { reactive } from 'vue';

defineProps({
  isCreatingAccount: { type: Boolean, default: false },
});

const emit = defineEmits(['create-account']);

const account = reactive({
  username: '',
  firstName: '',
  lastName: '',
  email: '',
  avatar: null,
  password: '',
  confirmPassword: '',
});

function onAvatarSelect(event) {
  account.avatar = event.target.files?.[0] || null;
}

function submit() {
  emit('create-account', { ...account });
}
</script>
