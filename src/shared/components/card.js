// Card Component
export function Card({ children, className = '', id = '' }) {
  return `
    <div ${id ? `id="${id}"` : ''} class="bg-white dark:bg-bg-card border border-slate-200 dark:border-border rounded-xl transition-all ${className}">
      ${children}
    </div>
  `;
}
