import ImageUploader from './ImageUploader.jsx';
import { ColorField } from './ColorFields.jsx';
import { Button, Field, Input, IconButton, Select, TextArea, Toggle } from './ui.jsx';

// Genera los controles del CMS a partir de un esquema de campos.
export function SchemaField({ field, value, onChange }) {
  switch (field.type) {
    case 'textarea':
      return (
        <Field label={field.label} hint={field.hint}>
          <TextArea value={value ?? ''} rows={field.rows || 3} onChange={(e) => onChange(e.target.value)} />
        </Field>
      );
    case 'image':
      return (
        <div className="a-field">
          <span className="a-field__label">{field.label}</span>
          <ImageUploader value={value} onChange={onChange} folder={field.folder} label={field.label} />
        </div>
      );
    case 'toggle':
      return <Toggle checked={value !== false} onChange={onChange} label={field.label} description={field.hint} />;
    case 'select':
      return (
        <Field label={field.label} hint={field.hint}>
          <Select value={value ?? field.options[0].value} onChange={(e) => onChange(e.target.value)} options={field.options} />
        </Field>
      );
    case 'color':
      return <ColorField label={field.label} value={value ?? ''} onChange={onChange} hint={field.hint} />;
    case 'number':
      return (
        <Field label={field.label} hint={field.hint}>
          <Input type="number" value={value ?? ''} onChange={(e) => onChange(e.target.value === '' ? '' : Number(e.target.value))} />
        </Field>
      );
    case 'list':
      return <ListField field={field} value={Array.isArray(value) ? value : []} onChange={onChange} />;
    default:
      return (
        <Field label={field.label} hint={field.hint}>
          <Input value={value ?? ''} onChange={(e) => onChange(e.target.value)} />
        </Field>
      );
  }
}

function ListField({ field, value, onChange }) {
  const update = (index, patch) => onChange(value.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  const move = (index, dir) => {
    const next = [...value];
    const target = index + dir;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  };
  const empty = Object.fromEntries(field.itemFields.map((f) => [f.name, f.type === 'color' ? '#e8a3b3' : '']));

  return (
    <div className="a-field">
      <span className="a-field__label">{field.label}</span>
      <div className="a-list">
        {value.map((item, index) => (
          <div key={index} className="a-list__item">
            <div className="a-list__fields">
              {field.itemFields.map((f) => (
                <SchemaField key={f.name} field={f} value={item?.[f.name]} onChange={(v) => update(index, { [f.name]: v })} />
              ))}
            </div>
            <div className="a-list__actions">
              <IconButton icon="arrowUp" label="Subir" onClick={() => move(index, -1)} disabled={index === 0} />
              <IconButton icon="arrowDown" label="Bajar" onClick={() => move(index, 1)} disabled={index === value.length - 1} />
              <IconButton icon="trash" label="Eliminar" variant="danger" onClick={() => onChange(value.filter((_, i) => i !== index))} />
            </div>
          </div>
        ))}
        <Button variant="soft" icon="plus" onClick={() => onChange([...value, empty])}>
          {field.addLabel || 'Agregar'}
        </Button>
      </div>
    </div>
  );
}

export default function SchemaFields({ fields, values, onChange }) {
  return (
    <div className="a-form-stack">
      {fields.map((field, i) =>
        field.group ? (
          <h3 key={`g-${i}`} className="a-form-group">
            {field.group}
          </h3>
        ) : (
          <SchemaField key={field.name} field={field} value={values?.[field.name]} onChange={(v) => onChange({ ...values, [field.name]: v })} />
        ),
      )}
    </div>
  );
}
