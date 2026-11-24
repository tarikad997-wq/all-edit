export function LogoMark({ size = 40 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 512 512" aria-hidden="true"><defs>
    <linearGradient id="ae-g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#6d28d9" /><stop offset=".55" stopColor="#db2777" /><stop offset="1" stopColor="#f59e0b" /></linearGradient>
    <linearGradient id="ae-s" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#fff" stopOpacity=".2" /><stop offset="1" stopColor="#fff" stopOpacity="0" /></linearGradient>
    <clipPath id="ae-c"><rect width="512" height="512" rx="120" /></clipPath></defs>
    <rect width="512" height="512" rx="120" fill="url(#ae-g)" /><rect width="512" height="240" fill="url(#ae-s)" clipPath="url(#ae-c)" />
    <path d="M256 114 146 396M256 114 366 396" stroke="#fff" strokeWidth="56" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    <path d="M229 286v68l66-34z" fill="#fff" stroke="#fff" strokeWidth="10" strokeLinejoin="round" />
    <path d="m404 112 11-32 11 32 32 11-32 11-11 32-11-32-32-11z" fill="#fff" /></svg>
}
export const Wordmark = () => <span className="wm" dir="ltr">All <b>Edit</b></span>
