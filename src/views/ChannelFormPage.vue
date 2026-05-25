<template>
  <section class="auth-page-grid">
    <article v-if="isAuthenticated" class="panel">
      <div class="panel-heading">
        <p class="eyebrow">Channel</p>
        <h2>{{ isEditMode ? 'Edit channel' : 'Create channel' }}</h2>
      </div>
      <form class="auth-form" @submit.prevent="submit">
        <label>
          <span>Name</span>
          <input v-model.trim="form.name" type="text" required @input="syncSlugFromName" />
        </label>
        <label>
          <span>Slug</span>
          <input v-model.trim="form.slug" type="text" placeholder="Generated from name" @input="markSlugEdited" />
        </label>
        <label>
          <span>Description</span>
          <textarea v-model.trim="form.description" rows="5"></textarea>
        </label>
        <label class="avatar-upload-field channel-avatar-field">
          <span>Avatar</span>
          <ChannelAvatar
            v-if="isEditMode"
            class="channel-form-avatar"
            :channel-id="String(route.params.channelId)"
            :label="form.name || 'Channel'"
            :channel-avatar-url="channelAvatarUrl"
          />
          <input type="file" accept="image/*" @change="onAvatarSelect" />
          <small>{{ form.avatar ? form.avatar.name : (isEditMode ? 'Keep current avatar.' : 'Choose a channel image.') }}</small>
        </label>
        <div class="form-actions">
          <button class="primary-button" type="submit" :disabled="isSaving || !form.name">
            {{ isSaving ? 'Saving...' : (isEditMode ? 'Save channel' : 'Create channel') }}
          </button>
          <button v-if="isEditMode" class="ghost-button" type="button" :disabled="isDeletingAvatar" @click="removeAvatar">
            {{ isDeletingAvatar ? 'Removing avatar...' : 'Remove avatar' }}
          </button>
          <button v-if="isEditMode" class="danger-button" type="button" :disabled="isDeleting" @click="removeChannel">
            {{ isDeleting ? 'Deleting...' : 'Delete channel' }}
          </button>
        </div>
      </form>
    </article>
    <article v-else class="panel">
      <div class="empty-state">
        <RouterLink class="inline-link" to="/auth">Sign in to manage channels.</RouterLink>
      </div>
    </article>
  </section>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue';
import { RouterLink, useRoute, useRouter } from 'vue-router';
import ChannelAvatar from '../components/ChannelAvatar.vue';

const props = defineProps({
  isAuthenticated: { type: Boolean, default: false },
  loadChannel: { type: Function, required: true },
  createChannel: { type: Function, required: true },
  changeChannel: { type: Function, required: true },
  deleteChannel: { type: Function, required: true },
  uploadChannelAvatar: { type: Function, required: true },
  deleteChannelAvatar: { type: Function, required: true },
  channelAvatarUrl: { type: Function, required: true },
});

const route = useRoute();
const router = useRouter();
const isSaving = ref(false);
const isDeleting = ref(false);
const isDeletingAvatar = ref(false);
const slugEdited = ref(false);
const form = reactive({ name: '', slug: '', description: '', avatar: null });
const isEditMode = computed(() => Boolean(route.params.channelId));

function slugify(value) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/-{2,}/g, '-')
    .replace(/^-+|-+$/g, '');
}

function syncSlugFromName() {
  if (!isEditMode.value && !slugEdited.value) {
    form.slug = slugify(form.name);
  }
}

function markSlugEdited() {
  slugEdited.value = true;
  form.slug = slugify(form.slug);
}

function onAvatarSelect(event) {
  form.avatar = event.target.files?.[0] || null;
}

async function loadForm() {
  if (!isEditMode.value) return;
  const channel = await props.loadChannel(route.params.channelId);
  form.name = channel.name || '';
  form.slug = channel.slug || '';
  form.description = channel.description || '';
  slugEdited.value = true;
}

async function submit() {
  isSaving.value = true;
  try {
    const payload = {
      name: form.name,
      slug: form.slug || null,
      description: form.description || null,
    };
    const saved = isEditMode.value
      ? await props.changeChannel(route.params.channelId, payload)
      : await props.createChannel(payload);
    if (form.avatar) {
      await props.uploadChannelAvatar(saved.id, form.avatar);
    }
    await router.push(`/channels/${saved.id}`);
  } finally {
    isSaving.value = false;
  }
}

async function removeAvatar() {
  isDeletingAvatar.value = true;
  try {
    await props.deleteChannelAvatar(route.params.channelId);
    form.avatar = null;
  } finally {
    isDeletingAvatar.value = false;
  }
}

async function removeChannel() {
  isDeleting.value = true;
  try {
    await props.deleteChannel(route.params.channelId);
    await router.push('/channels');
  } finally {
    isDeleting.value = false;
  }
}

onMounted(loadForm);
</script>
