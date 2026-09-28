// Definición de los campos editables de cada sección. El editor del CMS se genera a partir de aquí.
// Tipos: text, textarea, image, toggle, select, color, number, list

const heading = [
  { name: 'eyebrow', label: 'Texto superior (antetítulo)', type: 'text' },
  { name: 'title', label: 'Título', type: 'text' },
  { name: 'subtitle', label: 'Subtítulo', type: 'text' },
];

const galleryFields = [
  ...heading,
  { name: 'emptyText', label: 'Texto cuando no hay fotos', type: 'textarea' },
  { group: 'Formulario de subida' },
  { name: 'uploadTitle', label: 'Título del formulario', type: 'text' },
  { name: 'uploadText', label: 'Descripción del formulario', type: 'textarea' },
  { name: 'nameLabel', label: 'Etiqueta "nombre"', type: 'text' },
  { name: 'photoLabel', label: 'Etiqueta "fotografía"', type: 'text' },
  { name: 'messageLabel', label: 'Etiqueta "mensaje"', type: 'text' },
  { name: 'buttonText', label: 'Texto del botón', type: 'text' },
  { name: 'successText', label: 'Mensaje de éxito', type: 'textarea' },
];

export const SECTION_SCHEMAS = {
  cover: {
    note: 'La fecha se toma de "Invitación → Fecha del evento" si dejas vacío el campo de fecha.',
    fields: [
      { name: 'photo', label: 'Foto principal', type: 'image', folder: 'portada' },
      { name: 'eyebrow', label: 'Título superior (ej. MIS XV)', type: 'text' },
      { name: 'name', label: 'Nombre', type: 'text', hint: 'Vacío = nombre de la quinceañera configurado en "Invitación".' },
      { name: 'dateText', label: 'Fecha a mostrar', type: 'text', hint: 'Vacío = se genera automáticamente (19 • SEPTIEMBRE • 2027).' },
      { name: 'text', label: 'Texto', type: 'textarea' },
      { name: 'buttonText', label: 'Texto del botón', type: 'text' },
      { name: 'scrollHint', label: 'Texto al abrir (indicador de desplazamiento)', type: 'text' },
      { group: 'Composición' },
      {
        name: 'layout',
        label: 'Posición de la foto',
        type: 'select',
        options: [
          { value: 'split', label: 'Foto al lado del texto' },
          { value: 'centered', label: 'Foto de fondo, texto centrado' },
        ],
      },
      {
        name: 'photoShape',
        label: 'Forma de la foto',
        type: 'select',
        options: [
          { value: 'arch', label: 'Arco' },
          { value: 'circle', label: 'Círculo' },
          { value: 'rectangle', label: 'Rectángulo' },
        ],
      },
      { name: 'showPetals', label: 'Pétalos flotantes', type: 'toggle' },
      { name: 'showParticles', label: 'Partículas brillantes', type: 'toggle' },
    ],
  },
  intro: {
    fields: [
      { name: 'eyebrow', label: 'Texto superior', type: 'text' },
      { name: 'title', label: 'Título', type: 'text' },
      { name: 'text', label: 'Texto principal', type: 'textarea', rows: 5, hint: 'Deja una línea en blanco para separar párrafos.' },
      { name: 'signature', label: 'Firma', type: 'text' },
      { name: 'image', label: 'Imagen (opcional)', type: 'image', folder: 'secciones' },
    ],
  },
  countdown: {
    note: 'La cuenta regresiva usa la fecha y hora de "Invitación → Fecha del evento".',
    fields: [
      ...heading,
      { name: 'daysLabel', label: 'Etiqueta días', type: 'text' },
      { name: 'hoursLabel', label: 'Etiqueta horas', type: 'text' },
      { name: 'minutesLabel', label: 'Etiqueta minutos', type: 'text' },
      { name: 'secondsLabel', label: 'Etiqueta segundos', type: 'text' },
      { name: 'finishedText', label: 'Texto al llegar la fecha', type: 'text' },
    ],
  },
  message: {
    fields: [
      ...heading,
      { name: 'text', label: 'Mensaje', type: 'textarea', rows: 6, hint: 'Deja una línea en blanco para separar párrafos.' },
      { name: 'signature', label: 'Firma', type: 'text' },
      { name: 'image', label: 'Imagen (opcional)', type: 'image', folder: 'secciones' },
    ],
  },
  parents: {
    fields: [
      ...heading,
      { name: 'text', label: 'Texto adicional', type: 'textarea' },
      {
        name: 'people',
        label: 'Personas',
        type: 'list',
        addLabel: 'Agregar persona',
        itemFields: [
          { name: 'role', label: 'Rol (ej. Mamá)', type: 'text' },
          { name: 'name', label: 'Nombre completo', type: 'text' },
        ],
      },
    ],
  },
  godparents: {
    fields: [
      ...heading,
      { name: 'text', label: 'Texto adicional', type: 'textarea' },
      {
        name: 'people',
        label: 'Padrinos',
        type: 'list',
        addLabel: 'Agregar padrinos',
        itemFields: [
          { name: 'role', label: 'Tipo (ej. Padrinos de velación)', type: 'text' },
          { name: 'name', label: 'Nombres', type: 'text' },
        ],
      },
    ],
  },
  calendar: {
    note: 'El mes y el día marcado se generan con la fecha de "Invitación".',
    fields: [
      ...heading,
      { name: 'note', label: 'Nota debajo del calendario', type: 'text' },
      {
        name: 'weekStartsOn',
        label: 'La semana inicia en',
        type: 'select',
        options: [
          { value: 'monday', label: 'Lunes' },
          { value: 'sunday', label: 'Domingo' },
        ],
      },
    ],
  },
  ceremony: {
    venue: 'ceremony',
    fields: [
      ...heading,
      { name: 'timeLabel', label: 'Etiqueta de hora', type: 'text' },
      { name: 'addressLabel', label: 'Etiqueta de dirección', type: 'text' },
      { name: 'buttonText', label: 'Texto del botón de mapa', type: 'text' },
    ],
  },
  reception: {
    venue: 'reception',
    fields: [
      ...heading,
      { name: 'timeLabel', label: 'Etiqueta de hora', type: 'text' },
      { name: 'addressLabel', label: 'Etiqueta de dirección', type: 'text' },
      { name: 'buttonText', label: 'Texto del botón de mapa', type: 'text' },
    ],
  },
  itinerary: { manager: 'itinerary', fields: heading },
  dresscode: {
    fields: [
      ...heading,
      { name: 'description', label: 'Descripción', type: 'textarea' },
      { name: 'image', label: 'Imagen', type: 'image', folder: 'secciones' },
      { name: 'reservedTitle', label: 'Título de colores reservados', type: 'text' },
      {
        name: 'reservedColors',
        label: 'Colores reservados',
        type: 'list',
        addLabel: 'Agregar color',
        itemFields: [
          { name: 'name', label: 'Nombre', type: 'text' },
          { name: 'color', label: 'Color', type: 'color' },
        ],
      },
      { name: 'notes', label: 'Observaciones', type: 'textarea' },
    ],
  },
  story: { manager: 'story', fields: heading },
  memories: { siteToggle: 'memoryUploadsEnabled', siteToggleLabel: 'Permitir que los invitados suban recuerdos', galleryLink: '/admin/galeria-recuerdos', fields: galleryFields },
  party: {
    siteToggle: 'partyUploadsEnabled',
    siteToggleLabel: 'Permitir subir fotos de la fiesta',
    galleryLink: '/admin/galeria-fiesta',
    fields: [...galleryFields, { name: 'closedText', label: 'Texto cuando la subida está cerrada', type: 'textarea' }],
  },
  rsvp: {
    siteToggle: 'rsvpEnabled',
    siteToggleLabel: 'Confirmación de asistencia abierta',
    fields: [
      ...heading,
      { group: 'Búsqueda' },
      { name: 'searchLabel', label: 'Etiqueta de búsqueda', type: 'text' },
      { name: 'searchPlaceholder', label: 'Ejemplo dentro del campo', type: 'text' },
      { name: 'searchButton', label: 'Botón de búsqueda', type: 'text' },
      { name: 'notFoundText', label: 'Mensaje si no se encuentra', type: 'textarea' },
      { name: 'multipleText', label: 'Mensaje con varias coincidencias', type: 'text' },
      { name: 'deadlineText', label: 'Texto de fecha límite', type: 'text' },
      { group: 'Confirmación' },
      { name: 'foundTitle', label: 'Texto al encontrar la invitación', type: 'text' },
      { name: 'familyPrefix', label: 'Prefijo de familia', type: 'text' },
      { name: 'attendingLabel', label: 'Opción "sí asistiré"', type: 'text' },
      { name: 'notAttendingLabel', label: 'Opción "no asistiré"', type: 'text' },
      { name: 'messageLabel', label: 'Etiqueta del mensaje', type: 'text' },
      { name: 'submitButton', label: 'Botón de confirmar', type: 'text' },
      { name: 'successTitle', label: 'Título de éxito', type: 'text' },
      { name: 'successText', label: 'Mensaje de éxito', type: 'textarea' },
      { name: 'searchAgain', label: 'Enlace "buscar otra"', type: 'text' },
      { name: 'closedText', label: 'Mensaje cuando está cerrada', type: 'text' },
    ],
  },
  dedications: {
    siteToggle: 'dedicationsEnabled',
    siteToggleLabel: 'Permitir escribir dedicatorias',
    galleryLink: '/admin/dedicatorias',
    fields: [
      ...heading,
      { name: 'nameLabel', label: 'Etiqueta "nombre"', type: 'text' },
      { name: 'messageLabel', label: 'Etiqueta "mensaje"', type: 'text' },
      { name: 'buttonText', label: 'Texto del botón', type: 'text' },
      { name: 'successText', label: 'Mensaje de éxito', type: 'textarea' },
      { name: 'emptyText', label: 'Texto cuando no hay dedicatorias', type: 'text' },
    ],
  },
  footer: {
    fields: [
      { name: 'title', label: 'Título', type: 'text' },
      { name: 'text', label: 'Texto', type: 'textarea' },
      { name: 'signature', label: 'Firma', type: 'text' },
      { name: 'hashtag', label: 'Hashtag', type: 'text' },
      { name: 'credits', label: 'Créditos', type: 'text' },
    ],
  },
};

export const ANIMATION_OPTIONS = [
  { value: 'fadeInUp', label: 'Aparecer desde abajo' },
  { value: 'fadeIn', label: 'Aparecer suave' },
  { value: 'fadeInDown', label: 'Aparecer desde arriba' },
  { value: 'scaleIn', label: 'Acercar (zoom)' },
  { value: 'slideFromLeft', label: 'Deslizar desde la izquierda' },
  { value: 'slideFromRight', label: 'Deslizar desde la derecha' },
  { value: 'blurIn', label: 'Enfocar (desenfoque)' },
  { value: 'none', label: 'Sin animación' },
];

export const DECORATION_OPTIONS = [
  { value: 'flowers', label: 'Ramas florales' },
  { value: 'sparkles', label: 'Destellos' },
  { value: 'none', label: 'Sin decoración' },
];

export const ALIGN_OPTIONS = [
  { value: 'center', label: 'Centrado' },
  { value: 'left', label: 'Izquierda' },
  { value: 'right', label: 'Derecha' },
];
