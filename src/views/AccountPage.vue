<template>
  <section class="account-links">
    <article class="panel account-link-panel">
      <div class="panel-heading">
        <p class="eyebrow">Auth</p>
        <h2>Account access</h2>
      </div>

      <div class="link-list">
        <RouterLink class="page-link" to="/auth">
          <span>Sign in</span>
          <small>Use an existing BasicVids account.</small>
        </RouterLink>
        <RouterLink class="page-link" to="/create-account">
          <span>Create account</span>
          <small>Register a new user through the auth service.</small>
        </RouterLink>
      </div>
    </article>

    <article class="panel profile-panel">
      <div class="panel-heading">
        <p class="eyebrow">User</p>
        <h2>Current access</h2>
      </div>
      <pre>{{ currentUserText }}</pre>
    </article>
  </section>
</template>

<script setup>
import { RouterLink } from 'vue-router';

defineProps({
  currentUserText: { type: String, required: true },
});
</script>
