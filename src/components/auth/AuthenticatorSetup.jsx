import QRCode from 'qrcode';
import { useEffect, useState } from 'react';

const AuthenticatorSetup = ({ setupCode, setupUri }) => {
  const [qrCode, setQrCode] = useState('');

  useEffect(() => {
    let active = true;
    setQrCode('');
    if (setupUri) {
      QRCode.toDataURL(setupUri, { width: 224, margin: 2, errorCorrectionLevel: 'M' })
        .then((value) => { if (active) setQrCode(value); })
        .catch(() => {});
    }
    return () => { active = false; };
  }, [setupUri]);

  return (
    <div className="grid gap-3 text-center">
      <p className="text-sm text-neutral-700">Escanea este QR con Google Authenticator.</p>
      <div className="mx-auto grid min-h-56 w-56 place-items-center overflow-hidden rounded-xl border border-neutral-200 bg-white p-2">
        {qrCode ? <img className="h-52 w-52" src={qrCode} alt="Código QR para vincular Google Authenticator" /> : <span className="text-sm text-neutral-500">Generando QR…</span>}
      </div>
      <details className="text-left">
        <summary className="cursor-pointer text-sm font-semibold text-primary-700">Ingresar una clave manualmente</summary>
        <code className="mt-2 block break-all rounded-md bg-neutral-100 p-3 text-center text-sm font-bold tracking-widest text-neutral-900">{setupCode}</code>
      </details>
    </div>
  );
};

export default AuthenticatorSetup;
