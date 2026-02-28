// Button Component
export function Button({ label, onClick, id, className = '', variant = 'primary', icon = '', disabled = false, title = '' }) {
  const variants = {
    primary: 'btn-primary',
    secondary: 'btn-secondary',
    danger: 'btn-danger',
    ghost: 'p-2 hover:bg-slate-100 dark:hover:bg-bg-card rounded-md transition-colors'
  };

  const variantClass = variants[variant] || variants.primary;
  
  // Note: For vanilla, we often return strings for innerHTML or elements.
  // We'll return strings for easy template integration.
  return `
    <button 
      ${id ? `id="${id}"` : ''} 
      class="${variantClass} ${className}" 
      ${disabled ? 'disabled' : ''} 
      ${title ? `title="${title}"` : ''}
    >
      ${icon ? icon : ''}
      ${label ? `<span>${label}</span>` : ''}
    </button>
  `;
}
