<script lang="ts" setup>
import { onBeforeUnmount, onMounted, ref } from 'vue';
import { VueTelInput } from 'vue-tel-input';
import 'vue-tel-input/vue-tel-input.css';

const emit = defineEmits(['validate']);

const model = defineModel<string>();

const widthPhone = ref('0');

const bindProps = ref({
  validCharactersOnly: true,
  mode: 'auto',
  defaultCountry: 'BR',
  disabledFetchingCountry: false,
  disabled: false,
  disabledFormatting: false,
  placeholder: '',
  true: false,
  enabledCountryCode: false,
  enabledFlags: true,
  preferredCountries: [],
  onlyCountries: [],
  ignoredCountries: [],
  autocomplete: 'off',
  name: 'telephone',
  maxLen: 25,
  dropdownOptions: {
    disabledDialCode: true,
    showFlags: true,
    showSearchBox: true,
    searchBoxPlaceholder: 'Buscar...',
  },
  inputOptions: {
    showDialCode: true,
  },
});

onBeforeUnmount(() => {
  window.removeEventListener('resize', updateWidthDropdown);
});

onMounted(() => {
  updateWidthDropdown();

  window.addEventListener('resize', updateWidthDropdown);
});

function validate(event: unknown) {
  emit('validate', event);
}

function openDropdown() {
  setTimeout(() => {
    const dropdownList = document.querySelector('.vti__dropdown-list') as HTMLElement;

    if (dropdownList) {
      dropdownList.style.width = widthPhone.value;

      const searchBox = dropdownList.querySelector('.vti__search_box');
      if (searchBox) {
        searchBox.addEventListener('input', () => {
          dropdownList.scrollTop = 0;
        });
      }

      setTimeout(() => {
        dropdownList.classList.add('visible');
      }, 10);
    }
  }, 10);
}

function updateWidthDropdown() {
  if (widthPhone.value == '0') {
    setTimeout(() => {
      const inputTel = document.querySelector('.input-tel') as HTMLElement;
      widthPhone.value = inputTel.offsetWidth + 'px';
    }, 10);
  }
  const inputTel = document.querySelector('.input-tel') as HTMLElement;
  widthPhone.value = inputTel.offsetWidth + 'px';

  const dropdownList = document.querySelector('.vti__dropdown-list') as HTMLElement;

  if (dropdownList) {
    dropdownList.style.width = widthPhone.value;
  }
}
</script>

<template>
  <vue-tel-input
    v-model="model"
    v-bind="bindProps"
    mode="international"
    class="input-tel input input-sm w-full"
    @open="openDropdown"
    @validate="validate"
  />
</template>

<style>
@reference "@/assets/css/main.css";

html[data-theme='forest'] .vue-tel-input {
  border-radius: 32px;
}

html[data-theme='forest'] .vti__dropdown-list.below {
  border-radius: 16px;
}

html[data-theme='forest'] .vti__search_box {
  border-radius: 16px;
  @apply !border-base-content/20;
}

/* Overrides for vue-tel-input to match DaisyUI theme */
.vue-tel-input:not(.input-error) {
  @apply !border-base-content/20;
}

.vue-tel-input.input-error {
  @apply !border-error;
}

.vue-tel-input:focus-within,
.vue-tel-input.\!input:focus-within {
  @apply relative z-50;
  border-color: var(--fallback-p, oklch(var(--p) / 1)) !important;

  box-shadow: none !important;
  outline: none !important;
}

.vue-tel-input.input-error:focus-within {
  @apply !border-error;
}

.vti__dropdown {
  @apply !bg-transparent hover:!bg-base-300;

  border-top-left-radius: inherit !important;
  border-bottom-left-radius: inherit !important;
}

.vti__dropdown-list {
  @apply !bg-base-100 !border-base-content/20 !shadow-xl !z-[9999];
}

.vti__dropdown-item {
  @apply !text-base-content hover:!bg-base-200;
}

.vti__dropdown-item.highlighted {
  @apply !bg-base-200;
}

.vti__dropdown-arrow {
  @apply !text-base-content;
}

.vti__input {
  @apply !bg-transparent !text-base-content !placeholder-base-content/60;
}

.vti__search_box {
  @apply !bg-base-100 !text-base-content !border-base-300;
  width: 100%;
  border-radius: 4px;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 256 256' fill='%239ca3af'%3E%3Cpath d='M229.66,218.34l-50.07-50.06a88.11,88.11,0,1,0-11.31,11.31l50.06,50.07a8,8,0,0,0,11.32-11.32ZM40,112a72,72,0,1,1,72,72A72.08,72.08,0,0,1,40,112Z'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: 12px center;
  background-size: 16px;
  padding-left: 36px !important;
}

.vti__search_box_container {
  padding: 2px 16px 4px 8px;
}

.vti__dropdown-list.below {
  top: 38px;
  left: -13px;
  border-radius: 4px;
}
</style>
