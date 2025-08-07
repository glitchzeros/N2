export function bootstrap(): void {
  const app = document.getElementById('app');
  if (app) {
    const p = document.createElement('p');
    p.textContent = 'Project scaffolding ready.';
    app.appendChild(p);
  }
}

if (typeof window !== 'undefined') {
  bootstrap();
}
