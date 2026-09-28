import { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { Link } from 'react-router-dom';
import { useApi } from '../hooks.js';
import { Badge, Button, Card, Field, Icon, Loading, PageHeader, Select, useToast } from '../components/ui.jsx';

const TARGETS = [
  { value: '/subir-foto', label: 'Subir fotos de la fiesta (/subir-foto)' },
  { value: '/', label: 'Invitación completa' },
];

export default function QrPage() {
  const toast = useToast();
  const settings = useApi('/api/settings');
  const theme = useApi('/api/theme');
  const canvas = useRef(null);
  const [target, setTarget] = useState('/subir-foto');
  const [dark, setDark] = useState('');

  const base = (settings.data?.settings.publicUrl || window.location.origin).replace(/\/$/, '');
  const url = `${base}${target === '/' ? '/' : target}`;
  const color = dark || theme.data?.theme.textColor || '#3d2a30';

  useEffect(() => {
    if (!canvas.current || !settings.data) return;
    QRCode.toCanvas(canvas.current, url, { width: 720, margin: 2, errorCorrectionLevel: 'H', color: { dark: color, light: '#ffffff' } }).catch(() => toast('No se pudo generar el QR', 'error'));
  }, [url, color, settings.data, toast]);

  function download() {
    const link = document.createElement('a');
    link.download = target === '/subir-foto' ? 'qr-subir-fotos.png' : 'qr-invitacion.png';
    link.href = canvas.current.toDataURL('image/png');
    link.click();
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      toast('Enlace copiado');
    } catch {
      toast('No se pudo copiar', 'error');
    }
  }

  if (!settings.data) return <Loading />;
  const partyOpen = settings.data.settings.partyUploadsEnabled;

  return (
    <div className="a-page">
      <PageHeader title="QR de fotografías" description="Imprime este código para que los invitados suban sus fotos durante la fiesta." />
      <div className="a-grid a-grid--qr">
        <Card>
          <div className="a-qr">
            <canvas ref={canvas} className="a-qr__canvas" aria-label={`Código QR para ${url}`} />
            <p className="a-qr__url">{url}</p>
          </div>
        </Card>
        <Card title="Opciones">
          <div className="a-form-stack">
            <Field label="El QR dirige a">
              <Select value={target} onChange={(e) => setTarget(e.target.value)} options={TARGETS} />
            </Field>
            <Field label="Color del código" hint="Usa un color oscuro para que se lea bien.">
              <input type="color" value={color} onChange={(e) => setDark(e.target.value)} className="a-color-input" />
            </Field>
            <div className="a-inline">
              <Button icon="download" onClick={download}>
                Descargar PNG
              </Button>
              <Button variant="ghost" icon="copy" onClick={copy}>
                Copiar enlace
              </Button>
            </div>
            {target === '/subir-foto' && (
              <div className={`a-notice ${partyOpen ? '' : 'a-notice--warn'}`}>
                <Icon name={partyOpen ? 'check' : 'lock'} size={16} />
                <span>
                  Subida de fotos de la fiesta: <Badge tone={partyOpen ? 'green' : 'amber'}>{partyOpen ? 'ON' : 'OFF'}</Badge>{' '}
                  <Link to="/admin/galeria-fiesta" className="a-link">
                    Cambiar
                  </Link>
                </span>
              </div>
            )}
            {!settings.data.settings.publicUrl && (
              <p className="a-field__hint">
                El QR usa la dirección actual ({window.location.origin}). Configura la URL pública definitiva en <Link to="/admin/configuracion">Configuración</Link> antes de imprimir.
              </p>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
