type AppointmentStatusMeta = {
  label: string;
  badgeClass: string;
};

const APPOINTMENT_STATUS_META = {
  pending: { label: 'Pendente', badgeClass: 'badge-warning' },
  accepted: { label: 'Confirmado', badgeClass: 'badge-success' },
  rejected: { label: 'Recusado', badgeClass: 'badge-error' },
} as const satisfies Record<string, AppointmentStatusMeta>;

const DEFAULT_STATUS_META: AppointmentStatusMeta = {
  label: 'Sem status',
  badgeClass: 'badge-outline',
};

function normalizeStatus(status?: string | null): string {
  return status?.trim().toLowerCase() ?? '';
}

function formatFallbackLabel(status: string): string {
  return status
    .replace(/[_-]+/g, ' ')
    .split(' ')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export function getAppointmentStatusMeta(
  status?: string | null
): AppointmentStatusMeta {
  const key = normalizeStatus(status);

  if (key in APPOINTMENT_STATUS_META) {
    return APPOINTMENT_STATUS_META[key as keyof typeof APPOINTMENT_STATUS_META];
  }

  if (!key) {
    return DEFAULT_STATUS_META;
  }

  return {
    label: formatFallbackLabel(key),
    badgeClass: 'badge-outline',
  };
}
