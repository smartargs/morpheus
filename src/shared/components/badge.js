// Badge/Label Component
export function Badge({ label, variant = 'default', className = '' }) {
  const variants = {
    default: 'bg-slate-100 dark:bg-bg-input text-slate-500 dark:text-text-secondary',
    success: 'bg-neo-green/10 text-neo-green-readable border border-neo-green/20',
    error: 'bg-red-50 dark:bg-red-500/10 text-red-500 border border-red-200 dark:border-red-500/20',
    info: 'bg-blue-50 dark:bg-blue-500/10 text-blue-500 border border-blue-200 dark:border-blue-500/20'
  };

  const variantClass = variants[variant] || variants.default;

  return `
    <span class="px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${variantClass} ${className}">
      ${label}
    </span>
  `;
}
