// Instead of a hardcoded string, we pull from the environment
const EXPECTED_HASH = import.meta.env.VITE_PASSWORD_HASH;

export default function Login({ onLogin }: { onLogin: () => void }) {
  // ... the rest of the logic remains the same
  const checkPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!EXPECTED_HASH) {
      console.error("Security hash missing in build!");
      return;
    }
    
    const msgUint8 = new TextEncoder().encode(pw);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
    const hashHex = Array.from(new Uint8Array(hashBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    
    if (hashHex === EXPECTED_HASH) {
      localStorage.setItem('auth', 'true');
      onLogin();
    } else {
      alert('Wrong password');
    }
  };
  // ...
}