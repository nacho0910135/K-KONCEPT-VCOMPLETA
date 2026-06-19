import { FileText, Image as ImageIcon, Play, ExternalLink } from 'lucide-react';
import { useState } from 'react';
import clsx from 'clsx';
import Modal from '../common/Modal.jsx';

const getEvidenceUrl = (item) => item.fileUrl || item.url;
const getEvidenceName = (item) => item.fileName || item.name || 'Evidencia';
const getEvidenceMime = (item) => item.mimeType || '';
const getEvidenceType = (item) => String(item.fileType || '').toUpperCase();

const isImageEvidence = (item) => getEvidenceType(item) === 'IMAGE' || getEvidenceMime(item).startsWith('image/');
const isVideoEvidence = (item) => getEvidenceType(item) === 'VIDEO' || getEvidenceMime(item).startsWith('video/');
const isPdfEvidence = (item) => getEvidenceMime(item) === 'application/pdf' || getEvidenceName(item).toLowerCase().endsWith('.pdf');

const Preview = ({ item, large = false }) => {
  const url = getEvidenceUrl(item);
  const name = getEvidenceName(item);

  if (isImageEvidence(item) && url) {
    return <img className={clsx('w-full rounded-md bg-neutral-100 object-contain', large ? 'max-h-[72vh]' : 'h-36')} src={url} alt={name} />;
  }

  if (isVideoEvidence(item) && url) {
    return <video className={clsx('w-full rounded-md bg-neutral-900 object-contain', large ? 'max-h-[72vh]' : 'h-36')} src={url} controls={large} muted={!large} />;
  }

  if (isPdfEvidence(item) && url) {
    return large ? (
      <iframe className="h-[72vh] w-full rounded-md border border-neutral-200" src={url} title={name} />
    ) : (
      <div className="grid h-36 place-items-center rounded-md bg-neutral-100 text-neutral-600">
        <FileText className="h-10 w-10" />
      </div>
    );
  }

  return (
    <div className={clsx('grid place-items-center rounded-md bg-neutral-100 text-neutral-500', large ? 'min-h-80' : 'h-36')}>
      {isVideoEvidence(item) ? <Play className="h-10 w-10" /> : <ImageIcon className="h-10 w-10" />}
    </div>
  );
};

const EvidenceGallery = ({ evidences = [], emptyText = 'No hay evidencias adjuntas registradas.', columns = 'sm:grid-cols-2' }) => {
  const [selectedEvidence, setSelectedEvidence] = useState(null);
  const selectedUrl = selectedEvidence ? getEvidenceUrl(selectedEvidence) : '';

  if (!evidences.length) {
    return <p className="mt-3 text-sm text-neutral-500">{emptyText}</p>;
  }

  return (
    <>
      <div className={clsx('mt-4 grid gap-3', columns)}>
        {evidences.map((item) => (
          <button
            key={item.id || getEvidenceName(item)}
            type="button"
            className="group overflow-hidden rounded-lg border border-neutral-200 bg-white p-2 text-left transition hover:border-primary-200 hover:bg-neutral-50 hover:shadow-sm"
            onClick={() => getEvidenceUrl(item) && setSelectedEvidence(item)}
          >
            <Preview item={item} />
            <div className="mt-2 flex items-center justify-between gap-2 px-1">
              <span className="truncate text-xs font-semibold text-neutral-700">{getEvidenceName(item)}</span>
              {getEvidenceUrl(item) && <ExternalLink className="h-3.5 w-3.5 shrink-0 text-neutral-400 group-hover:text-primary-600" />}
            </div>
          </button>
        ))}
      </div>

      <Modal
        isOpen={Boolean(selectedEvidence)}
        title={selectedEvidence ? getEvidenceName(selectedEvidence) : 'Evidencia'}
        onClose={() => setSelectedEvidence(null)}
        maxWidth="max-w-5xl"
      >
        {selectedEvidence && selectedUrl && (
          <div className="grid gap-3">
            <Preview item={selectedEvidence} large />
            <a className="inline-flex items-center justify-center gap-2 rounded-md bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700" href={selectedUrl} target="_blank" rel="noreferrer">
              Abrir archivo <ExternalLink className="h-4 w-4" />
            </a>
          </div>
        )}
      </Modal>
    </>
  );
};

export default EvidenceGallery;
