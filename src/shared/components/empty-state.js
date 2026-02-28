// Empty State Component
export function EmptyState({ icon, title, message, className = '', id = '' }) {
  return `
    <div ${id ? `id="${id}"` : ''} class="flex-1 flex flex-col items-center justify-center text-slate-400 dark:text-text-muted gap-3 text-center p-10 ${className}">
      <div class="text-5xl opacity-30">${icon}</div>
      <h2 class="text-lg font-semibold text-slate-500 dark:text-text-secondary">${title}</h2>
      <p class="text-sm max-w-[360px]">${message}</p>
    </div>
  `;
}
