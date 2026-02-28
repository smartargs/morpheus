// Input Components
export function Input({ id, placeholder = '', type = 'text', value = '', className = '', ...attrs }) {
  const attrString = Object.entries(attrs).map(([k, v]) => `${k}="${v}"`).join(' ');
  
  return `
    <input 
      ${id ? `id="${id}"` : ''} 
      type="${type}" 
      placeholder="${placeholder}" 
      value="${value}"
      class="w-full bg-slate-100 dark:bg-bg-input border border-slate-200 dark:border-border-light rounded-xl px-4 py-2.5 text-slate-900 dark:text-text-primary placeholder:text-slate-400 dark:placeholder:text-text-muted outline-none focus:ring-2 focus:ring-neo-green/20 focus:border-neo-green transition-all text-[14px] ${className}"
      ${attrString}
    />
  `;
}

export function TextArea({ id, placeholder = '', value = '', className = '', rows = '1', ...attrs }) {
  const attrString = Object.entries(attrs).map(([k, v]) => `${k}="${v}"`).join(' ');

  return `
    <textarea 
      ${id ? `id="${id}"` : ''} 
      placeholder="${placeholder}" 
      class="w-full bg-white dark:bg-bg-input border border-slate-200 dark:border-border-light rounded-xl px-4 py-3 text-slate-900 dark:text-text-primary placeholder:text-slate-400 dark:placeholder:text-text-muted outline-none focus:ring-2 focus:ring-neo-green/20 focus:border-neo-green transition-all text-sm resize-none ${className}"
      rows="${rows}"
      ${attrString}
    >${value}</textarea>
  `;
}
