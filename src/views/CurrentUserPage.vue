<template>
  <section class="user-details-layout">
    <template v-if="currentUser">
      <article class="panel profile-panel user-details-column">
        <div class="panel-heading">
          <div>
            <p class="eyebrow">User</p>
            <h2>Current user details</h2>
          </div>
        </div>

        <form class="detail-form" @submit.prevent="submit">
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
              <dt>Avatar</dt>
              <dd v-if="!isEditing">Stored by the storage service.</dd>
              <dd v-else>
                <input type="file" accept="image/*" @change="onAvatarSelect" />
                <small>{{ form.avatar ? form.avatar.name : 'Keep current avatar.' }}</small>
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

        <div class="danger-zone">
          <div>
            <p class="eyebrow">Danger</p>
            <h2>Delete user</h2>
          </div>
          <button class="danger-button" type="button" @click="isDeleteModalOpen = true">
            Delete user
          </button>
        </div>
      </article>

      <article class="panel user-password-column">
        <div class="panel-heading">
          <p class="eyebrow">Security</p>
          <h2>Change password</h2>
        </div>

        <form class="auth-form" @submit.prevent="submitPassword">
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
      </article>

      <div v-if="isDeleteModalOpen" class="modal-backdrop" role="presentation" @click.self="closeDeleteModal">
        <section class="modal-panel" role="dialog" aria-modal="true" aria-labelledby="delete-user-title">
          <div class="panel-heading">
            <p class="eyebrow">Confirm</p>
            <h2 id="delete-user-title">Delete user</h2>
          </div>
          <p class="modal-copy">
            This will delete your account and sign you out.
          </p>
          <div class="form-actions">
            <button class="danger-button" type="button" :disabled="isDeletingUser" @click="confirmDeleteUser">
              {{ isDeletingUser ? 'Deleting...' : 'Delete user' }}
            </button>
            <button class="ghost-button" type="button" :disabled="isDeletingUser" @click="closeDeleteModal">
              Cancel
            </button>
          </div>
        </section>
      </div>
    </template>

    <div v-else class="empty-state">
      <RouterLink class="inline-link" to="/auth">Sign in to view current user details.</RouterLink>
    </div>
  </section>
</template>

<script setup>
import { reactive, ref, watch } from 'vue';
import { RouterLink } from 'vue-router';

const props = defineProps({
  currentUser: { type: Object, default: null },
  isChangingUser: { type: Boolean, default: false },
  isChangingPassword: { type: Boolean, default: false },
  isDeletingUser: { type: Boolean, default: false },
  avatarUrl: { type: Function, required: true },
});

const emit = defineEmits(['change-password', 'change-user', 'delete-user']);
const isEditing = ref(false);
const isDeleteModalOpen = ref(false);
const wasSaving = ref(false);
const wasSavingPassword = ref(false);

const form = reactive({
  firstName: '',
  lastName: '',
  avatar: null,
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
    form.avatar = null;
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
  form.avatar = null;
  isEditing.value = true;
}

function cancelEditing() {
  form.firstName = props.currentUser?.first_name || '';
  form.lastName = props.currentUser?.last_name || '';
  form.avatar = null;
  isEditing.value = false;
}

function onAvatarSelect(event) {
  form.avatar = event.target.files?.[0] || null;
}

function submit() {
  emit('change-user', { ...form });
}

function submitPassword() {
  emit('change-password', { ...passwordForm });
}

function closeDeleteModal() {
  if (!props.isDeletingUser) {
    isDeleteModalOpen.value = false;
  }
}

function confirmDeleteUser() {
  emit('delete-user');
}
</script>
