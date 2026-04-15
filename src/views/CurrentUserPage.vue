<template>
  <section class="auth-page-grid">
    <article class="panel profile-panel">
      <div class="panel-heading">
        <p class="eyebrow">User</p>
        <h2>Current user details</h2>
      </div>

      <dl v-if="currentUser" class="detail-list">
        <div>
          <dt>ID</dt>
          <dd>{{ currentUser.id }}</dd>
        </div>
        <div>
          <dt>Username</dt>
          <dd>{{ currentUser.username }}</dd>
        </div>
        <div>
          <dt>Email</dt>
          <dd>{{ currentUser.email }}</dd>
        </div>
        <div>
          <dt>First name</dt>
          <dd>{{ currentUser.first_name || 'Not set' }}</dd>
        </div>
        <div>
          <dt>Last name</dt>
          <dd>{{ currentUser.last_name || 'Not set' }}</dd>
        </div>
        <div>
          <dt>Admin</dt>
          <dd>{{ currentUser.is_admin ? 'Yes' : 'No' }}</dd>
        </div>
      </dl>

      <div v-else class="empty-state">
        <RouterLink class="inline-link" to="/auth">Sign in to view current user details.</RouterLink>
      </div>
    </article>
  </section>
</template>

<script setup>
import { RouterLink } from 'vue-router';

defineProps({
  currentUser: { type: Object, default: null },
});
</script>
