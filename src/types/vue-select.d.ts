declare module 'vue-select' {
  import { DefineComponent } from 'vue';

  const VueSelect: DefineComponent<{
    modelValue?: unknown;
    options?: unknown[];
    filterable?: boolean;
    loading?: boolean;
    label?: string;
    placeholder?: string;
    onSearch?: (search: string, loading: (isLoading: boolean) => void) => void;
  }>;

  export default VueSelect;
}
