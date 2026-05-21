import { Upload, X } from 'lucide-react';
import { useCallback, useState } from 'react';
import Badge from '../common/Badge.jsx';

const limitsByType = {
  'image/jpeg': 5 * 1024 * 1024,
  'image/png': 5 * 1024 * 1024,
  'image/webp': 5 * 1024 * 1024,
  'video/mp4': 50 * 1024 * 1024,
  'video/quicktime': 50 * 1024 * 1024,
  'application/pdf': 10 * 1024 * 1024
};
const allowedTypes = Object.keys(limitsByType);

const FileDropzone = ({ value = [], onChange, error }) => {
  const [localError, setLocalError] = useState('');

  const validateAndAdd = useCallback((fileList) => {
    const files = Array.from(fileList);
    const invalid = files.find((file) => !allowedTypes.includes(file.type) || file.size > limitsByType[file.type]);
    if (invalid) {
      setLocalError(`${invalid.name}: tipo no permitido o supera el limite permitido.`);
      return;
    }
    setLocalError('');
    onChange([...value, ...files]);
  }, [onChange, value]);

  return (
    <div className="grid gap-2">
      <label
        className="grid cursor-pointer place-items-center rounded-lg border border-dashed border-neutral-300 bg-white px-4 py-8 text-center transition hover:border-primary-500 hover:bg-primary-50"
        onDragOver={(event) => event.preventDefault()}
        onDrop={(event) => {
          event.preventDefault();
          validateAndAdd(event.dataTransfer.files);
        }}
      >
        <Upload className="h-8 w-8 text-neutral-400" />
        <span className="mt-2 text-sm font-semibold text-neutral-800">Arrastra evidencias o haz clic para subir</span>
        <span className="mt-1 text-xs text-neutral-500">Imagenes hasta 5 MB, videos MP4/MOV hasta 50 MB y PDF hasta 10 MB.</span>
        <input className="hidden" type="file" multiple accept=".jpg,.jpeg,.png,.webp,.mp4,.mov,.pdf" onChange={(event) => validateAndAdd(event.target.files)} />
      </label>
      {(error || localError) && <p className="text-xs font-medium text-danger">{error || localError}</p>}
      <div className="flex flex-wrap gap-2">
        {value.map((file) => (
          <Badge key={`${file.name}-${file.size}`} tone="primary" className="gap-1">
            {file.name}
            <button type="button" onClick={() => onChange(value.filter((item) => item !== file))} aria-label={`Quitar ${file.name}`}>
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}
      </div>
    </div>
  );
};

export default FileDropzone;
