import { useEffect, useRef, useState } from 'react';
import { IconButton, Icon } from './ui.jsx';

const DEVICES = [
  { key: 'phone', label: 'Celular', width: 390, icon: 'phone' },
  { key: 'tablet', label: 'Tablet', width: 768, icon: 'tablet' },
  { key: 'desktop', label: 'Escritorio', width: 1366, icon: 'monitor' },
];

// Vista previa en vivo de la invitación dentro del CMS. Se actualiza sola (SSE).
export default function PreviewFrame({ focusKey }) {
  const [device, setDevice] = useState('phone');
  const [open, setOpen] = useState(() => window.matchMedia('(min-width: 1280px)').matches);
  const frame = useRef(null);
  const box = useRef(null);
  const [scale, setScale] = useState(1);
  const width = DEVICES.find((d) => d.key === device).width;

  useEffect(() => {
    if (!open || !box.current) return undefined;
    const ro = new ResizeObserver(([entry]) => setScale(Math.min(1, entry.contentRect.width / width)));
    ro.observe(box.current);
    return () => ro.disconnect();
  }, [open, width]);

  const scrollTo = () => {
    if (focusKey) frame.current?.contentWindow?.postMessage({ type: 'xv:scroll-to', key: focusKey }, window.location.origin);
  };
  useEffect(scrollTo, [focusKey]);

  return (
    <aside className={`a-preview ${open ? 'is-open' : ''}`}>
      <div className="a-preview__bar">
        <button type="button" className="a-preview__toggle" onClick={() => setOpen((v) => !v)} aria-expanded={open}>
          <Icon name="eye" size={16} /> Vista previa
        </button>
        {open && (
          <div className="a-preview__devices">
            {DEVICES.map((d) => (
              <IconButton key={d.key} icon={d.icon} label={d.label} variant={device === d.key ? 'active' : 'ghost'} onClick={() => setDevice(d.key)} />
            ))}
            <IconButton icon="refresh" label="Recargar" onClick={() => frame.current?.contentWindow?.location.reload()} />
          </div>
        )}
      </div>
      {open && (
        <div className="a-preview__viewport" ref={box}>
          <div className="a-preview__device" style={{ width, height: `${100 / scale}%`, transform: `scale(${scale})` }}>
            <iframe ref={frame} title="Vista previa de la invitación" src="/?preview=1" onLoad={() => setTimeout(scrollTo, 600)} />
          </div>
        </div>
      )}
    </aside>
  );
}
