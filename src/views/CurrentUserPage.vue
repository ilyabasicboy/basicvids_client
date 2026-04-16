<template>
  <section class="auth-page-grid">
    <article class="panel profile-panel">
      <div class="panel-heading">
        <p class="eyebrow">User</p>
        <h2>Current user details</h2>
      </div>

      <form v-if="currentUser" class="detail-form" @submit.prevent="submit">
        <dl class="detail-list">
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
            <dt>Email confirmed</dt>
            <dd>{{ currentUser.email_confirmed ? 'Yes' : 'No' }}</dd>
          </div>
          <div>
            <dt>First name</dt>
            <dd v-if="!isEditing">{{ currentUser.first_name || 'Not set' }}</dd>
            <dd v-else>
              <input v-model.trim="form.firstName" type="text" autocomplete="given-name" />
            </dd>
          </div>
          <div>
            <dt>Last name</dt>
            <dd v-if="!isEditing">{{ currentUser.last_name || 'Not set' }}</dd>
            <dd v-else>
              <input v-model.trim="form.lastName" type="text" autocomplete="family-name" />
            </dd>
          </div>
          <div>
            <dt>Admin</dt>
            <dd>{{ currentUser.is_admin ? 'Yes' : 'No' }}</dd>
          </div>
        </dl>

        <div class="form-actions">
          <button v-if="!isEditing" class="primary-button" type="button" @click="startEditing">
            Change
          </button>
          <template v-else>
            <button class="primary-button" type="submit" :disabled="isChangingUser">
              {{ isChangingUser ? 'Saving...' : 'Save changes' }}
            </button>
            <button class="ghost-button" type="button" :disabled="isChangingUser" @click="cancelEditing">
              Cancel
            </button>
          </template>
        </div>
      </form>

      <form v-if="currentUser" class="auth-form" @submit.prevent="submitPassword">
        <div class="panel-heading">
          <p class="eyebrow">Security</p>
          <h2>Change password</h2>
        </div>

        <label>
          <span>Old password</span>
          <input v-model="passwordForm.oldPassword" type="password" autocomplete="current-password" required />
        </label>
        <label>
          <span>New password</span>
          <input v-model="passwordForm.newPassword" type="password" autocomplete="new-password" required />
        </label>
        <label>
          <span>Confirm password</span>
          <input v-model="passwordForm.confirmPassword" type="password" autocomplete="new-password" required />
        </label>
        <button class="primary-button" type="submit" :disabled="isChangingPassword">
          {{ isChangingPassword ? 'Saving...' : 'Change password' }}
        </button>
      </form>

      <div v-else class="empty-state">
        <RouterLink class="inline-link" to="/auth">Sign in to view current user details.</RouterLink>
      </div>
    </article>
  </section>
</template>

<script setup>
import { reactive, ref, watch } from 'vue';
import { RouterLink } from 'vue-router';

const props = defineProps({
  currentUser: { type: Object, default: null },
  isChangingUser: { type: Boolean, default: false },
  isChangingPassword: { type: Boolean, default: false },
});

const emit = defineEmits(['change-password', 'change-user']);
const isEditing = ref(false);
const wasSaving = ref(false);
const wasSavingPassword = ref(false);

const form = reactive({
  firstName: '',
  lastName: '',
});

const passwordForm = reactive({
  oldPassword: '',
  newPassword: '',
  confirmPassword: '',
});

watch(
  () => props.currentUser,
  (user) => {
    form.firstName = user?.first_name || '';
    form.lastName = user?.last_name || '';
    isEditing.value = false;
  },
  { immediate: true },
);

watch(
  () => props.isChangingUser,
  (isChangingUser) => {
    if (isChangingUser) {
      wasSaving.value = true;
      return;
    }

    if (wasSaving.value) {
      wasSaving.value = false;
      isEditing.value = false;
    }
  },
);

watch(
  () => props.isChangingPassword,
  (isChangingPassword) => {
    if (isChangingPassword) {
      wasSavingPassword.value = true;
      return;
    }

    if (wasSavingPassword.value) {
      wasSavingPassword.value = false;
      passwordForm.oldPassword = '';
      passwordForm.newPassword = '';
      passwordForm.confirmPassword = '';
    }
  },
);

function startEditing() {
  form.firstName = props.currentUser?.first_name || '';
  form.lastName = props.currentUser?.last_name || '';
  isEditing.value = true;
}

function cancelEditing() {
  form.firstName = props.currentUser?.first_name || '';
  form.lastName = props.currentUser?.last_name || '';
  isEditing.value = false;
}

function submit() {
  emit('change-user', { ...form });
}

function submitPassword() {
  emit('change-password', { ...passwordForm });
}
</script>
