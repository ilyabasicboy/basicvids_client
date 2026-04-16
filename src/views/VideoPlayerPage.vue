<template>
  <section class="video-player-page">
    <article class="panel">
      <div class="panel-heading inline">
        <div>
          <p class="eyebrow">Player</p>
          <h2>{{ videoTitle }}</h2>
        </div>
        <div class="form-actions">
          <button v-if="canEdit" class="danger-button" type="button" @click="$emit('delete-video', video)">
            Delete video
          </button>
          <RouterLink class="ghost-link" to="/videos">Back to videos</RouterLink>
        </div>
      </div>

      <div v-if="isLoading" class="empty-state">Loading video...</div>
      <div v-else-if="errorMessage" class="empty-state">{{ errorMessage }}</div>
      <video v-else-if="video" class="video-player" :src="videoUrl(video.id)" controls preload="metadata">
        Your browser cannot play this video.
      </video>
      <div v-else class="empty-state">Video not found.</div>

      <form v-if="video" class="detail-form" @submit.prevent="submit">
        <dl class="detail-list">
          <div>
            <dt>Title</dt>
            <dd v-if="!isEditing">{{ video.title || 'Untitled video' }}</dd>
            <dd v-else>
              <input v-model.trim="form.title" type="text" required />
            </dd>
          </div>
          <div>
            <dt>Description</dt>
            <dd v-if="!isEditing">{{ video.description || 'No description.' }}</dd>
            <dd v-else>
              <textarea v-model.trim="form.description" rows="5"></textarea>
            </dd>
          </div>
          <div>
            <dt>Author</dt>
            <dd>{{ authorLabel }}</dd>
          </div>
        </dl>

        <div v-if="canEdit" class="form-actions">
          <button v-if="!isEditing" class="primary-button" type="button" @click="startEditing">
            Change
          </button>
          <template v-else>
            <button class="primary-button" type="submit" :disabled="isChangingVideo">
              {{ isChangingVideo ? 'Saving...' : 'Save changes' }}
            </button>
            <button class="ghost-button" type="button" :disabled="isChangingVideo" @click="cancelEditing">
              Cancel
            </button>
          </template>
        </div>
      </form>
    </article>
  </section>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { RouterLink, useRoute } from 'vue-router';

const props = defineProps({
  currentUser: { type: Object, default: null },
  changeVideo: { type: Function, required: true },
  isChangingVideo: { type: Boolean, default: false },
  loadVideo: { type: Function, required: true },
  videoUrl: { type: Function, required: true },
});

defineEmits(['delete-video']);

const route = useRoute();
const video = ref(null);
const isLoading = ref(false);
const errorMessage = ref('');
const isEditing = ref(false);
const videoTitle = computed(() => video.value?.title || video.value?.original_filename || 'Video');
const canEdit = computed(() => Boolean(video.value && props.currentUser?.id === video.value.author_id));
const authorLabel = computed(() => {
  if (!video.value) {
    return 'Unknown author';
  }

  if (props.currentUser?.id === video.value.author_id) {
    const currentUserName = [props.currentUser.first_name, props.currentUser.last_name].filter(Boolean).join(' ');
    return currentUserName || props.currentUser.username || 'You';
  }

  const fullName = [video.value.author_first_name, video.value.author_last_name].filter(Boolean).join(' ');
  return fullName || video.value.author_username || 'Unknown author';
});

const form = reactive({
  title: '',
  description: '',
});

async function loadCurrentVideo() {
  isLoading.value = true;
  errorMessage.value = '';

  try {
    video.value = await props.loadVideo(route.params.videoId);
    resetForm();
  } catch (error) {
    video.value = null;
    errorMessage.value = error.message || 'Video not found.';
  } finally {
    isLoading.value = false;
  }
}

function resetForm() {
  form.title = video.value?.title || '';
  form.description = video.value?.description || '';
}

function startEditing() {
  resetForm();
  isEditing.value = true;
}

function cancelEditing() {
  resetForm();
  isEditing.value = false;
}

async function submit() {
  const changedVideo = await props.changeVideo(video.value.id, {
    title: form.title,
    description: form.description,
  });
  video.value = changedVideo;
  resetForm();
  isEditing.value = false;
}

onMounted(loadCurrentVideo);
watch(() => route.params.videoId, loadCurrentVideo);
</script>
